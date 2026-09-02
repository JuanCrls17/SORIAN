import { el } from "./dom.js";
import { navigate } from "../router.js";
import { slidingMarker } from "./marker.js";

// La descripcion cierra la lista: explica el sistema, y quien llega ya sabe
// que busca. Los visores van delante por ser el trabajo diario.
export const SECTIONS = [
  { id: "inicio", label: "Inicio" },
  { id: "estacional", label: "Estacional" },
  { id: "enso", label: "ENSO" },
  { id: "consultas", label: "Consultas" },
  { id: "descripcion", label: "Descripción" },
];

export function buildNav() {
  const links = SECTIONS.map((section) =>
    el("a", {
      class: "nav__link", href: `#${section.id}`, "data-route": section.id,
      text: section.label, onClick: () => close(),
    }),
  );

  const menu = el("nav", { class: "nav", id: "nav-main", "aria-label": "Navegación principal" }, links);
  const moveTo = slidingMarker(menu, "nav");

  const button = el("button", {
    class: "nav__burger", type: "button",
    "aria-label": "Abrir menú", "aria-expanded": "false", "aria-controls": "nav-main",
    onClick: () => toggle(),
  }, [el("span", { class: "nav__burger-bars", "aria-hidden": "true" })]);

  function toggle() {
    const open = menu.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  }

  function close() {
    menu.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Abrir menú");
  }

  const activeLink = () => links.find((link) => link.classList.contains("is-active"));

  window.addEventListener("route:changed", (event) => {
    for (const link of links) {
      link.classList.toggle("is-active", link.dataset.route === event.detail);
      link.toggleAttribute("aria-current", link.dataset.route === event.detail);
    }
    requestAnimationFrame(() => moveTo(activeLink()));
  });

  // Solo el ancho recoloca la pastilla. En movil la barra del navegador se
  // repliega al desplazarse y emite un resize de solo alto: atenderlo obliga
  // a medir el menu en cada gesto de scroll sin que nada haya cambiado.
  let ancho = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === ancho) return;
    ancho = window.innerWidth;
    moveTo(activeLink());
  });

  return { menu, button };
}

export function buildHeader() {
  const { menu, button } = buildNav();

  return el("header", { class: "masthead" }, [
    el("div", { class: "masthead__bar" }, [
      el("a", { class: "brand", href: "#inicio", onClick: () => navigate("inicio") }, [
        el("img", { class: "brand__mark", src: "assets/icon-192.png", alt: "", width: "192", height: "192" }),
        el("span", { class: "brand__logos" }, [
          el("img", { class: "brand__logo", src: "assets/logo-minam.png", alt: "Ministerio del Ambiente", width: "728", height: "150" }),
          el("img", { class: "brand__logo brand__logo--senamhi", src: "assets/logo-senamhi.png", alt: "SENAMHI", width: "350", height: "160" }),
        ]),
        el("span", { class: "brand__divider", "aria-hidden": "true" }),
        el("span", { class: "brand__name" }, [
          el("strong", { text: "SORIAN" }),
          el("small", { class: "brand__full" }, [
            el("span", { class: "brand__full-long", text: "Sistema Operacional de Resolución Integrada para la Predicción del Clima" }),
            el("span", { class: "brand__full-short", text: "Predicción del clima" }),
          ]),
        ]),
      ]),
      menu,
      button,
    ]),
    el("div", { class: "masthead__scale", "aria-hidden": "true" }),
  ]);
}

/**
 * Silueta andina: dos crestas, la de atras mas tenue, para que el pie no
 * arranque con un corte recto. Se estira a lo ancho, asi que los picos van
 * irregulares a proposito; una cadencia regular delataria el estirado.
 */
const RIDGE_FAR =
  "M0,60 L0,40 L70,24 L140,36 L210,18 L290,34 L360,22 L440,38 L520,16 " +
  "L600,32 L680,20 L760,36 L840,24 L920,38 L1000,22 L1080,34 L1140,26 " +
  "L1200,36 L1200,60 Z";

const RIDGE_NEAR =
  "M0,60 L0,50 L60,38 L120,48 L200,30 L260,44 L330,36 L400,50 L470,32 " +
  "L540,46 L610,28 L690,44 L770,34 L850,48 L930,36 L1010,46 L1090,32 " +
  "L1150,42 L1200,34 L1200,60 Z";

function ridge() {
  const band = el("div", { class: "footer__range", "aria-hidden": "true" });
  band.innerHTML =
    `<svg viewBox="0 0 1200 60" preserveAspectRatio="none" focusable="false">` +
    `<path class="footer__ridge footer__ridge--far" d="${RIDGE_FAR}"/>` +
    `<path class="footer__ridge footer__ridge--near" d="${RIDGE_NEAR}"/>` +
    `</svg>`;
  return band;
}

/**
 * Una sola franja: la navegacion ya esta arriba y repetirla no aporta. Los
 * enlaces institucionales tampoco, que ya firman la cabecera con su logo; en
 * su sitio se nombra PEGASO, que es de la misma casa y no se encuentra solo.
 */
export function buildFooter() {
  return el("footer", { class: "footer" }, [
    el("div", { class: "footer__scale", "aria-hidden": "true" }),
    ridge(),
    el("div", { class: "footer__bar" }, [
      el("span", { class: "footer__brand" }, [
        el("span", { class: "footer__wordmark", text: "SORIAN" }),
        el("span", { class: "footer__org", text: "Subdirección de Cambio Climático y Modelamiento Atmosférico · SENAMHI" }),
      ]),
      el("p", { class: "footer__note", text: "Resultados de modelos numéricos, de carácter referencial." }),
      el("a", {
        class: "footer__sibling",
        href: "https://smn-senamhi.github.io/PEGASO/",
        target: "_blank", rel: "noopener noreferrer",
      }, [
        el("span", { class: "footer__sibling-lead", text: "También del SENAMHI" }),
        el("span", { class: "footer__sibling-name", text: "PEGASO" }),
        el("span", { class: "footer__sibling-go", "aria-hidden": "true" }),
      ]),
      el("span", { class: "footer__meta", text: `© ${new Date().getFullYear()} SENAMHI · v1.0` }),
    ]),
  ]);
}
