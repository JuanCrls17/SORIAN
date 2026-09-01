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
 * Leyenda seleccionable: cada serie se activa o desactiva con un clic
 * y el grafico se actualiza sin volver a dibujarse por completo.
 */
export function seriesFilter(node, groups, onChange) {
  const hidden = new Set();

  function apply() {
    onChange(groups.flatMap((group) =>
      group.indices.map((index) => ({ index, visible: !hidden.has(group.name) })),
    ));
    render();
  }

  function setAll(names) {
    hidden.clear();
    for (const name of names) hidden.add(name);
    apply();
  }

  function render() {
    const shown = groups.length - hidden.size;

    clear(node).append(
      el("div", { class: "series__head" }, [
        el("span", { class: "series__count", text: `${shown} de ${groups.length} modelos` }),
        el("div", { class: "series__actions" }, [
          el("button", {
            class: "series__action", type: "button", text: "Todos",
            onClick: () => setAll([]),
          }),
          el("button", {
            class: "series__action", type: "button", text: "Ninguno",
            onClick: () => setAll(groups.map((group) => group.name)),
          }),
        ]),
      ]),
      el("div", { class: "series__list" }, groups.map((group) => {
        const active = !hidden.has(group.name);
        return el("button", {
          class: `series__item${active ? " is-active" : ""}`,
          type: "button",
          "aria-pressed": String(active),
          title: `Doble clic para ver solo ${group.name}`,
          onClick: (event) => {
            if (event.detail > 1) return;
            hidden.has(group.name) ? hidden.delete(group.name) : hidden.add(group.name);
            apply();
          },
          onDblclick: () => setAll(groups.map((g) => g.name).filter((n) => n !== group.name)),
        }, [
          el("span", { class: "series__swatch", style: `background:${group.color}` }),
          el("span", { class: "series__name", text: group.name }),
        ]);
      })),
    );
  }

  render();
}
