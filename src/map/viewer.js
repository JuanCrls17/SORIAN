import { MAP, PATHS, ANIMATION_INTERVAL } from "../config.js";
import { load } from "../data.js";
import { el, clear, spinner, errorBox } from "../ui/dom.js";
import { createGridLayer } from "./grid-layer.js";
import { buildLegend, describeBin } from "./legend.js";
import { createSwipe } from "./swipe.js";

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
    attributionControl: false,
  });

  L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);
  L.tileLayer(MAP.tiles, { attribution: MAP.attribution, maxZoom: MAP.maxZoom }).addTo(map);
  L.control.zoom({ position: "topright" }).addTo(map);

  const sides = {
    a: { grid: null, layer: null, request: 0 },
    b: { grid: null, layer: null, request: 0 },
  };

  let borders = null;
  let index = 0;
  let timer = null;
  let framed = false;
  let swipe = null;

  load(PATHS.borders)
    .then((geo) => {
      borders = L.geoJSON(geo, {
        style: { color: "#37474f", weight: 0.8, opacity: 0.85, fill: false },
        interactive: false,
      }).addTo(map);
    })
    .catch(() => { /* el mapa sigue siendo utilizable sin fronteras */ });

  function applyClip() {
    const width = map.getSize().x;
    if (!swipe) {
      sides.a.layer?.setClip(null);
      return;
    }
    const cut = width * swipe.ratio();
    sides.a.layer?.setClip(0, cut);
    sides.b.layer?.setClip(cut, width);
  }

  function renderTimeline() {
    const months = sides.a.grid?.months ?? [];
    clear(timeline).append(
      el("button", {
        class: "timeline__play", type: "button",
        "aria-label": timer ? "Pausar animación" : "Reproducir animación",
        onClick: toggle,
      }, timer ? "❚❚" : "▶"),
      el("div", { class: "timeline__steps", role: "tablist" },
        months.map((month, i) =>
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
    for (const side of Object.values(sides)) {
      if (side.grid && side.layer) side.layer.setFrame(side.grid.frames[index]);
    }
    renderTimeline();
  }

  function toggle() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    } else {
      const total = sides.a.grid?.months.length ?? 1;
      timer = setInterval(() => show((index + 1) % total), ANIMATION_INTERVAL);
    }
    renderTimeline();
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  function renderLegend() {
    const { a, b } = sides;
    if (!a.grid) return;

    clear(legendNode);
    if (b.grid && b.grid.title !== a.grid.title) {
      legendNode.append(buildLegend(a.grid.scale, a.grid.title));
      legendNode.append(buildLegend(b.grid.scale, b.grid.title));
    } else {
      legendNode.append(buildLegend(a.grid.scale, a.grid.title));
    }
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
    const { a, b } = sides;
    if (!a.grid) return;

    const point = map.latLngToContainerPoint(latlng);
    const side = swipe && point.x > map.getSize().x * swipe.ratio() && b.grid ? b : a;
    const bin = side.layer?.valueAt(latlng);

    readout.textContent = bin == null
      ? ""
      : `${describeBin(side.grid.scale, bin)} · ${latlng.lat.toFixed(1)}°, ${latlng.lng.toFixed(1)}°`;
  }

  map.on("mousemove", (event) => report(event.latlng));
  map.on("click", (event) => report(event.latlng));
  map.on("mouseout", () => { readout.textContent = ""; });
  map.on("move zoom resize", applyClip);

  async function open(key, model, variable) {
    const side = sides[key];
    stop();
    const ticket = ++side.request;
    if (key === "a") clear(legendNode).append(spinner("Cargando…"));

    let data;
    try {
      data = await load(PATHS.grid(model, variable));
    } catch (error) {
      if (ticket !== side.request) return;
      clear(legendNode).append(errorBox("No se pudo cargar.", () => open(key, model, variable)));
      return;
    }

    if (ticket !== side.request) return;
    side.grid = data;

    if (side.layer) map.removeLayer(side.layer);
    side.layer = new GridLayer(data.grid, data.scale.map((bin) => bin.color));
    side.layer.addTo(map);
    borders?.bringToFront();

    if (!framed) {
      frame(data.grid);
      framed = true;
    }

    if (index >= data.months.length) index = 0;
    side.layer.setFrame(data.frames[index]);
    applyClip();
    renderTimeline();
    renderLegend();
  }

  function closeSide() {
    sides.b.request += 1;
    if (sides.b.layer) map.removeLayer(sides.b.layer);
    sides.b = { grid: null, layer: null, request: sides.b.request };
    swipe?.remove();
    swipe = null;
    applyClip();
    renderLegend();
  }

  function compare(enabled) {
    if (!enabled) return closeSide();
    if (swipe) return;
    swipe = createSwipe(mapNode, applyClip);
    applyClip();
  }

  return {
    open,
    compare,
    stop,
    labels: (left, right) => swipe?.setLabels(left, right),
    invalidate: () => { map.invalidateSize(); applyClip(); },
    destroy: () => { stop(); map.remove(); },
  };
}
