# Marco de estilo SORIΛN

Sistema visual del visor climático del SENAMHI, escrito para poder trasplantarse
a otro proyecto sin arrastrar nada de este. Todo lo que hay aquí es CSS y JS de
navegador: sin compilación, sin dependencias, sin framework.

**Cómo se usa.** Se copia el bloque de tokens a un `tokens.css`, se enlaza
primero de todo, y a partir de ahí se escribe contra las variables, nunca
contra los valores. Cambiar `--navy` en un sitio debe repintar el proyecto
entero; si algo no cambia, es que se escapó un color a mano.

```
tokens.css      ← la única capa que se edita al cambiar de marca
base.css        ← reset, tipografía, foco, accesibilidad
layout.css      ← cabecera, pie, contenedores
components.css  ← piezas reutilizables
```

---

## 1. Color

### Tokens

```css
:root {
  /* Marca */
  --navy:      #0a1c48;  /* identidad: titulares, pastilla activa, pie */
  --navy-700:  #123067;  /* navy que admite texto blanco encima en bloques */
  --blue:      #0b6bb8;  /* acción: foco, bordes vivos, marcador */
  --blue-600:  #0a5c9e;  /* enlaces (el --blue puro no llega a 4.5:1 en texto) */

  /* Texto y superficie */
  --ink:       #1c2430;  /* texto corrido; nunca #000 */
  --muted:     #5a6675;  /* secundario, 4.6:1 sobre blanco */
  --line:      #d9e0e8;  /* filetes y bordes en reposo */
  --surface:   #ffffff;  /* tarjetas */
  --canvas:    #eef2f6;  /* fondo de página */
  --accent:    #f3f7fb;  /* relleno tenue: hover, filas alternas */

  /* Oscuro (portada y láminas sobre imagen) */
  --deep:      #061027;  /* fondo de las bandas oscuras */
  --on-deep:   #a9c0da;  /* párrafo sobre --deep */
  --eyebrow:   #8fb7e0;  /* cejilla sobre --deep */
  --glow:      122 178 236;  /* azul del halo, en canal RGB suelto */
}
```

El azul del halo se guarda **sin `rgb()`** a propósito: así se le puede poner
cualquier opacidad al vuelo con `rgb(var(--glow) / 62%)`, que es lo que hacen
el canto de la cápsula activa y la luz del nombre.

### Reglas de uso

| Situación | Qué se usa |
|---|---|
| Titular | `--navy`. Sobre fondo oscuro, `#fff`. |
| Texto corrido | `--ink` sobre claro, `--on-deep` sobre oscuro. |
| Enlace | `--blue-600`, subrayado. |
| Borde en reposo | `--line`. Al enfocar o activar, `--blue`. |
| Lo elegido | Fondo `--navy` y letra `#fff`. **Siempre el mismo par**, en el menú, en las cápsulas y sobre el mapa. |
| Negro | Nunca. Ni `#000` ni un fondo propio oscurecido: sobre una imagen se lee como un agujero, no como una selección. |

Esa última fila es la lección más cara del proyecto. La cápsula activa sobre el
mapa se pintó al principio con el fondo de la banda al 76 %; no era un color del
sistema y desentonaba con todo lo demás. Sobre imagen, lo elegido se marca con
el navy de la casa rebajado, no con oscuridad genérica:

```css
.marker { background: rgb(10 28 72 / 82%); }   /* --navy con el fondo asomando */
.chip.is-active { border-color: rgb(122 178 236 / 62%); color: #fff; }
```

### La escala como firma

El proyecto tiene una rampa divergente (marrón → teal, tipo BrBG) que es el dato
mismo. Reducida a 3 px de alto se convierte en la firma gráfica: abre la
cabecera, encabeza la lámina y cierra el pie.

```css
--scale-line: linear-gradient(90deg,
  #543005 0%, #9d6115 9%, #bf812d 18%, #d5ad62 27%, #e7cf94 36%,
  #f6e8c3 44%, #f6f1e5 50%, #e6f2f0 56%,
  #c7eae5 64%, #98d7cd 73%, #67bbb1 82%, #35978f 91%, #003c30 100%);

.masthead__scale, .footer__scale { height: 3px; background: var(--scale-line); }
```

**El patrón trasplantable no es esta rampa, es la idea:** tomar el elemento
gráfico que define al proyecto —una escala, un espectro, un degradado de marca—
y repetirlo como filete de 3 px en los bordes del documento. Cuesta dos reglas y
ata la página entera sin ocupar sitio.

---

## 2. Tipografía

```css
--font: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;

body { font-size: 16px; line-height: 1.6; }
h1, h2, h3 { line-height: 1.25; color: var(--navy); margin: 0 0 .5em; }
h1 { font-size: clamp(1.5rem, 4.5vw, 2.125rem); }
h2 { font-size: clamp(1.25rem, 3.5vw, 1.5rem); margin-top: 2rem; }
h3 { font-size: 1.0625rem; margin-top: 1.5rem; }
p  { margin: 0 0 1rem; }
```

Sin fuente web. La pila del sistema no cuesta una sola petición y no produce
salto de texto al cargar; en un visor donde el peso importa, una tipografía de
600 KB es la primera cosa que sobra.

**Todo en `rem`, nada en `px`** salvo bordes y píxeles de retícula. Así el
tamaño de letra del navegador sigue mandando.

**`clamp()` en vez de puntos de ruptura** para cualquier texto grande. Tres
reglas de `font-size` en tres `@media` es lo mismo que un `clamp` de una línea,
pero con dos saltos visibles.

Cifras: `font-variant-numeric: tabular-nums` en todo lo que cambie en el sitio
(meses, contadores, marcas de una escala). Sin eso, el texto tiembla al
actualizarse porque el `1` es más estrecho que el `8`.

### El truco del interletraje

Un `letter-spacing` grande deja el hueco también **detrás de la última letra**,
así que la caja termina un espacio más allá de la N y nada alinea con ella. Se
descuenta con un margen negativo del mismo valor:

```css
.wordmark {
  letter-spacing: .15em;
  margin-right: -.15em;   /* siempre el mismo número, con signo cambiado */
}
```

Vale para cualquier titular espaciado. Es la diferencia entre que el logotipo
alinee con la columna o quede desplazado dos píxeles para siempre.

---

## 3. La marca: la Λ

**SORIΛN se escribe con lambda mayúscula (`U+039B`), no con A.**

No es una fuente distinta ni un SVG: en cualquier palo seco la Λ tiene
exactamente el trazo de una A a la que le falta el travesaño. Sale gratis, se
escala con el texto, hereda color y sombra, y se puede seleccionar y buscar.

```js
/**
 * La A va sin travesaño. Como el signo no es una A, la palabra se anuncia como
 * imagen con su nombre real: duplicar el texto para lector de pantalla también
 * servía, pero al copiar la página salía "SORIANSORIAN".
 */
export function wordmark(tag, cls) {
  return el(tag, { class: cls, role: "img", "aria-label": "SORIAN", text: "SORIΛN" });
}
```

Tres cosas que hay que respetar al llevárselo:

1. **`role="img"` + `aria-label` con el nombre real.** Sin eso un lector de
   pantalla dice «SORI lambda N».
2. **Un solo nodo de texto.** Nada de un `<span class="sr-only">` con el nombre
   repetido: al copiar la página sale duplicado.
3. **`white-space: nowrap`.** Seis letras muy abiertas se parten en «SORIA / N»
   en cuanto la barra se aprieta.

La misma función se usa en los tres sitios donde aparece la marca —portada,
cabecera y pie— con clases distintas. Un solo origen para el signo.

---

## 4. Forma y retícula

```css
--radius:    12px;   /* tarjetas y bloques */
--radius-sm:  8px;   /* botones y campos */
/* pastillas: 999px, siempre */
--shadow: 0 2px 10px rgb(10 28 72 / 8%);   /* tintada de navy, no gris */

--wrap: 1120px;      /* columna de lectura */
--header-h: 56px;    /* 66px a partir de 900px */
```

La sombra lleva el navy de la marca al 8 %, no negro. Una sombra gris sobre un
fondo azulado se ve sucia; con el tono de la marca se funde.

### El riel

Un solo token pone a la cabecera, la portada, la lámina y el pie a arrancar de
**la misma vertical**, tanto si la columna está centrada como si el bloque va a
sangre:

```css
--rail: calc(max(0px, 50vw - 560px) + 1rem);           /* 1120/2 = 560 */
@media (min-width: 900px) {
  :root { --rail: calc(max(0px, 50vw - 800px) + 2rem); } /* 1600/2 = 800 */
}
```

Hasta el ancho máximo es el margen fijo; a partir de ahí, lo que sobra al
centrar. Cualquier elemento a sangre usa `padding-inline: var(--rail)` y queda
alineado con el contenido sin saber nada de él.

### Sangre completa

```css
.hero, .showcase { margin-inline: calc(50% - 50vw); padding-inline: var(--rail); }
```

El margen negativo saca el bloque del ancho útil hasta los bordes de la ventana;
el relleno devuelve el texto a la columna. Sin `100vw`, que cuenta la barra de
desplazamiento y provoca desbordamiento horizontal.

---

## 5. Movimiento

### Las reglas

1. **Solo `opacity` y `transform`.** Son lo único que el navegador compone sin
   repintar. Animar `width`, `top` o `filter` en un bucle infinito es lo que
   hace que estos efectos vayan a tirones.
2. **Todo movimiento que se repite va bajo `prefers-reduced-motion`**, y el
   estado en quietud tiene que verse bien: la luz se queda encendida a media
   asta, no apagada.
3. **El estado inicial oculto lo arma el JS, no el CSS.** Si el módulo no llega
   a ejecutarse, la sección se ve entera y quieta en lugar de quedarse invisible
   para siempre. Se añade una clase (`.is-armed`) y el CSS solo entonces oculta.
4. **Nada se anima fuera de pantalla.** Un `IntersectionObserver` enciende y
   apaga; escuchar el scroll todo el rato para mover algo que nadie mira es el
   coste que no se ve.
5. **Cada gesto de scroll o resize se agrupa en un `requestAnimationFrame`.**

### Curvas

| Uso | Curva | Duración |
|---|---|---|
| Cambio de color, borde, fondo | `ease` implícito | 120–200 ms |
| Entrada de contenido | `cubic-bezier(.2, .75, .3, 1)` | 340–550 ms |
| Apertura con rebote leve (menú) | `cubic-bezier(.2, .9, .3, 1.06)` | 260–300 ms |
| Pastilla que viaja | `cubic-bezier(.34, .84, .3, 1)` | 420 ms |
| Respiración de la marca | `ease-in-out` | 6.5–9 s |

Por encima de 1.0 en el tercer valor de la curva hay rebote. Se usa al abrir
algo, nunca al cerrarlo.

### Catálogo

**Entrada de vista** — el contenido sube al aparecer. La clase la pone el
enrutador y se quita al terminar.

```css
.outlet.is-entering { animation: view-in .34s cubic-bezier(.22, .9, .3, 1) both; }
@keyframes view-in {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: none; }
}
```

**Entrada escalonada de la portada** — cada regla declara **solo el fotograma
inicial**, para que el final sea el estado propio del elemento, que no es el
mismo en móvil que en pantalla amplia. `backwards` mantiene el estado inicial
durante el retardo.

```css
@media (prefers-reduced-motion: no-preference) {
  .hero__eyebrow,
  .hero__title,
  .hero__text { animation: hero-rise .55s cubic-bezier(.2, .75, .3, 1) backwards; }
  .hero__eyebrow { animation-delay: .05s; }
  .hero__title   { animation-delay: .13s; }
  .hero__text    { animation-delay: .21s; }
  .hero__art     { animation: hero-reveal .9s cubic-bezier(.2, .7, .3, 1) .18s backwards; }
}
@keyframes hero-rise   { from { opacity: 0; transform: translateY(14px); } }
@keyframes hero-reveal { from { opacity: 0; transform: scale(.93); } }
```

**La marca respira** — dos capas al mismo compás: una lámpara detrás que solo
cambia de opacidad (gratis) y el halo del propio texto.

```css
.hero__title::before {           /* la lámpara, en su propia capa */
  content: "";
  position: absolute; inset: -22% -14% -22% -16%; z-index: -1;
  background: radial-gradient(52% 128% at 40% 50%,
    rgb(108 172 240 / 38%) 0%, rgb(108 172 240 / 0%) 72%);
  filter: blur(16px);
  opacity: .28;
  animation: marca-luz 6.5s ease-in-out .8s infinite;
}
@keyframes marca-luz { 50% { opacity: 1; } }

.wordmark {
  text-shadow:
    0 0 1px  rgb(226 240 255 / 40%),   /* filo claro en el canto */
    0 0 26px rgb(122 178 236 / 26%),   /* halo azul */
    0 0 68px rgb(58 122 200 / 18%),    /* halo lejano */
    0 16px 38px rgb(2 8 22 / 55%);     /* sombra que lo asienta */
  animation: marca-halo 6.5s ease-in-out .8s infinite;
}
@keyframes marca-halo {
  50% { text-shadow:
    0 0 2px  rgb(232 244 255 / 72%),
    0 0 30px rgb(146 199 247 / 62%),
    0 0 84px rgb(74 144 218 / 42%),
    0 16px 38px rgb(2 8 22 / 55%); }
}

@media (prefers-reduced-motion: reduce) {
  .hero__title::before { animation: none; opacity: .6; }  /* encendida a media asta */
  .wordmark { animation: none; }
}
```

Ese `text-shadow` de cuatro capas es la receta completa de la luz: **canto +
halo cercano + halo lejano + sombra de asiento**. Vale para cualquier titular
sobre una imagen oscura, cambiando solo el tono.

**La firma del pie respira más despacio** (9 s), lo justo para que se note que
la página está viva sin llamar la atención:

```css
.footer__wordmark { animation: firma-luz 9s ease-in-out infinite; }
@keyframes firma-luz {
  0%, 100% { text-shadow: 0 0 12px rgb(122 178 236 / 0%); }
  50%      { text-shadow: 0 0 2px rgb(226 240 255 / 35%), 0 0 20px rgb(122 178 236 / 55%); }
}
```

**Menú que se despliega** — se queda en el árbol para poder animarlo; la
`visibility` se retrasa lo que dura la salida para que no desaparezca de golpe.

```css
.nav {
  opacity: 0; visibility: hidden; pointer-events: none;
  transform: translateY(-10px) scaleY(.97);
  transform-origin: top center;
  transition: opacity .2s ease,
              transform .3s cubic-bezier(.2, .9, .3, 1.06),
              visibility 0s linear .3s;
}
.nav.is-open { opacity: 1; visibility: visible; pointer-events: auto; transform: none; transition-delay: 0s; }

/* las entradas caen una tras otra, 40 ms de diferencia */
.nav.is-open .nav__link:nth-of-type(1) { transition-delay: .05s; }
.nav.is-open .nav__link:nth-of-type(2) { transition-delay: .09s; }
.nav.is-open .nav__link:nth-of-type(3) { transition-delay: .13s; }
```

**Hamburguesa que se vuelve aspa** — tres barras, una real y dos
pseudoelementos; la del medio se apaga y las otras rotan sobre el centro.

```css
.nav__burger-bars,
.nav__burger-bars::before,
.nav__burger-bars::after {
  display: block; width: 18px; height: 2px; border-radius: 2px;
  background: var(--navy);
  transition: transform .3s cubic-bezier(.3, .9, .3, 1.05), background-color .2s;
}
.nav__burger-bars { position: relative; }
.nav__burger-bars::before { content: ""; position: absolute; left: 0; top: -6px; }
.nav__burger-bars::after  { content: ""; position: absolute; left: 0; top:  6px; }

.nav__burger[aria-expanded="true"] .nav__burger-bars { background: transparent; }
.nav__burger[aria-expanded="true"] .nav__burger-bars::before { transform: translateY( 6px) rotate( 45deg); }
.nav__burger[aria-expanded="true"] .nav__burger-bars::after  { transform: translateY(-6px) rotate(-45deg); }
```

El estado lo lleva `aria-expanded`, no una clase: el atributo que necesita el
lector de pantalla es el mismo que dispara la animación, así que no pueden
desincronizarse.

**Sección que entra al llegar a ella** — armada desde JS, revelada por
`IntersectionObserver`, y una vez dentro se queda: volver a ocultarla al salir
haría que parpadease cada vez que se pasa por delante.

```css
.showcase.is-armed .showcase__head,
.showcase.is-armed .showcase__foot {
  opacity: 0; transform: translateY(14px);
  transition: opacity .7s ease, transform .8s cubic-bezier(.2, .75, .3, 1);
}
.showcase.is-armed .showcase__foot { transition-delay: .12s; }
.showcase.is-armed.is-in .showcase__head,
.showcase.is-armed.is-in .showcase__foot { opacity: 1; transform: none; }
```

**Espera** — un solo anillo, sin librería:

```css
.spinner__ring {
  width: 30px; height: 30px;
  border: 3px solid var(--line);
  border-top-color: var(--blue);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

### La red de seguridad

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
  }
}
```

Va al final de `base.css` y atrapa cualquier animación que se escape. No sustituye
a apagar a mano las que se repiten —esas necesitan además un estado en reposo
que se vea bien—, pero garantiza que nada se mueva.

---

## 6. La pastilla deslizante

La pieza más reutilizable del proyecto. El fondo de la opción activa **viaja**
hasta ella deformándose, en vez de aparecer de golpe en su sitio. Sirve para
menús, conmutadores segmentados y grupos de cápsulas, en horizontal o apilados.

Un solo elemento por grupo, absoluto, detrás de los botones:

```css
.marker {
  position: absolute; top: 0; left: 0; z-index: 0;
  border-radius: 999px;
  opacity: 0;
  pointer-events: none;
  transform-origin: center;
  /* el viaje lo anima el JS por fotogramas: una transición aquí pelearía
     con ellos y aplanaría el estirado */
  transition: opacity .18s linear;
}
.marker.is-visible { opacity: 1; }

.chip, .nav__link { position: relative; z-index: 1; }   /* por delante */
.chip.is-active   { background: transparent; color: #fff; }  /* el fondo lo pone la pastilla */
```

El módulo completo (`marker.js`) es autónomo y no depende de nada del proyecto
salvo un ayudante para crear elementos:

```js
const STRETCH_MAX = 1.35;
const REACH = 320;      // viaje, en píxeles, que ya da el estirado máximo
const DURATION = 420;
const EASE = "cubic-bezier(.34, .84, .3, 1)";
const OVERSHOOT = 0.05; // cuánto se pasa de largo antes de recogerse

/**
 * La deformación sigue al movimiento -se alarga al despegar, va más estirada a
 * media trayectoria, se pasa de largo al llegar y se recoge-, que es el
 * estirado y aplastado de siempre. El volumen se conserva: lo que se alarga en
 * un eje se aplana en el otro.
 */
function dropletFrames(from, to) {
  const dx = to.left - from.left;
  const dy = to.top - from.top;
  const travel = Math.hypot(dx, dy);

  const stretch = Math.min(STRETCH_MAX, 1 + travel / REACH);
  const squash = 1 / (1 + (stretch - 1) * 0.62);
  const flat = Math.abs(dx) >= Math.abs(dy);   // grupos horizontales o apilados

  const at = (t, sx, sy, width, height) => ({
    width: `${width}px`, height: `${height}px`,
    transform: `translate(${from.left + dx * t}px, ${from.top + dy * t}px) scale(${sx}, ${sy})`,
  });

  const midWidth = (from.width + to.width) / 2;
  const midHeight = (from.height + to.height) / 2;
  const long = flat ? stretch : squash;
  const short = flat ? squash : stretch;

  return [
    { ...at(0, 1, 1, from.width, from.height), offset: 0 },
    { ...at(0.18, 1 + (long - 1) * 0.55, 1 - (1 - short) * 0.55, from.width, from.height), offset: 0.16 },
    { ...at(0.5, long, short, midWidth, midHeight), offset: 0.45 },
    { ...at(1 + OVERSHOOT, flat ? 0.94 : 1.05, flat ? 1.05 : 0.94, to.width, to.height), offset: 0.78 },
    { ...at(1, 1, 1, to.width, to.height), offset: 1 },
  ];
}
```

Cuatro decisiones que hay que llevarse junto con el código:

- **El reposo se fija antes de animar.** Si la animación no corre o se cancela a
  medio camino, la pastilla queda igualmente donde debe.
- **El sitio se guarda en un `Map` por grupo**, para que al redibujar el grupo la
  pastilla nueva arranque donde quedó la anterior y el movimiento se lea como
  uno solo.
- **Un `ResizeObserver` la recoloca** cuando la pista cambia de ancho: al aparecer
  la barra de desplazamiento la ventana pierde unos píxeles y la pastilla se
  quedaba desplazada sin que nadie hubiera tocado nada. Se desconecta solo
  cuando su pastilla sale del árbol.
- **Ese observador no cancela lo que esté en vuelo.** Cancelar ahí mataba el
  viaje entero y la pastilla saltaba de golpe.

---

## 7. Vidrio sobre imagen

Cuando los controles van encima de un mapa o una fotografía, blancos y opacos se
leen como parches pegados. La cápsula deja pasar el fondo desenfocado y solo la
elegida se vuelve sólida, que es justo la jerarquía que hace falta.

```css
.chip {
  color: #d7e5f5;
  border: 1px solid rgb(255 255 255 / 18%);
  background: rgb(255 255 255 / 8%);
  backdrop-filter: blur(14px) saturate(130%);
  -webkit-backdrop-filter: blur(14px) saturate(130%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 14%);   /* filo de luz arriba */
  transition: background .18s, border-color .16s, color .2s;
}
.chip:hover { background: rgb(255 255 255 / 16%); border-color: rgb(255 255 255 / 34%); color: #fff; }

/* La elegida se hunde, no se ilumina. Y suelta el vidrio: si siguiera puesto,
   desdibujaría el canto de la pastilla en pleno viaje. */
.chip.is-active {
  color: #fff;
  background: transparent;
  border-color: rgb(122 178 236 / 62%);
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
```

El `saturate(130%)` es lo que separa esto de un simple desenfoque: devuelve al
fondo el color que el blur le quita.

**Velo antes que recuadro.** Para que un texto se lea sobre una imagen, un
degradado que se abre hacia donde no hay texto funciona mejor que una caja: la
imagen respira y el texto no pierde contraste.

```css
.hero::after {                    /* de pie: cierra arriba y abajo */
  content: ""; position: absolute; inset: 0; z-index: -1;
  background: linear-gradient(180deg,
    rgb(6 16 39 / 88%) 0%, rgb(6 16 39 / 80%) 50%, rgb(6 16 39 / 93%) 100%);
}
@media (min-width: 760px) {       /* apaisado: se abre hacia la derecha */
  .hero::after {
    background: linear-gradient(100deg,
      #061027 0%, rgb(6 16 39 / 92%) 28%, rgb(6 16 39 / 58%) 52%,
      rgb(6 16 39 / 14%) 78%, rgb(6 16 39 / 0%) 100%);
  }
}
```

**Halo en lugar de caja para los titulares** sobre imagen:

```css
.showcase__title { text-shadow: 0 1px 2px rgb(2 8 22 / 45%), 0 14px 40px rgb(2 8 22 / 60%); }
```

Y el orden de capas se declara una vez, con `isolation: isolate` en el
contenedor para que los `z-index` negativos no se escapen a la página:

```css
.showcase { position: relative; isolation: isolate; overflow: hidden; }
/* -3 imagen  ·  -2 velo  ·  -1 detalle nítido  ·  0 divisorias  ·  flujo: texto */
```

---

## 8. Accesibilidad

No es una capa que se añade al final; son seis reglas que no cuestan nada si se
ponen desde el principio.

```css
:focus-visible {
  outline: 3px solid var(--blue);
  outline-offset: 2px;
  border-radius: 4px;
}

.sr-only {                        /* al oído, no a la vista */
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.skip-link { position: absolute; left: -9999px; z-index: 100; padding: .75rem 1rem;
             background: var(--navy); color: #fff; }
.skip-link:focus { left: .5rem; top: .5rem; }

[hidden] { display: none !important; }   /* el atributo manda sobre cualquier display */
```

- **44 px de alto mínimo** en todo lo que se toque (`min-height: 44px`). En una
  barra muy apretada se puede bajar a 34, nunca por debajo.
- **El estado vive en el atributo ARIA**, no en una clase paralela:
  `aria-expanded`, `aria-current`, `aria-pressed`. La animación cuelga de él.
- **Lo decorativo se marca** `aria-hidden="true"`: lienzos, filetes, flechas.
- **`display: none` no oculta al lector de pantalla si lo que se quiere es que
  siga leyéndose**; y `.sr-only` no oculta a la vista si se olvida el
  `clip-path`. Son dos herramientas distintas.

---

## 9. Móvil

Regla del proyecto: **cada «más grande» del escritorio hay que acotarlo y
medirlo a 320, 360, 390 y 430 px antes de darlo por hecho.** La mayoría de los
defectos de esta página nacieron de un tamaño que se vio bien en 1440 y nunca se
comprobó en un teléfono.

Puntos de ruptura, de menos a más: **420** (la marca se queda en logotipos),
**640** (los controles pasan a lo ancho), **760** (la portada va a sangre),
**900** (la cabecera cabe en una franja), **1100/1120** (nombres largos y aire
extra), **1600** (los rótulos de los paneles ceden su sitio).

Lo que se hace en pantalla estrecha:

- **Se quita, no se encoge.** Un diptico pasa a un solo panel; el aviso legal
  del pie desaparece. Media banda por cabeza serían dos tiras ilegibles.
- **Nombre corto en lugar de recorte.** Cada opción lleva `label` y `short`, y
  la cápsula cambia de uno a otro con `display`. Nada de `text-overflow`.
- **La cejilla baja de 13 a 11 px**: era la línea más larga de la portada y se
  comía tres renglones del teléfono antes de llegar al nombre.
- **Cero desbordamiento horizontal.** Se verifica con:

```js
document.documentElement.scrollWidth <= window.innerWidth
```

  a 320, 360, 390, 412, 430, 768, 1024, 1440 y 1920 px. Lo único que puede
  quedar fuera es el `.skip-link`, por diseño.

`min-width: 0` en todo hijo de un flex que contenga texto. Sin eso, el contenido
se niega a encoger y empuja la página fuera de la ventana; es la causa de casi
todo el desbordamiento horizontal que existe.

---

## 10. Rendimiento

Lo que se aprendió midiendo, no suponiendo:

- **Nada de librerías en el camino crítico.** Un mapa de 144 KB y un motor de
  gráficos de 4,7 MB se cargan **cuando la sección los pide**, con un
  precalentado en cuanto el navegador queda ocioso (`requestIdleCallback`), para
  que igual abran al instante.
- **La calidad del filtro se elige según lo que se va a ver.** Un campo que sale
  desenfocado 3 px bajo un velo no necesita `imageSmoothingQuality: "high"`:
  bajarlo a `"low"` recortó el 42 % del trabajo del hilo principal sin
  diferencia visible.
- **`resize` y `scroll` siempre agrupados en un `requestAnimationFrame`**, y con
  `{ passive: true }`.
- **En móvil, `resize` se dispara al replegarse la barra del navegador** con un
  cambio de solo alto. Si lo que se recalcula depende del ancho, hay que
  comprobarlo antes de hacer nada:

```js
let ancho = window.innerWidth;
window.addEventListener("resize", () => {
  if (window.innerWidth === ancho) return;
  ancho = window.innerWidth;
  recolocar();
});
```

- **Todo lo que se registra, se suelta.** Cada `addEventListener` en `document`
  o `window`, cada `setTimeout`, cada `requestAnimationFrame` y cada observador
  necesita su contrapartida en el `destroy` de la vista. La comprobación: los
  oyentes y los nodos tienen que quedar planos tras tres vueltas completas por
  todas las secciones.
- **El tiempo entre fotogramas medido en un navegador sin GPU no significa
  nada.** Si al quitar un efecto la cifra empeora, no es señal. Hay que medir
  trabajo del hilo principal, no fotogramas.

---

## 11. Lista de verificación para un proyecto nuevo

- [ ] `tokens.css` copiado; `--navy`, `--blue` y la rampa cambiados por los de la nueva marca.
- [ ] Ni un color escrito a mano fuera de los tokens (`grep -n "#[0-9a-f]\{6\}" src/styles/*.css` solo debe encontrar los del bloque de tokens y los degradados).
- [ ] El filete de 3 px de la rampa abre y cierra el documento.
- [ ] Titulares con `clamp()`, tamaños en `rem`, cifras con `tabular-nums`.
- [ ] Si el logotipo lleva interletraje, el margen negativo que lo descuenta.
- [ ] `--rail` puesto y usado por cabecera, bloques a sangre y pie.
- [ ] Toda animación repetida apagada bajo `prefers-reduced-motion`, con estado en reposo comprobado.
- [ ] La red de seguridad `prefers-reduced-motion` al final de `base.css`.
- [ ] `:focus-visible`, `.sr-only` y `.skip-link` presentes.
- [ ] 44 px mínimos en todo lo que se toca.
- [ ] Medido a 320, 360, 390 y 430 px: sin desbordamiento, sin texto recortado.
- [ ] Oyentes y nodos planos tras tres vueltas por todas las secciones.
