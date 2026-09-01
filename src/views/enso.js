import { PATHS } from "../config.js";
import { load } from "../data.js";
import { el, clear, spinner, errorBox } from "../ui/dom.js";
import { loadPlotly, adaptLayout, titleLines, CONFIG } from "../charts/plotly.js";
import { groupSeries, seriesFilter } from "../charts/series.js";

const CHARTS = [
  { id: "percentiles", label: "Percentiles", hint: "Dispersión del ensamble multimodelo" },
  { id: "boxplot", label: "Boxplot", hint: "Distribución por modelo", selectable: true },
];

export default function enso(outlet) {
  let current = CHARTS[0].id;
  let resizeTimer = null;

  const caption = el("div", { class: "chart__caption" });
  const plot = el("div", { class: "chart__plot" });
  const legend = el("div", { class: "series" });
  const stage = el("section", { class: "chart" }, [caption, plot, legend]);
  const tabs = el("div", { class: "tabs", role: "tablist" });

  outlet.append(
    el("header", { class: "view__header" }, [
      el("h1", { text: "Monitoreo y predicción ENSO" }),
      el("p", { class: "view__lead", text: "Anomalía de la temperatura superficial del mar en las regiones Niño. Predicción multimodelo frente a la evolución observada." }),
    ]),
    tabs,
    stage,
  );

  function renderTabs() {
    clear(tabs).append(...CHARTS.map((chart) =>
      el("button", {
        class: `tab${chart.id === current ? " is-active" : ""}`,
        type: "button", role: "tab", "aria-selected": String(chart.id === current),
        onClick: () => show(chart.id),
      }, [
        el("span", { class: "tab__label", text: chart.label }),
        el("span", { class: "tab__hint", text: chart.hint }),
      ]),
    ));
  }

  async function show(id) {
    current = id;
    renderTabs();
    clear(caption);
    clear(legend);
    clear(plot).append(spinner("Cargando gráfico…"));

    try {
      const [Plotly, figure] = await Promise.all([loadPlotly(), load(PATHS.enso(id))]);
      if (current !== id) return;

      const [heading, ...rest] = titleLines(figure.layout);
      clear(caption).append(
        el("h2", { class: "chart__title", text: heading ?? "" }),
        ...rest.map((line) => el("p", { class: "chart__subtitle", text: line })),
      );

      const chart = CHARTS.find((item) => item.id === id);
      const layout = adaptLayout(figure.layout, plot.clientWidth);
      if (chart.selectable) layout.showlegend = false;

      clear(plot);
      await Plotly.newPlot(plot, figure.data, layout, CONFIG);

      if (chart.selectable) {
        seriesFilter(legend, groupSeries(figure.data), (updates) => {
          Plotly.restyle(plot, { visible: updates.map((u) => u.visible) }, updates.map((u) => u.index));
        });
      }
    } catch (error) {
      clear(plot).append(errorBox("No se pudo cargar el gráfico.", () => show(id)));
    }
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => show(current), 250);
  }

  window.addEventListener("resize", onResize);
  show(current);

  return {
    destroy: () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
      window.Plotly?.purge?.(plot);
    },
  };
}
