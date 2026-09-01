import { el } from "./dom.js";
import { ICONS } from "./icons.js";

/** Grupo de opcion unica. Las variables llevan su pictograma. */
export function selectorGroup(label, options, selected, onChange) {
  const buttons = options.map((option) => {
    const icon = ICONS[option.id];
    return el("button", {
      class: `chip${option.id === selected ? " is-active" : ""}`,
      type: "button",
      "aria-pressed": String(option.id === selected),
      "aria-label": option.label,
      title: option.institution || option.label,
      onClick: () => onChange(option.id),
    }, [
      icon ? el("span", { class: "chip__glyph", html: icon }) : null,
      el("span", { class: "chip__label", "aria-hidden": "true", text: option.label }),
      option.short ? el("span", { class: "chip__short", "aria-hidden": "true", text: option.short }) : null,
    ]);
  });

  return el("div", { class: "selector" }, [
    el("span", { class: "selector__label", text: label }),
    el("div", { class: "selector__options" }, buttons),
  ]);
}
