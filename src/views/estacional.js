import { MODELS, VARIABLES, SIDES } from "../config.js";
import { el, clear } from "../ui/dom.js";
import { routeParams } from "../router.js";
import { selectorGroup } from "../ui/selector.js";
import { COMPARE_ICON, SIDE_ICONS, SMOOTH_ICON } from "../ui/icons.js";
import { createViewer } from "../map/viewer.js";

const valid = (list, value, fallback) =>
  (list.some((item) => item.id === value) ? value : fallback);

export default function estacional(outlet) {
  const params = routeParams();
  const state = {
    a: {
      model: valid(MODELS, params.get("modelo"), "ecmwf"),
      variable: valid(VARIABLES, params.get("variable"), "tpara"),
    },
    b: {
      model: valid(MODELS, params.get("modelo2"), "bom"),
      variable: valid(VARIABLES, params.get("variable2"), "tpara"),
    },
    comparing: params.has("modelo2"),
    smooth: params.get("detalle") === "continuo",
  };

  // Solo los campos continuos se suavizan por defecto.
  const continuous = (id) => VARIABLES.find((v) => v.id === id).continuous;

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

  function syncUrl() {
    const query = new URLSearchParams({
      modelo: state.a.model,
      variable: state.a.variable,
    });
    if (state.comparing) {
      query.set("modelo2", state.b.model);
      query.set("variable2", state.b.variable);
    }
    if (state.smooth) query.set("detalle", "continuo");
    history.replaceState(null, "", `#estacional?${query}`);
  }

  /** Un panel por lado, colocado sobre la mitad del mapa que gobierna. */
  function sidePanel(side) {
    return el("div", { class: `side-panel side-panel--${side.id}` }, [
      el("span", { class: "side-panel__head" }, [
        el("span", { class: "side-panel__icon", html: SIDE_ICONS[side.id] }),
        el("span", { text: side.label }),
      ]),
      el("div", { class: "side-panel__body" }, [
        selectorGroup("Modelo", MODELS, state[side.id].model, (id) => update(side.id, { model: id })),
        selectorGroup("Variable", VARIABLES, state[side.id].variable, (id) => update(side.id, { variable: id })),
      ]),
    ]);
  }

  function render() {
    const toggle = el("button", {
      class: `compare${state.comparing ? " is-active" : ""}`,
      type: "button",
      "aria-pressed": String(state.comparing),
      title: state.comparing
        ? "Volver a un solo pronóstico"
        : "Dividir el mapa y comparar dos pronósticos",
      onClick: () => setComparing(!state.comparing),
    }, [
      el("span", { class: "compare__icon", html: COMPARE_ICON }),
      el("span", { class: "compare__label", text: state.comparing ? "Comparando" : "Comparar" }),
    ]);

    const shown = state.comparing ? [state.a.variable, state.b.variable] : [state.a.variable];
    const advisable = shown.every(continuous);

    const detail = el("button", {
      class: `compare compare--detail${state.smooth ? " is-active" : ""}`,
      type: "button",
      "aria-pressed": String(state.smooth),
      title: advisable
        ? "Reconstruir el campo entre centros de celda"
        : "La precipitación es un campo discontinuo: el suavizado sugiere transiciones que el modelo no resuelve",
      onClick: () => setSmooth(!state.smooth),
    }, [
      el("span", { class: "compare__icon", html: SMOOTH_ICON }),
      el("span", { class: "compare__label", text: state.smooth ? "Continuo" : "Celdas" }),
      advisable ? null : el("span", { class: "compare__warn", "aria-hidden": "true", text: "!" }),
    ]);

    clear(controls).append(
      toggle,
      detail,
      state.comparing
        ? el("div", { class: "controls__sides" }, SIDES.map(sidePanel))
        : el("div", { class: "controls__single" }, [
            selectorGroup("Modelo", MODELS, state.a.model, (id) => update("a", { model: id })),
            el("span", { class: "controls__divider", "aria-hidden": "true" }),
            selectorGroup("Variable", VARIABLES, state.a.variable, (id) => update("a", { variable: id })),
          ]),
    );
  }

  function update(side, patch) {
    Object.assign(state[side], patch);
    syncUrl();
    render();
    viewer.open(side, state[side].model, state[side].variable);
  }

  function setSmooth(enabled) {
    state.smooth = enabled;
    viewer.setSmooth(enabled);
    syncUrl();
    render();
  }

  function setComparing(enabled) {
    state.comparing = enabled;
    viewer.compare(enabled);
    if (enabled) viewer.open("b", state.b.model, state.b.variable);
    syncUrl();
    render();
  }

  render();
  viewer.setSmooth(state.smooth);
  viewer.open("a", state.a.model, state.a.variable);
  if (state.comparing) setComparing(true);
  requestAnimationFrame(() => viewer.invalidate());

  return {
    destroy: () => {
      outlet.classList.remove("outlet--app");
      document.body.classList.remove("is-app");
      viewer.destroy();
    },
  };
}
