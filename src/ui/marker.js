import { el } from "./dom.js";

const STRETCH_MAX = 1.3;
const TRAVEL = 320;
const SETTLE = 150;

// Los grupos se redibujan al cambiar la seleccion. Guardar el sitio de cada
// pastilla permite que la del grupo nuevo arranque donde quedo la anterior y
// el movimiento se lea como uno solo.
const lastPlace = new Map();

/**
 * Pastilla que viaja hasta la opcion activa y se estira en el trayecto: se
 * alarga en la direccion del movimiento y se aplana en la misma medida,
 * como una gota que se despega y vuelve a juntarse al llegar.
 *
 * Devuelve la funcion que la lleva hasta el elemento activo.
 */
export function slidingMarker(track, key) {
  const marker = el("span", { class: "marker", "aria-hidden": "true" });
  track.prepend(marker);
  let settle = null;
  let current = null;

  const place = (box, stretch) => {
    const squash = 1 / (1 + (stretch - 1) * 0.62);
    marker.style.width = `${box.width}px`;
    marker.style.height = `${box.height}px`;
    marker.style.transform = `translate(${box.left}px, ${box.top}px) scale(${stretch}, ${squash})`;
  };

  const boxOf = (node) => ({
    left: node.offsetLeft, top: node.offsetTop,
    width: node.offsetWidth, height: node.offsetHeight,
  });

  /**
   * El sitio de la pastilla se guarda en pixeles, asi que deja de valer en
   * cuanto la pista cambia de ancho. Y cambia sola: al terminar de cargar el
   * grafico la pagina crece, aparece la barra de desplazamiento y la ventana
   * pierde unos pixeles, de modo que la pastilla se quedaba desplazada
   * respecto de la opcion activa sin que nadie hubiera tocado nada.
   *
   * El observador se desconecta el solo cuando su pastilla sale del arbol,
   * que es lo que ocurre cada vez que el grupo se vuelve a dibujar.
   */
  if (typeof ResizeObserver === "function") {
    let width = track.clientWidth;
    const observer = new ResizeObserver(() => {
      if (!marker.isConnected) return observer.disconnect();
      if (track.clientWidth === width || !current?.offsetWidth) return;

      width = track.clientWidth;
      const box = boxOf(current);
      lastPlace.set(key, box);
      marker.style.transition = "none";
      place(box, 1);
      requestAnimationFrame(() => { marker.style.transition = ""; });
    });
    observer.observe(track);
  }

  return function moveTo(active) {
    if (!active?.offsetWidth) {
      current = null;
      marker.classList.remove("is-visible");
      return;
    }

    current = active;
    const to = {
      left: active.offsetLeft, top: active.offsetTop,
      width: active.offsetWidth, height: active.offsetHeight,
    };
    const from = lastPlace.get(key);
    lastPlace.set(key, to);
    marker.classList.add("is-visible");

    marker.style.transition = "none";
    place(from ?? to, 1);

    requestAnimationFrame(() => {
      marker.style.transition = "";
      if (!from) return;

      const travel = Math.hypot(to.left - from.left, to.top - from.top);
      place(to, Math.min(STRETCH_MAX, 1 + travel / TRAVEL));
      clearTimeout(settle);
      settle = setTimeout(() => place(to, 1), SETTLE);
    });
  };
}
