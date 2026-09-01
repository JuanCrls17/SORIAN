import { MAP, PATHS, ANIMATION_INTERVAL } from "../config.js";
import { load } from "../data.js";
import { el, clear, spinner, errorBox } from "../ui/dom.js";
import { createGridLayer } from "./grid-layer.js";
import { buildLegend, describeBin } from "./legend.js";

export function createViewer(container, controls) {
  const mapNode = el("div", { class: "viewer__map" });
  const legendNode = el("div", { class: "viewer__panel viewer__panel--legend" });
  const timeline = el("div", { class: "viewer__panel viewer__panel--time" });
  const readout = el("div", { class: "viewer__readout", "aria-live": "polite" });

  container.append(
    mapNode,
    el("div", { class: "viewer__overlay viewer__overlay--top" }, [controls]),
    el("div", { class: "viewer__overlay viewer__overlay--bottom" }, [legendNode, timeline]),
    readout,
  );

  const L = window.L;
  const GridLayer = createGridLayer(L);

  const map = L.map(mapNode, {
    center: MAP.center,
    zoom: MAP.zoom,
    minZoom: MAP.minZoom,
    maxZoom: MAP.maxZoom,
    zoomControl: false,
    preferCanvas: true,
    zoomSnap: 0,
    zoomDelta: 0.5,
  });

  L.tileLayer(MAP.tiles, { attribution: MAP.attribution, maxZoom: MAP.maxZoom }).addTo(map);
  L.control.zoom({ position: "topright" }).addTo(map);

  let grid = null;
  let layer = null;
  let borders = null;
  let index = 0;
  let timer = null;
  let framed = false;
  let request = 0;

  load(PATHS.borders)
    .then((geo) => {
      borders = L.geoJSON(geo, {
        style: { color: "#37474f", weight: 0.8, opacity: 0.85, fill: false },
        interactive: false,
      }).addTo(map);
    })
    .catch(() => { /* el mapa sigue siendo utilizable sin fronteras */ });

  function renderTimeline() {
    clear(timeline).append(
      el("button", {
        class: "timeline__play", type: "button",
        "aria-label": timer ? "Pausar animación" : "Reproducir animación",
        onClick: toggle,
      }, timer ? "❚❚" : "▶"),
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
    clearInterval(timer);
    timer = null;
  }

  /**
   * El dominio es mas alto que ancho, asi que encajarlo entero deja franjas
   * vacias en pantallas apaisadas. Se toma un punto medio entre el zoom que
   * lo encaja y el que lo cubre: llena la vista sin recortar de mas.
   */
  function frame({ lat0, lon0, dlat, dlon, ny, nx }) {
    const bounds = L.latLngBounds([lat0, lon0], [lat0 + ny * dlat, lon0 + nx * dlon]);
    const fit = map.getBoundsZoom(bounds, false);
    const cover = map.getBoundsZoom(bounds, true);
    map.setView(bounds.getCenter(), Math.min(fit + (cover - fit) * 0.55, MAP.maxZoom));
  }

  function report(latlng) {
    const bin = layer?.valueAt(latlng);
    readout.textContent = bin == null
      ? ""
      : `${describeBin(grid.scale, bin)} · ${latlng.lat.toFixed(1)}°, ${latlng.lng.toFixed(1)}°`;
  }

  map.on("mousemove", (event) => report(event.latlng));
  map.on("click", (event) => report(event.latlng));
  map.on("mouseout", () => { readout.textContent = ""; });

  async function open(model, variable) {
    stop();
    const ticket = ++request;
    clear(legendNode).append(spinner("Cargando…"));

    let data;
    try {
      data = await load(PATHS.grid(model, variable));
    } catch (error) {
      if (ticket !== request) return;
      clear(legendNode).append(errorBox("No se pudo cargar.", () => open(model, variable)));
      return;
    }

    if (ticket !== request) return;
    grid = data;

    if (layer) map.removeLayer(layer);
    layer = new GridLayer(grid.grid, grid.scale.map((bin) => bin.color));
    layer.addTo(map);
    borders?.bringToFront();

    if (!framed) {
      frame(grid.grid);
      framed = true;
    }

    index = 0;
    show(0);
    clear(legendNode).append(buildLegend(grid.scale, grid.title));
  }

  return {
    open,
    stop,
    invalidate: () => map.invalidateSize(),
    destroy: () => { stop(); map.remove(); },
  };
}
