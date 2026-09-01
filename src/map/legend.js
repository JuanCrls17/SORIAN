import { el } from "../ui/dom.js";

const format = (value) => (Number.isInteger(value) ? value : Number(value.toFixed(1)));

export function buildLegend(scale, title) {
  const swatches = scale.map((bin) =>
    el("span", {
      class: "legend__swatch",
      style: `background:${bin.color}`,
      title: `${format(bin.min)} a ${format(bin.max)}`,
    }),
  );

  const ticks = scale
    .filter((_, index) => index > 0 && index < scale.length - 1 && index % 3 === 0)
    .map((bin) => el("span", { class: "legend__tick", text: String(format(bin.min)) }));

  return el("figure", { class: "legend" }, [
    el("figcaption", { class: "legend__title", text: title }),
    el("div", { class: "legend__bar" }, swatches),
    el("div", { class: "legend__ticks" }, [
      el("span", { class: "legend__tick", text: String(format(scale[0].max)) }),
      ...ticks,
      el("span", { class: "legend__tick", text: String(format(scale.at(-1).min)) }),
    ]),
  ]);
}

export function describeBin(scale, index) {
  if (index === null) return "sin dato";
  const bin = scale[index];
  return `${format(bin.min)} a ${format(bin.max)}`;
}
