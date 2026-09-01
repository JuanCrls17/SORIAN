import { PATHS } from "../config.js";

const REFERENCE_WIDTH = 1100;
const MIN_SCALE = 0.6;
const NARROW = 720;

let loader = null;

/** Carga plotly una sola vez y solo cuando alguna vista lo necesita. */
export function loadPlotly() {
  if (!loader) {
    loader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = PATHS.plotly;
      script.onload = () => resolve(window.Plotly);
      script.onerror = () => { loader = null; reject(new Error("No se pudo cargar Plotly")); };
      document.head.append(script);
    });
  }
  return loader;
}

/** Convierte el titulo enriquecido de Plotly en lineas de texto plano. */
export function titleLines(layout) {
  const raw = layout.title?.text ?? "";
  return raw
    .split(/<br\s*\/?>/i)
    .map((line) => line.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * Adapta un layout pensado para 1100 px de ancho al contenedor actual:
 * escala tipografias y altura, y mueve el titulo fuera del grafico.
 */
export function adaptLayout(layout, width) {
  const scale = Math.min(1, Math.max(MIN_SCALE, width / REFERENCE_WIDTH));
  const adapted = scaleFonts(structuredClone(layout), scale);

  delete adapted.title;
  adapted.autosize = true;
  adapted.height = Math.round((layout.height ?? 700) * (0.55 + 0.45 * scale));
  adapted.margin = {
    l: Math.round(52 * scale) + 8,
    r: Math.round(24 * scale),
    t: Math.round(28 * scale) + 8,
    b: Math.round(70 * scale) + 10,
  };
  adapted.paper_bgcolor = "transparent";

  for (const key of Object.keys(adapted)) {
    if (key.startsWith("xaxis")) {
      adapted[key] = { ...adapted[key], nticks: Math.max(6, Math.round(width / 70)) };
    }
  }

  return adapted;
}

/** Series unicas de la figura, para dibujar la leyenda en HTML. */
export function legendItems(traces) {
  const seen = new Map();
  for (const trace of traces) {
    const name = trace.name;
    if (!name || seen.has(name)) continue;
    const color = trace.marker?.color ?? trace.line?.color ?? trace.fillcolor;
    if (color) seen.set(name, color);
  }
  return [...seen].map(([name, color]) => ({ name, color }));
}

function scaleFonts(node, scale) {
  if (Array.isArray(node)) return node.map((item) => scaleFonts(item, scale));
  if (node === null || typeof node !== "object") return node;

  for (const [key, value] of Object.entries(node)) {
    if (key === "font" && value && typeof value.size === "number") {
      value.size = Math.max(8, Math.round(value.size * scale));
    } else if (key === "tickfont" && value && typeof value.size === "number") {
      value.size = Math.max(8, Math.round(value.size * scale));
    } else {
      node[key] = scaleFonts(value, scale);
    }
  }
  return node;
}

export const CONFIG = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ["lasso2d", "select2d", "autoScale2d", "toggleSpikelines"],
  toImageButtonOptions: { filename: "sorian-enso", scale: 2 },
};
