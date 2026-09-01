import { el } from "../ui/dom.js";
import { navigate } from "../router.js";

export default function subestacional(outlet) {
  outlet.append(
    el("header", { class: "view__header" }, [
      el("h1", { text: "Pronóstico subestacional" }),
    ]),
    el("section", { class: "notice" }, [
      el("p", { class: "notice__badge", text: "En desarrollo" }),
      el("p", { text: "El visor subestacional se encuentra en preparación. Contemplará predicciones semanales de anomalía de precipitación y de temperatura máxima y mínima." }),
      el("p", { text: "Mientras tanto puede consultar el pronóstico estacional, ya operativo." }),
      el("button", { class: "btn btn--primary", type: "button", onClick: () => navigate("estacional"), text: "Ir al pronóstico estacional" }),
    ]),
  );
  return {};
}
