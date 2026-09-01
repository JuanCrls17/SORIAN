import { MAP, PATHS, ANIMATION_INTERVAL } from "../config.js";
import { load } from "../data.js";
import { el, clear, spinner, errorBox } from "../ui/dom.js";
import { createGridLayer } from "./grid-layer.js";
import { buildLegend, describeBin } from "./legend.js";

export function createViewer(container) {
  const mapNode = el("div", { class: "viewer__map" });
  const legendNode = el("div", { class: "viewer__legend" });
  const readout = el("div", { class: "viewer__readout", "aria-live": "polite" });
  const timeline = el("div", { class: "timeline" });

  container.append(mapNode, legendNode, readout, timeline);

  const L = window.L;
  const GridLayer = createGridLayer(L);

  const map = L.map(mapNode, {
    center: MAP.center,
    zoom: MAP.zoom,
    minZoom: MAP.minZoom,
    maxZoom: MAP.maxZoom,
    zoomControl: false,
    preferCanvas: true,
    attributionControl: true,
    zoomSnap: 0,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 120,
  });

  L.tileLayer(MAP.tiles, { attribution: MAP.attribution, maxZoom: MAP.maxZoom }).addTo(map);
  L.control.zoom({ position: "bottomright" }).addTo(map);

  let grid = null;
  let layer = null;
  let borders = null;
  let index = 0;
  let timer = null;
  let framed = false;

  load(PATHS.borders)
    .then((geo) => {
      borders = L.geoJSON(geo, {
        style: { color: "#37474f", weight: 0.8, opacity: 0.85, fill: false },
        interactive: false,
      }).addTo(map);
    })
    .catch(() => { /* el mapa sigue siendo utilizable sin fronteras */ });

  function renderTimeline() {
    clear(timeline);
    timeline.append(
      el("button", {
        class: "timeline__play", type: "button",
        "aria-label": "Reproducir animación", onClick: toggle,
      }, [el("span", { class: "timeline__icon", text: timer ? "⏸" : "▶" })]),
      el("div", { class: "timeline__steps", role: "tablist" },
        grid.months.map((month, i) =>
          el("button", {
            class: `timeline__step${i === index ? " is-active" : ""}`,
            type: "button", role: "tab", "aria-selected": String(i === index),
            text: month, onClick: () => show(i),
          }),
        ),
      ),
    );
  }

  function show(next) {
    index = next;
    layer.setFrame(grid.frames[index]);
    renderTimeline();
  }

  function toggle() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    } else {
      timer = setInterval(() => show((index + 1) % grid.months.length), ANIMATION_INTERVAL);
    }
    renderTimeline();
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  map.on("mousemove", (event) => {
    if (!layer) return;
    const bin = layer.valueAt(event.latlng);
    readout.textContent = bin === null
      ? ""
      : `${describeBin(grid.scale, bin)} · ${event.latlng.lat.toFixed(1)}°, ${event.latlng.lng.toFixed(1)}°`;
  });
  map.on("mouseout", () => { readout.textContent = ""; });

  async function open(model, variable) {
    stop();
    clear(legendNode).append(spinner("Cargando pronóstico…"));

    try {
      grid = await load(PATHS.grid(model, variable));
    } catch (error) {
      clear(legendNode).append(errorBox("No se pudo cargar el pronóstico.", () => open(model, variable)));
      return;
    }

    if (layer) map.removeLayer(layer);
    layer = new GridLayer(grid.grid, grid.scale.map((bin) => bin.color));
    layer.addTo(map);
    borders?.bringToFront();

    if (!framed) {
      const { lat0, lon0, dlat, dlon, ny, nx } = grid.grid;
      map.fitBounds([[lat0, lon0], [lat0 + ny * dlat, lon0 + nx * dlon]], { padding: [4, 4] });
      framed = true;
    }

    index = 0;
    show(0);
    clear(legendNode).append(buildLegend(grid.scale, grid.title));
    return grid;
  }

  return {
    open,
    stop,
    invalidate: () => map.invalidateSize(),
    setOpacity: (value) => layer?.setOpacity(value),
    destroy: () => { stop(); map.remove(); },
  };
}
