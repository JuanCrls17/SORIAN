const cache = new Map();

export function load(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((response) => {
      if (!response.ok) throw new Error(`${response.status} al cargar ${url}`);
      return response.json();
    }).catch((error) => {
      cache.delete(url);
      throw error;
    }));
  }
  return cache.get(url);
}

export function decodeFrame(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
