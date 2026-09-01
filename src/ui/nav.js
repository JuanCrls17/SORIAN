import { el } from "./dom.js";
import { navigate } from "../router.js";

export const SECTIONS = [
  { id: "inicio", label: "Inicio" },
  { id: "descripcion", label: "Descripción" },
  { id: "subestacional", label: "Subestacional" },
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
        el("span", { class: "brand__logos" }, [
          el("img", { class: "brand__logo", src: "assets/logo-minam.png", alt: "Ministerio del Ambiente", width: "728", height: "150" }),
          el("img", { class: "brand__logo brand__logo--senamhi", src: "assets/logo-senamhi.png", alt: "SENAMHI", width: "350", height: "160" }),
        ]),
        el("span", { class: "brand__divider", "aria-hidden": "true" }),
        el("span", { class: "brand__name" }, [
          el("strong", { text: "SORIAN" }),
          el("small", { text: "Predicción del clima" }),
        ]),
      ]),
      button,
    ]),
    menu,
  ]);
}

export function buildFooter() {
  return el("footer", { class: "footer" }, [
    el("div", { class: "footer__note" }, [
      el("strong", { text: "Nota. " }),
      el("span", { text: "Los resultados se basan en modelos numéricos y contienen incertidumbre. La información es de carácter referencial y no reemplaza una evaluación oficial. El SENAMHI no se responsabiliza por interpretaciones o usos inadecuados." }),
    ]),
    el("div", { class: "footer__meta" }, [
      el("p", { text: "© SENAMHI · SORIAN — Lima, Perú" }),
    ]),
  ]);
}
