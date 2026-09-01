import { el } from "./dom.js";
import { navigate } from "../router.js";

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

  window.addEventListener("route:changed", (event) => {
    for (const link of links) {
      link.classList.toggle("is-active", link.dataset.route === event.detail);
      link.toggleAttribute("aria-current", link.dataset.route === event.detail);
    }
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

const FOOTER_LINKS = [
  {
    title: "Plataforma",
    items: [
      { label: "Pronóstico estacional", href: "#estacional" },
      { label: "Monitoreo ENSO", href: "#enso" },
      { label: "Descripción y modelos", href: "#descripcion" },
      { label: "Consultas y sugerencias", href: "#consultas" },
    ],
  },
  {
    title: "Institucional",
    items: [
      { label: "SENAMHI", href: "https://www.senamhi.gob.pe", external: true },
      { label: "Ministerio del Ambiente", href: "https://www.gob.pe/minam", external: true },
      { label: "Avisos y pronósticos", href: "https://www.senamhi.gob.pe/?p=pronostico-meteorologico", external: true },
    ],
  },
];

export function buildFooter() {
  const columns = FOOTER_LINKS.map((group) =>
    el("nav", { class: "footer__col", "aria-label": group.title }, [
      el("h2", { class: "footer__title", text: group.title }),
      el("ul", { class: "footer__list" }, group.items.map((item) =>
        el("li", {}, [
          el("a", {
            class: "footer__link",
            href: item.href,
            target: item.external ? "_blank" : null,
            rel: item.external ? "noopener noreferrer" : null,
            text: item.label,
          }),
        ]),
      )),
    ]),
  );

  return el("footer", { class: "footer" }, [
    el("div", { class: "footer__grid" }, [
      el("div", { class: "footer__brand" }, [
        el("p", { class: "footer__wordmark", text: "SORIAN" }),
        el("p", { class: "footer__tagline", text: "Sistema Operacional de Resolución Integrada para la Predicción del Clima" }),
        el("p", { class: "footer__org", text: "Subdirección de Cambio Climático y Modelamiento Atmosférico · SENAMHI" }),
        el("div", { class: "footer__logos" }, [
          el("img", { src: "assets/logo-minam.png", alt: "Ministerio del Ambiente", width: "728", height: "150", loading: "lazy" }),
          el("img", { src: "assets/logo-senamhi.png", alt: "SENAMHI", width: "350", height: "160", loading: "lazy" }),
        ]),
      ]),
      ...columns,
    ]),

    el("p", { class: "footer__note" }, [
      el("strong", { text: "Nota. " }),
      "Los resultados se basan en modelos numéricos y contienen incertidumbre. La información es de carácter referencial y no reemplaza una evaluación oficial. El SENAMHI no se responsabiliza por interpretaciones o usos inadecuados.",
    ]),

    el("div", { class: "footer__bottom" }, [
      el("p", { text: `© ${new Date().getFullYear()} SENAMHI — Lima, Perú` }),
      el("p", { class: "footer__version", text: "SORIAN v1.0" }),
    ]),
  ]);
}
