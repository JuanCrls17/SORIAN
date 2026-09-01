import { MODELS, VARIABLES } from "../config.js";
import { el, clear } from "../ui/dom.js";
import { routeParams } from "../router.js";
import { selectorGroup } from "../ui/selector.js";
import { createViewer } from "../map/viewer.js";

const valid = (list, value, fallback) =>
  (list.some((item) => item.id === value) ? value : fallback);

const label = (list, id) => list.find((item) => item.id === id).label;

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
    side: "a",
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

  function describe(side) {
    return `${label(MODELS, state[side].model)} · ${label(VARIABLES, state[side].variable)}`;
  }

  function syncUrl() {
    const query = new URLSearchParams({
      modelo: state.a.model,
      variable: state.a.variable,
    });
    if (state.comparing) {
      query.set("modelo2", state.b.model);
      query.set("variable2", state.b.variable);
    }
    history.replaceState(null, "", `#estacional?${query}`);
  }

  function render() {
    const active = state[state.side];

    clear(controls).append(
      el("button", {
        class: `chip chip--toggle${state.comparing ? " is-active" : ""}`,
        type: "button",
        "aria-pressed": String(state.comparing),
        title: "Comparar dos pronósticos con una cortina deslizable",
        onClick: () => setComparing(!state.comparing),
      }, [
        el("span", { class: "chip__icon", "aria-hidden": "true", text: "◧" }),
        el("span", { class: "chip__label", text: "Comparar" }),
      ]),
      el("span", { class: "controls__divider", "aria-hidden": "true" }),

      ...(state.comparing ? [
        el("div", { class: "sides", role: "group", "aria-label": "Lado a editar" },
          ["a", "b"].map((key) =>
            el("button", {
              class: `sides__btn${state.side === key ? " is-active" : ""}`,
              type: "button",
              "aria-pressed": String(state.side === key),
              onClick: () => { state.side = key; render(); },
            }, [
              el("span", { class: "sides__tag", text: key === "a" ? "Izq." : "Der." }),
              el("span", { class: "sides__name", text: describe(key) }),
            ]),
          ),
        ),
        el("span", { class: "controls__divider", "aria-hidden": "true" }),
      ] : []),

      selectorGroup("Modelo", MODELS, active.model, (id) => update({ model: id })),
      el("span", { class: "controls__divider", "aria-hidden": "true" }),
      selectorGroup("Variable", VARIABLES, active.variable, (id) => update({ variable: id })),
    );

    if (state.comparing) viewer.labels(describe("a"), describe("b"));
  }

  function update(patch) {
    Object.assign(state[state.side], patch);
    syncUrl();
    render();
    viewer.open(state.side, state[state.side].model, state[state.side].variable);
  }

  function setComparing(enabled) {
    state.comparing = enabled;
    state.side = enabled ? "b" : "a";
    viewer.compare(enabled);
    if (enabled) viewer.open("b", state.b.model, state.b.variable);
    syncUrl();
    render();
  }

  render();
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
