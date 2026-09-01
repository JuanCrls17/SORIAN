import { decodeFrame } from "../data.js";

const NO_DATA = 255;

/**
 * Dibuja una grilla regular sobre el mapa usando un unico canvas.
 * Sustituye las ~26.000 llamadas L.polygon() del visor original.
 */
export function createGridLayer(L) {
  return L.Layer.extend({
    initialize(grid, palette) {
      this._grid = grid;
      this._palette = palette;
      this._frame = null;
      this._opacity = 0.75;
      this._clip = null;
    },

    onAdd(map) {
      this._map = map;
      this._canvas = L.DomUtil.create("canvas", "grid-layer");
      this._ctx = this._canvas.getContext("2d");
      map.getPane("overlayPane").appendChild(this._canvas);
      map.on("moveend zoomend resize", this._render, this);
      map.on("zoomanim", this._onZoomAnim, this);
      this._reset();
    },

    onRemove(map) {
      map.off("moveend zoomend resize", this._render, this);
      map.off("zoomanim", this._onZoomAnim, this);
      this._canvas.remove();
    },

    setFrame(base64) {
      this._frame = decodeFrame(base64);
      this._render();
    },

    setOpacity(value) {
      this._opacity = value;
      this._render();
    },

    /** Limita el dibujo a una banda horizontal, para comparar dos capas. */
    setClip(from, to) {
      this._clip = from === null ? null : { from, to };
      this._render();
    },

    valueAt(latlng) {
      if (!this._frame) return null;
      const { lat0, lon0, dlat, dlon, ny, nx } = this._grid;
      const row = Math.floor((latlng.lat - lat0) / dlat);
      const col = Math.floor((latlng.lng - lon0) / dlon);
      if (row < 0 || row >= ny || col < 0 || col >= nx) return null;
      const index = this._frame[row * nx + col];
      return index === NO_DATA ? null : index;
    },

    _onZoomAnim(event) {
      const scale = this._map.getZoomScale(event.zoom, this._map.getZoom());
      const offset = this._map._latLngToNewLayerPoint(
        this._map.getBounds().getNorthWest(), event.zoom, event.center,
      );
      L.DomUtil.setTransform(this._canvas, offset, scale);
    },

    _reset() {
      const size = this._map.getSize();
      this._canvas.width = size.x * (window.devicePixelRatio || 1);
      this._canvas.height = size.y * (window.devicePixelRatio || 1);
      this._canvas.style.width = `${size.x}px`;
      this._canvas.style.height = `${size.y}px`;
      this._render();
    },

    _render() {
      if (!this._map || !this._frame) return;

      const map = this._map;
      const size = map.getSize();
      const ratio = window.devicePixelRatio || 1;

      if (this._canvas.width !== size.x * ratio) return this._reset();

      L.DomUtil.setPosition(this._canvas, map.containerPointToLayerPoint([0, 0]));

      const ctx = this._ctx;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, size.x, size.y);

      ctx.save();
      if (this._clip) {
        ctx.beginPath();
        ctx.rect(this._clip.from, 0, this._clip.to - this._clip.from, size.y);
        ctx.clip();
      }
      ctx.globalAlpha = this._opacity;

      const { lat0, lon0, dlat, dlon, ny, nx } = this._grid;
      const bounds = map.getBounds();
      const firstRow = Math.max(0, Math.floor((bounds.getSouth() - lat0) / dlat));
      const lastRow = Math.min(ny - 1, Math.ceil((bounds.getNorth() - lat0) / dlat));
      const firstCol = Math.max(0, Math.floor((bounds.getWest() - lon0) / dlon));
      const lastCol = Math.min(nx - 1, Math.ceil((bounds.getEast() - lon0) / dlon));

      for (let row = firstRow; row <= lastRow; row += 1) {
        for (let col = firstCol; col <= lastCol; col += 1) {
          const index = this._frame[row * nx + col];
          if (index === NO_DATA) continue;

          const topLeft = map.latLngToContainerPoint([lat0 + (row + 1) * dlat, lon0 + col * dlon]);
          const bottomRight = map.latLngToContainerPoint([lat0 + row * dlat, lon0 + (col + 1) * dlon]);

          ctx.fillStyle = this._palette[index];
          ctx.fillRect(
            topLeft.x, topLeft.y,
            Math.ceil(bottomRight.x - topLeft.x) + 0.5,
            Math.ceil(bottomRight.y - topLeft.y) + 0.5,
          );
        }
      }
      ctx.restore();
    },
  });
}
