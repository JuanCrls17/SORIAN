import { el, clear } from "../ui/dom.js";
import { wordmark } from "../ui/nav.js";
import { VARIABLES } from "../config.js";
import { selectorGroup } from "../ui/selector.js";
import { layeredBand } from "../ui/scroll.js";
import { forecastPanel } from "../ui/preview.js";

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
  );

  /**
   * La puerta al visor estacional no es un rotulo con una flecha: es el
   * pronostico mismo, a sangre y renovandose, con el texto encima. El menu ya
   * dice a donde se puede ir; una tarjeta que repita "Prediccion estacional"
   * solo lo dice otra vez. Esta lo ensena.
   *
   * El campo va desenfocado y bajo un velo porque aqui hace de fondo -para
   * leerlo esta el visor, a un clic-, pero los limites politicos van nitidos
   * en su propio lienzo, que es lo que evita que quede en mancha abstracta.
   */
  const field = el("canvas", { class: "showcase__field", "aria-hidden": "true" });
  const outline = el("canvas", { class: "showcase__outline", "aria-hidden": "true" });
  const month = el("strong", { class: "showcase__month" });
  const legend = el("div", { class: "showcase__legend" });
  const controls = el("div", { class: "showcase__controls" });

  const open = el("a", { class: "showcase__open", href: "#estacional" }, [
    "Abrir en el visor",
    el("span", { class: "showcase__arrow", "aria-hidden": "true", text: "→" }),
  ]);

  const band = el("section", { class: "showcase" }, [
    field,
    outline,
    el("div", { class: "showcase__body" }, [
      el("header", { class: "showcase__head" }, [
        el("div", { class: "showcase__intro" }, [
          el("h2", { class: "showcase__title", text: "Predicción estacional" }),
          el("p", { class: "showcase__text", text: "Anomalías mensuales de precipitación y temperatura." }),
        ]),
        controls,
      ]),
      el("div", { class: "showcase__foot" }, [
        el("div", { class: "showcase__scale" }, [
          el("p", { class: "showcase__stamp" }, ["ECMWF · ", month]),
          legend,
        ]),
        open,
      ]),
    ]),
  ]);

  outlet.append(band);

  const panel = forecastPanel({
    canvas: field,
    outline,
    legend,
    onState: ({ variable, month: name }) => {
      month.textContent = name ?? "";
      // el enlace lleva al visor con lo que se esta viendo, no a un inicio
      // generico: lo que se pica es lo que se abre
      open.setAttribute("href", `#estacional?modelo=ecmwf&variable=${variable}`);
      renderControls(variable);
    },
  });

  function renderControls(active) {
    const group = selectorGroup("Variable", VARIABLES, active, (id) => panel.select(id), "portada-variable");
    // el rotulo se queda solo al oido: tres capsulas con su pictograma dicen
    // por si solas de que se elige, y la palabra encima del mapa era ruido
    group.querySelector(".selector__label")?.classList.add("sr-only");
    clear(controls).append(group);
  }

  // sin desplazamiento de fondo: la lamina va dentro de una tarjeta y moverla
  // por dentro la descuadraria de su propio marco
  const stopBand = layeredBand(band);

  return { destroy: () => { stopBand(); panel.destroy(); } };
}
