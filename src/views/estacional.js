import { MODELS, VARIABLES } from "../config.js";
import { el, clear } from "../ui/dom.js";
import { routeParams } from "../router.js";
import { selectorGroup } from "../ui/selector.js";
import { createViewer } from "../map/viewer.js";

const valid = (list, value, fallback) =>
  (list.some((item) => item.id === value) ? value : fallback);

export default function estacional(outlet) {
  const params = routeParams();
  const state = {
    model: valid(MODELS, params.get("modelo"), "ecmwf"),
    variable: valid(VARIABLES, params.get("variable"), "tpara"),
  };

  const controls = el("div", { class: "controls" });
  const stage = el("div", { class: "viewer" });

  outlet.classList.add("outlet--app");
  document.body.classList.add("is-app");
  outlet.append(
    el("h1", { class: "sr-only", text: "Pronóstico estacional" }),
    stage,
    el("p", { class: "app-note" }, [
    el("b", { text: "Nota. " }),
      "Resultados de modelos numéricos, de carácter referencial. No reemplazan una evaluación oficial del SENAMHI.",
    ]),
  );

  const viewer = createViewer(stage, controls);

  function render() {
    clear(controls).append(
      selectorGroup("Modelo", MODELS, state.model, (id) => update({ model: id })),
      el("span", { class: "controls__divider", "aria-hidden": "true" }),
      selectorGroup("Variable", VARIABLES, state.variable, (id) => update({ variable: id })),
    );
  }

  function update(patch) {
    Object.assign(state, patch);
    history.replaceState(null, "", `#estacional?modelo=${state.model}&variable=${state.variable}`);
    render();
    viewer.open(state.model, state.variable);
  }

  render();
  viewer.open(state.model, state.variable);
  requestAnimationFrame(() => viewer.invalidate());

  return {
    destroy: () => {
      outlet.classList.remove("outlet--app");
      document.body.classList.remove("is-app");
      viewer.destroy();
    },
  };
}
