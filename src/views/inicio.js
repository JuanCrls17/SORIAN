import { el, clear } from "../ui/dom.js";
import { wordmark } from "../ui/nav.js";
import { MODELS, VARIABLES } from "../config.js";
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
   * Y lo ensena como se usa: dos paneles con el mismo mes resuelto por dos
   * centros distintos, que es de lo que trata el visor. Cada uno se
   * desfragmenta por su cuenta hacia el mes siguiente.
   *
   * El campo va desenfocado y bajo un velo porque aqui hace de fondo -para
   * leerlo esta el visor, a un clic-, pero los limites politicos van nitidos
   * en su propio lienzo, que es lo que evita que quede en mancha abstracta.
   */
  const panes = [0, 1].map(() => ({
    field: el("canvas", { class: "showcase__layer" }),
    outline: el("canvas", { class: "showcase__layer" }),
    caption: el("span", { class: "showcase__model" }),
  }));

  const stage = (kind, pick) => el("div", { class: `showcase__stage showcase__stage--${kind}`, "aria-hidden": "true" },
    panes.map((pane) => el("div", { class: "showcase__cell" }, [pick(pane)])));

  // Quien firma cada mitad. Va en el flujo, entre el encabezado y el pie, no
  // en una capa suelta centrada sobre la banda: el hueco libre cambia de alto
  // con el ancho de la ventana -al estrecharse, los mandos bajan de renglon-,
  // y centrado sobre el total el rotulo acababa metido bajo las capsulas.
  const names = el("div", { class: "showcase__names", "aria-hidden": "true" },
    panes.map((pane) => el("span", { class: "showcase__half" }, [pane.caption])));

  const month = el("strong", { class: "showcase__month" });
  // en el telefono solo hay un panel, asi que el modelo lo dice el sello
  const solo = el("span", { class: "showcase__solo" });
  const legend = el("div", { class: "showcase__legend" });
  const controls = el("div", { class: "showcase__controls" });

  const open = el("a", { class: "showcase__open", href: "#estacional" }, [
    "Abrir en el visor",
    el("span", { class: "showcase__arrow", "aria-hidden": "true", text: "→" }),
  ]);

  const band = el("section", { class: "showcase" }, [
    stage("field", (pane) => pane.field),
    stage("lines", (pane) => pane.outline),
    el("span", { class: "showcase__split", "aria-hidden": "true" }),
    el("div", { class: "showcase__body" }, [
      el("header", { class: "showcase__head" }, [
        el("div", { class: "showcase__intro" }, [
          el("h2", { class: "showcase__title", text: "Predicción estacional" }),
          el("p", { class: "showcase__text", text: "Anomalías mensuales de precipitación y temperatura." }),
        ]),
        controls,
      ]),
      names,
      el("div", { class: "showcase__foot" }, [
        el("div", { class: "showcase__scale" }, [
          el("p", { class: "showcase__stamp" }, [solo, month]),
          legend,
        ]),
        open,
      ]),
    ]),
  ]);

  outlet.append(band);

  const nameOf = (id) => MODELS.find((item) => item.id === id)?.label ?? id;

  const panel = forecastPanel({
    panels: panes.map((pane) => ({ canvas: pane.field, outline: pane.outline })),
    legend,
    onState: ({ variable, month: name, models }) => {
      month.textContent = name ?? "";
      solo.textContent = `${nameOf(models[0])} · `;
      panes.forEach((pane, i) => { pane.caption.textContent = nameOf(models[i]); });
      // el enlace lleva al visor con lo que se esta viendo, los dos modelos
      // incluidos: lo que se pica es lo que se abre
      open.setAttribute("href", `#estacional?modelo=${models[0]}&modelo2=${models[1]}&variable=${variable}`);
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
