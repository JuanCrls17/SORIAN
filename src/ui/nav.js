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

  const marker = el("span", { class: "nav__marker", "aria-hidden": "true" });
  const menu = el("nav", { class: "nav", id: "nav-main", "aria-label": "Navegación principal" }, [marker, ...links]);
  let settle = null;

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

  /**
   * La pastilla activa viaja de un enlace al siguiente y se estira en el
   * trayecto, como una gota que se despega y vuelve a juntarse al llegar.
   */
  function moveMarker() {
    const active = links.find((link) => link.classList.contains("is-active"));
    if (!active || !active.offsetWidth) return marker.classList.remove("is-visible");

    const target = active.offsetLeft;
    const travel = Math.abs(target - (marker.at ?? target));
    const stretch = marker.at === undefined ? 1 : Math.min(1.3, 1 + travel / 420);
    marker.at = target;

    marker.classList.add("is-visible");
    marker.style.width = `${active.offsetWidth}px`;
    marker.style.transform = `translateX(${target}px) scaleX(${stretch})`;

    clearTimeout(settle);
    settle = setTimeout(() => { marker.style.transform = `translateX(${target}px)`; }, 150);
  }

  window.addEventListener("route:changed", (event) => {
    for (const link of links) {
      link.classList.toggle("is-active", link.dataset.route === event.detail);
      link.toggleAttribute("aria-current", link.dataset.route === event.detail);
    }
    requestAnimationFrame(moveMarker);
  });

  window.addEventListener("resize", () => {
    marker.at = undefined;
    moveMarker();
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
