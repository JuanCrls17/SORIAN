import { el, clear } from "../ui/dom.js";

/** Agrupa las trazas por nombre de serie: un modelo aporta varias trazas. */
export function groupSeries(traces) {
  const groups = new Map();
  traces.forEach((trace, index) => {
    const name = trace.name;
    if (!name) return;
    if (!groups.has(name)) {
      groups.set(name, {
        name,
        color: trace.marker?.color ?? trace.line?.color ?? trace.fillcolor,
        indices: [],
      });
    }
    groups.get(name).indices.push(index);
  });
  return [...groups.values()].filter((group) => group.color);
}

/**
 * Selector de series. Con todo visible, el primer clic aisla la serie elegida;
 * a partir de ahi cada clic suma o quita, de modo que la seleccion se arma
 * eligiendo lo que interesa en vez de descartando lo que no.
 */
export function seriesFilter(node, groups, onChange) {
  const names = groups.map((group) => group.name);
  let shown = new Set(names);

  function apply() {
    onChange(groups.flatMap((group) =>
      group.indices.map((index) => ({ index, visible: shown.has(group.name) })),
    ));
    render();
  }

  function pick(name) {
    if (shown.size === names.length) shown = new Set([name]);
    else if (shown.has(name)) shown.delete(name);
    else shown.add(name);
    apply();
  }

  function render() {
    const count = shown.size;

    clear(node).append(
      el("div", { class: "series__head" }, [
        el("span", { class: "series__count" }, [
          el("strong", { text: String(count) }),
          ` de ${names.length} modelos`,
        ]),
        el("div", { class: "series__actions" }, [
          el("button", {
            class: "series__action", type: "button", text: "Todos",
            disabled: count === names.length,
            onClick: () => { shown = new Set(names); apply(); },
          }),
          el("button", {
            class: "series__action", type: "button", text: "Limpiar",
            disabled: count === 0,
            onClick: () => { shown = new Set(); apply(); },
          }),
        ]),
      ]),
      el("div", { class: "series__list" }, groups.map((group) => {
        const active = shown.has(group.name);
        return el("button", {
          class: `series__item${active ? " is-active" : ""}`,
          type: "button",
          "aria-pressed": String(active),
          onClick: () => pick(group.name),
        }, [
          el("span", { class: "series__swatch", style: `background:${group.color}` }),
          el("span", { class: "series__name", text: group.name }),
        ]);
      })),
    );
  }

  render();
}
