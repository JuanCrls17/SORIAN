import { el } from "../ui/dom.js";
import { navigate } from "../router.js";

const CARDS = [
  { route: "estacional", title: "Pronóstico estacional", text: "Anomalías mensuales de precipitación y temperatura, tres modelos globales, seis meses de horizonte." },
  { route: "enso", title: "Monitoreo ENSO", text: "Predicción multimodelo de la anomalía de temperatura superficial del mar en las regiones Niño." },
  { route: "subestacional", title: "Pronóstico subestacional", text: "Predicciones semanales de anomalías. Producto en desarrollo." },
];

export default function inicio(outlet) {
  outlet.append(
    el("section", { class: "hero" }, [
      el("div", { class: "hero__content" }, [
        el("p", { class: "hero__eyebrow", text: "SENAMHI · Subdirección de Modelamiento Numérico de la Atmósfera" }),
        el("h1", { class: "hero__title", text: "SORIAN" }),
        el("p", { class: "hero__subtitle", text: "Sistema Operacional de Resolución Integrada para la Predicción del Clima" }),
        el("p", { class: "hero__text", text: "Información climática subestacional, mensual y estacional para el Perú y Sudamérica, integrada desde los principales modelos globales de predicción." }),
        el("div", { class: "hero__actions" }, [
          el("button", { class: "btn btn--primary", type: "button", onClick: () => navigate("estacional"), text: "Ver pronóstico estacional" }),
          el("button", { class: "btn btn--ghost", type: "button", onClick: () => navigate("descripcion"), text: "Conocer SORIAN" }),
        ]),
      ]),
    ]),
    el("section", { class: "cards" }, CARDS.map((card) =>
      el("button", { class: "card", type: "button", onClick: () => navigate(card.route) }, [
        el("h2", { class: "card__title", text: card.title }),
        el("p", { class: "card__text", text: card.text }),
        el("span", { class: "card__cta", text: "Abrir →" }),
      ]),
    )),
  );
  return {};
}
