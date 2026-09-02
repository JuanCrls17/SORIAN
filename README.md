# SORIAN

**Sistema Operacional de Resolución Integrada para la Predicción del Clima**

Plataforma de visualización climática de la Subdirección de Cambio Climático y Modelamiento Atmosférico
del Servicio Nacional de Meteorología e Hidrología del Perú
(SENAMHI). Integra pronóstico estacional multimodelo y monitoreo ENSO para el
Perú y Sudamérica.

## Contenido

| Sección | Descripción |
|---|---|
| Estacional | Anomalías mensuales de precipitación y temperatura. 3 modelos × 3 variables × 6 meses, con comparación de cortina entre dos pronósticos. |
| ENSO | Predicción multimodelo de la anomalía de TSM en las regiones Niño 1+2 y 3.4, con selección libre de los 22 modelos. |
| Descripción | Modelos integrados, configuración WRF y referencias científicas. |
| Consultas | Formulario de sugerencias y observaciones. |

## Arquitectura

Sitio estático sin proceso de compilación: módulos ES nativos servidos
directamente. Los datos viven separados del código de presentación.

```
index.html              shell + metadatos + PWA
src/
  main.js               registro de vistas y arranque
  router.js             enrutado por hash, admite parámetros
  config.js             modelos, variables y parámetros del mapa
  data.js               carga con caché y decodificación de grillas
  views/                una vista por sección
  map/
    viewer.js           visor de mapa: capas, leyenda y línea de tiempo
    grid-layer.js       capa canvas para la grilla regular
    swipe.js            cortina de comparación entre dos capas
    interpolate.js      reconstrucción continua del campo
    legend.js           escala de color y lectura del punto en palabras
    analysis.js         reparto del dominio por clase de anomalía
  charts/
    plotly.js           carga diferida y adaptación responsive
    regions.js          reparto de la figura ENSO en regiones Niño
    series.js           selección de series del gráfico
  ui/                   nav, selectores, pictogramas, hoja y helpers de DOM
  styles/               base, layout, componentes, visor
data/
  grids/                9 grillas de pronóstico (~35 KB c/u)
  enso/                 series de los gráficos ENSO
  geo/borders.json      límites políticos compartidos
  content/              textos editables sin tocar el código
tools/                  extractores de datos (Python 3)
assets/                 logos, iconos y librerías locales
```

### Formato de las grillas

Cada archivo de `data/grids/` describe una grilla regular y sus fotogramas
mensuales:

```json
{
  "title": "Anomalía Precipitación (mm/mes)",
  "grid":   { "lat0": -59.5, "lon0": -89.5, "dlat": 1, "dlon": 1, "ny": 74, "nx": 59 },
  "months": ["Ago 2026", "…"],
  "scale":  [{ "color": "#543005", "min": -100, "max": -80.4 }, "…"],
  "frames": ["<base64 de ny×nx bytes: un índice de color por celda>", "…"]
}
```

Un byte por celda en lugar de un polígono con su estilo: **24,3 MB → 35 KB por
visor.** El renderizado ocurre en un único canvas (`grid-layer.js`), no en 26.196
nodos SVG. Comparar dos pronósticos solo recorta el canvas de cada capa, así que
la cortina se arrastra sin volver a dibujar la grilla.

## Dos disposiciones

La interfaz no se adapta: se resuelve dos veces.

- **Amplia** (≥ 860 px) — los mandos flotan sobre el mapa en una sola franja:
  a la izquierda tres acciones recogidas en una pastilla de iconos y, a su
  derecha, la selección de modelo y variable. Comparando, los dos lados forman
  una barra continua partida por el centro, cada mitad sobre el lado que
  gobierna. El **Reparto** del dominio por clase de anomalía —qué porcentaje
  cae bajo y sobre lo normal, y cuál es el rango dominante— se abre a petición
  en un panel lateral, no por ancho de ventana: quita sitio al mapa y no
  siempre se necesita.
- **Compacta** (< 860 px) — el mapa queda despejado y los mandos bajan a una
  barra al alcance del pulgar; las opciones se eligen en una hoja inferior.

## Representación del campo

El visor ofrece dos lecturas de la misma grilla:

- **Celdas** — el dato tal como lo entrega el modelo, sin interpolar.
- **Continuo** — reconstrucción del campo entre centros de celda, con
  interpolación bicúbica (Catmull-Rom). Frente a la bilineal, la pendiente no
  cambia de golpe al cruzar un nodo, que es lo que dibujaba rombos sobre los
  centros de celda. Junto a la costa, donde falta vecindario para el núcleo de
  4×4, cae a bilineal.

El suavizado interpola el **valor** y solo después aplica el color; interpolar
en RGB mezclaría tonos de la paleta divergente y produciría colores que no
corresponden a ningún valor. El color se toma de una rampa continua entre las
dos clases contiguas, de modo que un valor a medio camino recibe el tono a
medio camino: encajarlo en su clase devolvía el campo a colores planos con un
salto seco en cada frontera. La mezcla es siempre entre vecinos de una escala
ordenada, así que nunca aparece un tono ajeno a la paleta.

La opción continua se ofrece por defecto solo en temperatura. La precipitación
es un campo espacialmente discontinuo y suavizarlo sugiere transiciones
graduales que el modelo no resuelve, por lo que el control avisa al activarlo.
En ningún caso el suavizado añade resolución: no aporta información que el
modelo no haya producido.

### Lectura del punto

La fuente publica el campo **clasificado por rangos**, no por valor: una celda
da su clase de la escala y no una cifra puntual. Por eso la franja bajo el mapa
dice primero qué significa —«Algo más lluvia de lo normal»— y deja el intervalo
detrás, como respaldo de quien quiera la cifra.

La frase sale del propio índice de la clase, sin dato nuevo: la escala es
divergente y simétrica, así que el lado dice hacia dónde se desvía la celda y
la distancia al centro, cuánto. El vocabulario cambia con la variable, que una
anomalía de temperatura no se lee como una de lluvia. Las dos clases de los
extremos no tienen tope real —su límite exterior es solo donde la escala deja
de dividir—, y se leen «80.4 o más» en vez de dar como medida una cifra que no
lo es.

## Enlaces directos

El hash admite parámetros, de modo que cualquier vista se puede compartir:

```
#estacional?modelo=ecmwf&variable=tpara
#estacional?modelo=ecmwf&variable=tpara&modelo2=ncep&variable2=mx2t24a
#estacional?modelo=ecmwf&variable=mx2t24a&detalle=continuo
#estacional?modelo=ecmwf&variable=tpara&reparto=1
```

`modelo2` y `variable2` abren la comparación de cortina; `detalle=continuo`
activa la reconstrucción del campo y `reparto=1`, el panel de distribución.

## Actualizar los datos

Los visores que genera el pipeline en Python (Folium y Plotly) se convierten con
los scripts de `tools/`. Los HTML de origen no forman parte del repositorio.

```bash
python tools/extract_grids.py   /ruta/a/visores  data/grids
python tools/extract_enso.py    /ruta/a/visores  data/enso
python tools/extract_borders.py /ruta/a/visores/visor_ecmwf_tpara.html data/geo/borders.json
```

`extract_grids.py` espera archivos con el patrón `visor_<modelo>_<variable>.html`.
Los límites políticos solo se regeneran si cambia el dominio del mapa.

## Licencia y uso

Los resultados provienen de modelos numéricos y contienen incertidumbre. La
información es de carácter referencial y no reemplaza una evaluación oficial.
El SENAMHI no se responsabiliza por interpretaciones o usos inadecuados.

© SENAMHI — Lima, Perú
