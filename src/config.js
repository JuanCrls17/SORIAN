export const MODELS = [
  { id: "ecmwf", label: "ECMWF", institution: "European Centre for Medium-Range Weather Forecasts" },
  { id: "bom", label: "BOM", institution: "Bureau of Meteorology, Australia" },
  { id: "ncep", label: "NCEP", institution: "NOAA / National Centers for Environmental Prediction" },
];

export const VARIABLES = [
  { id: "tpara", label: "Precipitación", short: "Precip.", units: "mm/mes" },
  { id: "mx2t24a", label: "Temp. máxima", short: "T. máx", units: "°C" },
  { id: "mn2t24a", label: "Temp. mínima", short: "T. mín", units: "°C" },
];

export const MAP = {
  center: [-15, -60],
  zoom: 4,
  minZoom: 1.5,
  maxZoom: 8,
  tiles: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
};

export const ANIMATION_INTERVAL = 1100;

export const PATHS = {
  grid: (model, variable) => `data/grids/${model}_${variable}.json`,
  borders: "data/geo/borders.json",
  enso: (chart) => `data/enso/${chart}.json`,
  plotly: "assets/vendor/plotly.min.js",
};
