import { el } from "../ui/dom.js";
import { navigate } from "../router.js";
import { wordmark } from "../ui/nav.js";
import { ICONS } from "../ui/icons.js";

const ACCESS = [
  {
    route: "estacional",
    icon: ICONS.tpara,
    title: "Pronóstico estacional",
    text: "Anomalías mensuales de precipitación y temperatura. Tres modelos globales, seis meses de horizonte y comparación lado a lado.",
  },
  {
    route: "enso",
    icon: ICONS.mx2t24a,
    title: "Monitoreo ENSO",
    text: "Predicción multimodelo de la anomalía de temperatura superficial del mar en las regiones Niño 1+2 y 3.4.",
  },
];

export default function inicio(outlet) {
  outlet.append(
    el("section", { class: "hero" }, [
      el("div", { class: "hero__content" }, [
        el("p", { class: "hero__eyebrow", text: "SENAMHI · Subdirección de Cambio Climático y Modelamiento Atmosférico" }),
        el("h1", { class: "hero__title" }, [
          wordmark("span", "wordmark"),
        ]),
        // el nombre desplegado ya esta en la cabecera, y los dos botones
        // llevaban a las mismas dos secciones que las tarjetas de aqui debajo
        el("p", { class: "hero__text", text: "Información climática mensual y estacional para el Perú y Sudamérica, integrada desde los principales modelos globales de predicción." }),
      ]),
      el("div", { class: "hero__art", "aria-hidden": "true" }),
    ]),

    el("section", { class: "access" }, ACCESS.map((item) =>
      el("button", { class: "access__card", type: "button", onClick: () => navigate(item.route) }, [
        el("span", { class: "access__icon", html: item.icon }),
        el("span", { class: "access__body" }, [
          el("span", { class: "access__title", text: item.title }),
          el("span", { class: "access__text", text: item.text }),
        ]),
        el("span", { class: "access__go", "aria-hidden": "true", text: "→" }),
      ]),
    )),
  );
  return {};
}
