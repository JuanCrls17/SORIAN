const routes = new Map();
let outlet = null;
let current = null;

export function register(name, view) {
  routes.set(name, view);
}

export function start(node, fallback) {
  outlet = node;
  const go = () => resolve(routeName() || fallback);
  window.addEventListener("hashchange", go);
  go();
}

/** El hash admite parametros: #estacional?modelo=bom&variable=tpara */
export function routeName() {
  return location.hash.slice(1).split("?")[0];
}

export function routeParams() {
  return new URLSearchParams(location.hash.split("?")[1] || "");
}

export function navigate(name) {
  location.hash = name;
}

export function active() {
  return current;
}

async function resolve(name) {
  const view = routes.get(name);
  if (!view) return navigate("inicio");

  if (current?.name === name) return;

  if (current?.destroy) current.destroy();
  outlet.replaceChildren();
  current = null;

  const instance = await view(outlet);
  current = { name, ...instance };
  outlet.scrollTop = 0;
  enter(outlet);
  window.dispatchEvent(new CustomEvent("route:changed", { detail: name }));
}

/** Reinicia la animacion de entrada aunque la clase ya estuviera puesta. */
function enter(node) {
  node.classList.remove("is-entering");
  void node.offsetWidth;
  node.classList.add("is-entering");
}
