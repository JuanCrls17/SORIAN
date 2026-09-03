import { PATHS, VARIABLES } from "../config.js";
import { load, decodeFrame } from "../data.js";
import { smoothField } from "../map/interpolate.js";
import { buildLegend } from "../map/legend.js";

/**
 * Submuestreo por celda. Alto, porque de la grilla solo se muestra una
 * ventana y ampliada: con un factor corto el recorte llegaria a pantalla
 * como un mosaico. Solo vive en memoria la variable que se esta viendo.
 */
const FACTOR = 14;
const HOLD = 3200;
const FADE = 900;

const DEG = Math.PI / 180;
const toMercator = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * DEG) / 2));

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");

/**
 * Ventana minima, en grados: el Peru con margen. No es la ventana final: esa
 * se ensancha hasta la forma del hueco, de modo que el mapa lo llene entero
 * sin deformarse y sin dejar franjas muertas a los lados. Asi la misma lamina
 * sirve apaisada en el escritorio y vertical en el telefono.
 */
const CORE = { west: -82.5, east: -65.5, south: -19, north: 2 };

/** Ventana que llena un hueco de esta proporcion, dentro del dominio. */
function windowFor(ratio, grid) {
  const limit = {
    west: grid.lon0,
    east: grid.lon0 + grid.nx * grid.dlon,
    north: toMercator(grid.lat0 + grid.ny * grid.dlat),
    south: toMercator(grid.lat0),
  };

  let { west, east } = CORE;
  let north = toMercator(CORE.north);
  let south = toMercator(CORE.south);

  // se estira el lado corto; el otro ya cumple
  if ((east - west) * DEG / (north - south) < ratio) {
    const want = ((north - south) * ratio) / DEG;
    const half = (want - (east - west)) / 2;
    west -= half;
    east += half;
  } else {
    const want = ((east - west) * DEG) / ratio;
    const half = (want - (north - south)) / 2;
    north += half;
    south -= half;
  }

  // al topar con el borde del dominio se desplaza en vez de encogerse, para
  // no cambiar la proporcion que se acaba de calcular
  const slide = (lo, hi, min, max) => {
    if (lo < min) { hi += min - lo; lo = min; }
    if (hi > max) { lo -= hi - max; hi = max; }
    return [Math.max(lo, min), Math.min(hi, max)];
  };
  [west, east] = slide(west, east, limit.west, limit.east);
  [south, north] = slide(south, north, limit.south, limit.north);

  return { west, east, north, south };
}

/** Recorte del bitmap y proyeccion de la ventana sobre el lienzo. */
function framing(grid, win) {
  const top = toMercator(grid.lat0 + grid.ny * grid.dlat);
  const span = top - toMercator(grid.lat0);
  const lonSpan = grid.nx * grid.dlon;

  return {
    crop: {
      x: (win.west - grid.lon0) / lonSpan,
      y: (top - win.north) / span,
      w: (win.east - win.west) / lonSpan,
      h: (win.north - win.south) / span,
    },
    x: (lon, width) => ((lon - win.west) / (win.east - win.west)) * width,
    y: (lat, height) => ((win.north - toMercator(lat)) / (win.north - win.south)) * height,
  };
}

/** Limites politicos sobre el campo: sin ellos son manchas sin pais. */
function borderLayer(geo, proj, width, height, dpr) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
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

  // Trazo con funda, como en cartografia: el campo va del beige palido al
  // granate, y una linea de un solo color se pierde en la mitad de la escala.
  // El halo claro la despega de los tonos oscuros y el trazo oscuro, de los
  // claros, asi que se ve sobre cualquier clase.
  const weight = Math.max(0.7, 0.6 * dpr);
  ctx.strokeStyle = "rgb(255 255 255 / 45%)";
  ctx.lineWidth = weight + 1.6;
  ctx.stroke();
  ctx.strokeStyle = "rgb(12 28 56 / 55%)";
  ctx.lineWidth = weight;
  ctx.stroke();
  return canvas;
}

/**
 * Lamina unica y grande con el pronostico, recorriendo sus meses y sus
 * variables como un fondo que se renueva.
 *
 * No es una ilustracion: es el mismo archivo que sirve al visor, con su misma
 * escala y su misma reconstruccion, asi que la precipitacion sale en celdas
 * -campo discontinuo- y las temperaturas continuas.
 *
 * Cada mes se interpola la primera vez que hace falta y se guarda; al cambiar
 * de variable se suelta lo de la anterior, de modo que en memoria solo esta
 * la serie que se esta viendo.
 */
export function forecastPanel({ canvas, legend, onState }, model = "ecmwf") {
  const ctx = canvas.getContext("2d");
  const sets = new Map();
  const cache = new Map();

  let variable = 0;
  let month = 0;
  let sticky = false;
  let geo = null;
  let lines = null;
  let win = null;
  let proj = null;
  let timer = null;
  let raf = null;
  let visible = false;
  let alive = false;

  const data = () => sets.get(VARIABLES[variable].id);
  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

  function measure() {
    const box = canvas.getBoundingClientRect();
    const scale = dpr();
    canvas.width = Math.max(1, Math.round(box.width * scale));
    canvas.height = Math.max(1, Math.round(box.height * scale));

    win = windowFor(box.width / box.height, data().grid);
    proj = framing(data().grid, win);
    lines = geo ? borderLayer(geo, proj, canvas.width, canvas.height, scale) : null;
  }

  /** Devuelve el mes ya interpolado, calculandolo la primera vez. */
  function frameOf(index) {
    const key = `${variable}:${index}`;
    if (cache.has(key)) return cache.get(key);

    const set = data();
    // a factor 1 la reconstruccion cae justo sobre los centros de celda: sale
    // la clase tal cual, que es lo que hay que ver en un campo discontinuo
    const factor = VARIABLES[variable].continuous ? FACTOR : 1;
    const image = smoothField(decodeFrame(set.frames[index]), set.grid, set.scale, factor);
    const buffer = document.createElement("canvas");
    buffer.width = image.width;
    buffer.height = image.height;
    buffer.getContext("2d").putImageData(image, 0, 0);
    cache.set(key, buffer);
    return buffer;
  }

  function paint(from, to, mix) {
    const w = canvas.width;
    const h = canvas.height;
    const { crop } = proj;
    const cut = (bitmap) => ctx.drawImage(
      bitmap,
      crop.x * bitmap.width, crop.y * bitmap.height,
      crop.w * bitmap.width, crop.h * bitmap.height,
      0, 0, w, h,
    );

    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = VARIABLES[variable].continuous;
    ctx.imageSmoothingQuality = "high";
    if (from) {
      ctx.globalAlpha = 1;
      cut(from);
    }
    ctx.globalAlpha = from ? mix : 1;
    cut(to);
    ctx.globalAlpha = 1;
    if (lines) ctx.drawImage(lines, 0, 0);
  }

  function announce() {
    onState?.({ variable: VARIABLES[variable].id, month: data().months[month] });
  }

  /** Cambia de variable: suelta la serie anterior y rehace la leyenda. */
  function setVariable(next, byHand) {
    if (next === variable) return;
    for (const key of [...cache.keys()]) {
      if (key.startsWith(`${variable}:`)) cache.delete(key);
    }
    variable = next;
    if (byHand) sticky = true;
    legend?.replaceChildren(buildLegend(data().scale));
  }

  function show(nextVariable, nextMonth) {
    const from = cache.get(`${variable}:${month}`);
    if (nextVariable !== variable) setVariable(nextVariable);
    month = nextMonth;
    const to = frameOf(month);
    announce();

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

  function next() {
    const total = data().months.length;
    const wrap = month + 1 >= total;
    // la serie avanza mes a mes; al terminarla pasa a la variable siguiente,
    // salvo que el visitante haya elegido una: entonces se queda en ella
    const nextVariable = wrap && !sticky ? (variable + 1) % VARIABLES.length : variable;
    return [nextVariable, wrap ? 0 : month + 1];
  }

  function schedule() {
    clearTimeout(timer);
    // el observador avisa de que la lamina se ve en cuanto se le engancha,
    // que es antes de que haya llegado ninguna grilla
    if (!sets.size || !visible || REDUCED.matches) return;
    const [v, m] = next();
    // el que viene se interpola en la pausa, no al empezar la fusion: ahi
    // costaria el primer fotograma y se veria el tiron
    setTimeout(() => { if (alive && v === variable) frameOf(m); }, 0);
    timer = setTimeout(() => show(v, m), HOLD);
  }

  alive = true;
  Promise.all(VARIABLES.map((item) => load(PATHS.grid(model, item.id))))
    .then((loaded) => {
      if (!alive) return;
      VARIABLES.forEach((item, i) => sets.set(item.id, loaded[i]));

      measure();
      legend?.replaceChildren(buildLegend(data().scale));
      paint(null, frameOf(0), 1);
      canvas.classList.add("is-ready");
      announce();
      schedule();

      // los limites llegan despues y se pintan encima sin rehacer el campo
      return load(PATHS.borders).then((shape) => {
        if (!alive) return;
        geo = shape;
        lines = borderLayer(geo, proj, canvas.width, canvas.height, dpr());
        paint(null, frameOf(month), 1);
      });
    })
    .catch(() => { /* la lamina es prescindible: sin ella el bloque sigue entero */ });

  const watcher = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) schedule();
    else clearTimeout(timer);
  }, { threshold: 0.1 });
  watcher.observe(canvas);

  // el recorte se recalcula con la forma del hueco: al cambiar de ancho no
  // hay que rehacer ningun campo, solo volver a encuadrarlo
  const onResize = () => {
    if (!sets.size) return;
    measure();
    paint(null, frameOf(month), 1);
  };
  window.addEventListener("resize", onResize);

  return {
    /** Elige variable a mano: se queda en ella y arranca por su primer mes. */
    select: (id) => {
      const index = VARIABLES.findIndex((item) => item.id === id);
      if (index < 0 || !sets.size) return;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      setVariable(index, true);
      show(index, 0);
    },
    destroy: () => {
      alive = false;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      watcher.disconnect();
      window.removeEventListener("resize", onResize);
      cache.clear();
    },
  };
}
