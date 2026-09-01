import { el } from "./dom.js";

/** Grupo de botones de opcion unica, accesible por teclado. */
export function selectorGroup(label, options, selected, onChange) {
  const buttons = options.map((option) =>
    el("button", {
      class: `chip${option.id === selected ? " is-active" : ""}`,
      type: "button",
      "aria-pressed": String(option.id === selected),
      "aria-label": option.label,
      title: option.institution || option.label,
      onClick: () => onChange(option.id),
    }, [
      el("span", { class: "chip__label", "aria-hidden": "true", text: option.label }),
      option.short ? el("span", { class: "chip__short", "aria-hidden": "true", text: option.short }) : null,
    ]),
  );

  return el("div", { class: "selector" }, [
    el("span", { class: "selector__label", text: label }),
    el("div", { class: "selector__options" }, buttons),
  ]);
}
