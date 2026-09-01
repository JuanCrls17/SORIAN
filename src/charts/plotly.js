import { PATHS } from "../config.js";

const REFERENCE_WIDTH = 1100;
const MIN_SCALE = 0.6;
const NARROW = 720;
const SIDE_BY_SIDE = 980;
const GUTTER = 0.06;

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

  // Las dos regiones Niño llegan apiladas; con ancho suficiente se colocan
  // en paralelo para poder contrastarlas de una sola mirada.
  const paired = width >= SIDE_BY_SIDE && adapted.yaxis2 && adapted.xaxis2;
  if (paired) {
    adapted.yaxis = { ...adapted.yaxis, domain: [0, 1] };
    adapted.yaxis2 = { ...adapted.yaxis2, domain: [0, 1] };
    adapted.xaxis = { ...adapted.xaxis, domain: [0, 0.5 - GUTTER / 2] };
    adapted.xaxis2 = { ...adapted.xaxis2, domain: [0.5 + GUTTER / 2, 1] };
    adapted.height = Math.round(adapted.height * 0.62);

    // los rotulos de cada region acompañan a su panel
    adapted.annotations = (adapted.annotations ?? []).map((note) => {
      if (note.yref !== "paper" || note.y === undefined) return note;
      const second = note.y < 0.5;
      return { ...note, x: second ? 0.75 : 0.25, y: 1.02, yanchor: "bottom" };
    });

    // cada leyenda se ancla a su propio panel
    if (adapted.legend) {
      adapted.legend = { ...adapted.legend, x: 0.01, y: 0.99, xanchor: "left", yanchor: "top" };
    }
    if (adapted.legend2) {
      adapted.legend2 = { ...adapted.legend2, x: 0.53, y: 0.99, xanchor: "left", yanchor: "top" };
    }

    // el sello institucional ya figura en la cabecera del sitio
    delete adapted.images;
  }
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
