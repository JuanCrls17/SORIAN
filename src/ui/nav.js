import { el } from "./dom.js";
import { navigate } from "../router.js";
import { slidingMarker } from "./marker.js";

export const SECTIONS = [
  { id: "inicio", label: "Inicio" },
  { id: "descripcion", label: "Descripción" },
  { id: "estacional", label: "Estacional" },
  { id: "enso", label: "ENSO" },
  { id: "consultas", label: "Consultas" },
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

const INSTITUTIONS = [
  { label: "SENAMHI", href: "https://www.senamhi.gob.pe" },
  { label: "Ministerio del Ambiente", href: "https://www.gob.pe/minam" },
];

/** Una sola franja: la navegacion ya esta arriba y repetirla no aporta. */
export function buildFooter() {
  return el("footer", { class: "footer" }, [
    el("div", { class: "footer__bar" }, [
      el("span", { class: "footer__brand" }, [
        el("span", { class: "footer__wordmark", text: "SORIAN" }),
        el("span", { class: "footer__org", text: "Subdirección de Cambio Climático y Modelamiento Atmosférico · SENAMHI" }),
      ]),
      el("p", { class: "footer__note", text: "Resultados de modelos numéricos, de carácter referencial." }),
      el("nav", { class: "footer__links", "aria-label": "Enlaces institucionales" }, INSTITUTIONS.map((item) =>
        el("a", {
          class: "footer__link", href: item.href,
          target: "_blank", rel: "noopener noreferrer", text: item.label,
        }),
      )),
      el("span", { class: "footer__meta", text: `© ${new Date().getFullYear()} SENAMHI · v1.0` }),
    ]),
  ]);
}
