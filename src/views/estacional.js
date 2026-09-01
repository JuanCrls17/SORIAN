import { MODELS, VARIABLES } from "../config.js";
import { el, clear } from "../ui/dom.js";
import { routeParams } from "../router.js";
import { selectorGroup } from "../ui/selector.js";
import { createViewer } from "../map/viewer.js";

export default function estacional(outlet) {
  const params = routeParams();
  const state = {
    model: MODELS.some((m) => m.id === params.get("modelo")) ? params.get("modelo") : "ecmwf",
    variable: VARIABLES.some((v) => v.id === params.get("variable")) ? params.get("variable") : "tpara",
  };

  const controls = el("div", { class: "controls", id: "controls-estacional" });
  const stage = el("div", { class: "viewer" });

  const toggle = el("button", {
    class: "controls__toggle", type: "button",
    "aria-expanded": "false", "aria-controls": "controls-estacional",
    onClick: () => {
      const open = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Ocultar opciones ▲" : "Modelo y variable ▼";
    },
  }, "Modelo y variable ▼");

  const panel = el("section", { class: "panel" }, [toggle, controls]);

  outlet.append(
    el("header", { class: "view__header" }, [
      el("h1", { text: "Pronóstico estacional" }),
      el("p", { class: "view__lead", text: "Anomalías mensuales multimodelo para Sudamérica. Seleccione modelo y variable; use la línea de tiempo para recorrer los meses." }),
    ]),
    panel,
    stage,
  );

  const viewer = createViewer(stage);

  function renderControls() {
    clear(controls).append(
      selectorGroup("Modelo", MODELS, state.model, (id) => update({ model: id })),
      selectorGroup("Variable", VARIABLES, state.variable, (id) => update({ variable: id })),
    );
  }

  function update(patch) {
    Object.assign(state, patch);
    history.replaceState(null, "", `#estacional?modelo=${state.model}&variable=${state.variable}`);
    renderControls();
    viewer.open(state.model, state.variable);
  }

  renderControls();
  viewer.open(state.model, state.variable);
  requestAnimationFrame(() => viewer.invalidate());

  return { destroy: () => viewer.destroy() };
}
