import { PATHS } from "../config.js";
import { load, decodeFrame } from "../data.js";
import { smoothField } from "../map/interpolate.js";

/**
 * El campo se dibuja para el fondo, no para leerlo: a este tamano y con el
 * velo encima, submuestrear cinco veces por celda ya no se distingue de ocho
 * y cuesta la mitad.
 */
const FACTOR = 5;
const HOLD = 2600;
const FADE = 900;

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");

/** Dibuja el bitmap cubriendo el lienzo, recortando lo que sobre. */
function cover(ctx, bitmap, width, height) {
  const scale = Math.max(width / bitmap.width, height / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (width - w) / 2, (height - h) / 2, w, h);
}

/**
 * Fondo animado con el pronostico de verdad: el mismo archivo que sirve al
 * visor, recorriendo sus meses. No es una ilustracion de archivo, asi que
 * dice algo -donde llueve mas y donde menos- y cambia cuando cambie el dato.
 *
 * Cada mes se dibuja una sola vez a un lienzo aparte y luego se funde con el
 * anterior. Recalcular el campo en cada fotograma de la fusion costaria unos
 * 20 ms por fotograma para un fondo que nadie esta mirando de cerca.
 */
export function fieldPreview(canvas, onMonth, model = "ecmwf", variable = "tpara") {
  const ctx = canvas.getContext("2d");
  const frames = [];
  let months = [];
  let index = 0;
  let timer = null;
  let raf = null;
  let visible = false;
  let alive = true;

  function size() {
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(box.width * dpr));
    canvas.height = Math.max(1, Math.round(box.height * dpr));
  }

  function paint(from, to, mix) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (from) {
      ctx.globalAlpha = 1;
      cover(ctx, from, canvas.width, canvas.height);
    }
    ctx.globalAlpha = from ? mix : 1;
    cover(ctx, to, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }

  function show(next) {
    const from = frames[index];
    const to = frames[next];
    index = next;
    onMonth?.(months[next]);

    if (REDUCED.matches || !from) {
      paint(null, to, 1);
      return schedule();
    }

    const start = performance.now();
    const step = (now) => {
      if (!alive) return;
      const mix = Math.min(1, (now - start) / FADE);
      paint(from, to, mix);
      if (mix < 1) raf = requestAnimationFrame(step);
      else schedule();
    };
    raf = requestAnimationFrame(step);
  }

  function schedule() {
    clearTimeout(timer);
    // parado fuera de pantalla: un fondo que nadie ve no merece un temporizador
    if (!visible || REDUCED.matches || frames.length < 2) return;
    timer = setTimeout(() => show((index + 1) % frames.length), HOLD);
  }

  load(PATHS.grid(model, variable)).then((data) => {
    if (!alive) return;
    months = data.months;

    for (const frame of data.frames) {
      const image = smoothField(decodeFrame(frame), data.grid, data.scale, FACTOR);
      const buffer = document.createElement("canvas");
      buffer.width = image.width;
      buffer.height = image.height;
      buffer.getContext("2d").putImageData(image, 0, 0);
      frames.push(buffer);
    }

    size();
    onMonth?.(months[0]);
    paint(null, frames[0], 1);
    canvas.classList.add("is-ready");
    schedule();
  }).catch(() => { /* el fondo es prescindible: sin el la banda sigue entera */ });

  const watcher = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) schedule();
    else clearTimeout(timer);
  }, { threshold: 0.1 });
  watcher.observe(canvas);

  const onResize = () => {
    if (!frames.length) return;
    size();
    paint(null, frames[index], 1);
  };
  window.addEventListener("resize", onResize);

  return () => {
    alive = false;
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    watcher.disconnect();
    window.removeEventListener("resize", onResize);
  };
}
