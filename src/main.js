import { register, start } from "./router.js";
import { buildHeader, buildFooter } from "./ui/nav.js";
import { warmLeaflet } from "./map/leaflet.js";
import inicio from "./views/inicio.js";
import descripcion from "./views/descripcion.js";
import estacional from "./views/estacional.js";
import enso from "./views/enso.js";
import consultas from "./views/consultas.js";

register("inicio", inicio);
register("descripcion", descripcion);
register("estacional", estacional);
register("enso", enso);
register("consultas", consultas);

const app = document.getElementById("app");
const outlet = document.createElement("main");
outlet.className = "outlet";
outlet.id = "contenido";

app.append(buildHeader(), outlet, buildFooter());
start(outlet, "inicio");
warmLeaflet();
