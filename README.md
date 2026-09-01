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
    legend.js           escala de color discreta
  charts/
    plotly.js           carga diferida y adaptación responsive
    series.js           selección de series del gráfico
  ui/                   nav, selectores, pictogramas y helpers de DOM
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

## Representación del campo

El visor ofrece dos lecturas de la misma grilla:

- **Celdas** — el dato tal como lo entrega el modelo, sin interpolar.
- **Continuo** — reconstrucción bilineal entre centros de celda.

El suavizado interpola el **valor** y solo después aplica la escala de color;
interpolar en RGB mezclaría tonos de la paleta divergente y produciría colores
que no corresponden a ningún valor.

La opción continua se ofrece por defecto solo en temperatura. La precipitación
es un campo espacialmente discontinuo y suavizarlo sugiere transiciones
graduales que el modelo no resuelve, por lo que el control avisa al activarlo.
En ningún caso el suavizado añade resolución: no aporta información que el
modelo no haya producido.

## Enlaces directos

El hash admite parámetros, de modo que cualquier vista se puede compartir:

```
#estacional?modelo=ecmwf&variable=tpara
#estacional?modelo=ecmwf&variable=tpara&modelo2=ncep&variable2=mx2t24a
#estacional?modelo=ecmwf&variable=mx2t24a&detalle=continuo
```

`modelo2` y `variable2` abren la comparación de cortina; `detalle=continuo`
activa la reconstrucción del campo.

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
