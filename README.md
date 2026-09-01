# SORIAN

**Sistema Operacional de Resolución Integrada para la Predicción del Clima**

Plataforma de visualización climática de la Subdirección de Cambio Climático y Modelamiento Atmosférico
del Servicio Nacional de Meteorología e Hidrología del Perú
(SENAMHI). Integra pronóstico estacional multimodelo y monitoreo ENSO para el
Perú y Sudamérica.

## Contenido

| Sección | Descripción |
|---|---|
| Estacional | Anomalías mensuales de precipitación y temperatura. 3 modelos × 3 variables × 6 meses. |
| ENSO | Predicción multimodelo de la anomalía de TSM en las regiones Niño 1+2 y 3.4. |
| Subestacional | Predicciones semanales. En desarrollo. |
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
    legend.js           escala de color discreta
  charts/plotly.js      carga diferida y adaptación responsive
  ui/                   nav, selectores y helpers de DOM
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
nodos SVG.

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
