import { PATHS, VARIABLES } from "../config.js";
import { load, decodeFrame } from "../data.js";
import { smoothField } from "../map/interpolate.js";

/**
 * Submuestreo por celda. A este tamano -unos 250 px de ancho- seis muestras
 * ya dejan el paso de color por debajo de lo que se distingue, y cuestan un
 * tercio de lo que costaria el ocho del visor.
 */
const FACTOR = 6;
const HOLD = 2600;
const FADE = 900;

const DEG = Math.PI / 180;
const toMercator = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * DEG) / 2));

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");

/** Proyeccion del dominio de la grilla sobre el lienzo, en Mercator. */
function projection(grid) {
  const top = toMercator(grid.lat0 + grid.ny * grid.dlat);
  const bottom = toMercator(grid.lat0);
  return {
    span: top - bottom,
    top,
    // ancho/alto que le corresponde al dominio ya proyectado: el lienzo se
    // dimensiona con el, asi el campo se dibuja sin deformar y sin recortes
    ratio: (grid.nx * grid.dlon * DEG) / (top - bottom),
    x: (lon, width) => ((lon - grid.lon0) / (grid.nx * grid.dlon)) * width,
    y: (lat, height) => ((top - toMercator(lat)) / (top - bottom)) * height,
  };
}

/** Limites politicos sobre el campo: sin ellos son manchas sin pais. */
function borderLayer(geo, proj, width, height, dpr) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "rgb(255 255 255 / 34%)";
  ctx.lineWidth = Math.max(0.6, 0.55 * dpr);
  ctx.lineJoin = "round";

  ctx.beginPath();
  for (const line of geo.geometry.coordinates) {
    line.forEach(([lon, lat], i) => {
      const px = proj.x(lon, width);
      const py = proj.y(lat, height);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
  }
  ctx.stroke();
  return canvas;
}

/**
 * Tira de previsualizaciones: el pronostico tal como sale, un panel por
 * variable, recorriendo los mismos meses a la vez.
 *
 * No es una ilustracion de fondo sino el dato: el mismo archivo que sirve al
 * visor, con la misma escala y la misma reconstruccion. Por eso se dibuja
 * entero y a plena opacidad, y no recortado detras de un velo.
 *
 * Los meses se calculan bajo demanda y se guardan: al entrar solo hace falta
 * el primero, y el siguiente se prepara durante la pausa, de modo que ningun
 * fotograma de la fusion carga con una interpolacion completa.
 */
export function forecastStrip(panels, onMonth, model = "ecmwf") {
  // Cada variable se dibuja como la dibuja el visor: la precipitacion es
  // discontinua en el espacio, asi que va en celdas -interpolarla sugeriria
  // transiciones que el modelo no resuelve- y la temperatura, continua.
  const items = panels.map(({ canvas, variable }) => ({
    canvas, variable, ctx: canvas.getContext("2d"), cache: [], data: null, lines: null,
    continuous: VARIABLES.find((v) => v.id === variable)?.continuous ?? true,
  }));

  let months = [];
  let index = 0;
  let timer = null;
  let raf = null;
  let geo = null;
  let visible = false;
  let alive = true;

  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

  function size(item) {
    const box = item.canvas.getBoundingClientRect();
    const scale = dpr();
    item.canvas.width = Math.max(1, Math.round(box.width * scale));
    item.canvas.height = Math.max(1, Math.round(box.height * scale));
    if (geo && item.proj) {
      item.lines = borderLayer(geo, item.proj, item.canvas.width, item.canvas.height, scale);
    }
  }

  /** Devuelve el mes ya interpolado, calculandolo la primera vez. */
  function frameOf(item, month) {
    if (item.cache[month]) return item.cache[month];
    const { data } = item;
    // a factor 1 la reconstruccion cae justo sobre los centros de celda: sale
    // la clase tal cual, que es lo que hay que ver en un campo discontinuo
    const factor = item.continuous ? FACTOR : 1;
    const image = smoothField(decodeFrame(data.frames[month]), data.grid, data.scale, factor);
    const buffer = document.createElement("canvas");
    buffer.width = image.width;
    buffer.height = image.height;
    buffer.getContext("2d").putImageData(image, 0, 0);
    item.cache[month] = buffer;
    return buffer;
  }

  function paint(item, from, to, mix) {
    const { ctx, canvas } = item;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = item.continuous;
    ctx.imageSmoothingQuality = "high";
    if (from) {
      ctx.globalAlpha = 1;
      ctx.drawImage(from, 0, 0, w, h);
    }
    ctx.globalAlpha = from ? mix : 1;
    ctx.drawImage(to, 0, 0, w, h);
    ctx.globalAlpha = 1;
    if (item.lines) ctx.drawImage(item.lines, 0, 0);
  }

  function show(next) {
    const pairs = items.map((item) => ({
      item, from: item.cache[index], to: frameOf(item, next),
    }));
    index = next;
    onMonth?.(months[next]);

    if (REDUCED.matches || pairs.some((p) => !p.from)) {
      for (const { item, to } of pairs) paint(item, null, to, 1);
      return schedule();
    }

    const start = performance.now();
    const step = (now) => {
      if (!alive) return;
      const mix = Math.min(1, (now - start) / FADE);
      for (const { item, from, to } of pairs) paint(item, from, to, mix);
      if (mix < 1) raf = requestAnimationFrame(step);
      else schedule();
    };
    raf = requestAnimationFrame(step);
  }

  function schedule() {
    clearTimeout(timer);
    if (!visible || REDUCED.matches || months.length < 2) return;
    const next = (index + 1) % months.length;
    // el mes que viene se interpola ahora, en la pausa, no al empezar la
    // fusion: ahi costaria el primer fotograma y se veria el tiron
    setTimeout(() => { if (alive) for (const item of items) frameOf(item, next); }, 0);
    timer = setTimeout(() => show(next), HOLD);
  }

  Promise.all(items.map((item) => load(PATHS.grid(model, item.variable))))
    .then((sets) => {
      if (!alive) return;
      months = sets[0].months;
      items.forEach((item, i) => {
        item.data = sets[i];
        item.proj = projection(sets[i].grid);
        item.canvas.style.aspectRatio = String(item.proj.ratio);
      });

      for (const item of items) {
        size(item);
        paint(item, null, frameOf(item, 0), 1);
        item.canvas.classList.add("is-ready");
      }
      onMonth?.(months[0]);
      schedule();

      // los limites llegan despues y se pintan encima sin rehacer el campo
      return load(PATHS.borders).then((data) => {
        if (!alive) return;
        geo = data;
        for (const item of items) {
          item.lines = borderLayer(geo, item.proj, item.canvas.width, item.canvas.height, dpr());
          paint(item, null, item.cache[index], 1);
        }
      });
    })
    .catch(() => { /* la tira es prescindible: sin ella la banda sigue entera */ });

  const watcher = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) schedule();
    else clearTimeout(timer);
  }, { threshold: 0.1 });
  watcher.observe(items[0].canvas);

  const onResize = () => {
    for (const item of items) {
      if (!item.cache[index]) continue;
      size(item);
      paint(item, null, item.cache[index], 1);
    }
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
