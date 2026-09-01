import { el } from "../ui/dom.js";

const format = (value) => (Number.isInteger(value) ? value : value.toFixed(1));

export function buildLegend(scale, title) {
  const steps = scale.map((bin, index) =>
    el("div", { class: "legend__step", title: `${format(bin.min)} a ${format(bin.max)}` }, [
      el("span", { class: "legend__swatch", style: `background:${bin.color}` }),
      el("span", { class: "legend__tick", text: index === 0 ? "" : format(bin.min) }),
    ]),
  );

  return el("figure", { class: "legend" }, [
    el("figcaption", { class: "legend__title", text: title }),
    el("div", { class: "legend__scale" }, steps),
    el("p", { class: "legend__note", text: "Anomalía respecto a la climatología de referencia." }),
  ]);
}

export function describeBin(scale, index) {
  if (index === null) return "sin dato";
  const bin = scale[index];
  return `${format(bin.min)} a ${format(bin.max)}`;
}
