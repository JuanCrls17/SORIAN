/**
 * Reconstruccion continua del campo a partir de la grilla de 1°.
 *
 * Se interpola el VALOR (el centro del intervalo de cada celda) y solo despues
 * se aplica la escala de color: interpolar directamente en RGB mezclaria
 * tonos de la paleta divergente y produciria colores que no corresponden a
 * ningun valor.
 *
 * El suavizado es una representacion visual, no resolucion adicional: no
 * anade informacion que el modelo no haya producido.
 */

const NO_DATA = 255;

export function binCenters(scale) {
  return scale.map((bin) => (bin.min + bin.max) / 2);
}

export function paletteRGB(scale) {
  return scale.map((bin) => [
    parseInt(bin.color.slice(1, 3), 16),
    parseInt(bin.color.slice(3, 5), 16),
    parseInt(bin.color.slice(5, 7), 16),
  ]);
}

/** Valor -> color, con la misma particion de intervalos que la leyenda. */
function colorFor(value, scale, rgb) {
  for (let i = 0; i < scale.length; i += 1) {
    if (value <= scale[i].max) return rgb[i];
  }
  return rgb[rgb.length - 1];
}

/**
 * Devuelve un ImageData de (nx*factor) x (ny*factor) con el campo
 * interpolado bilinealmente. La fila 0 es la del norte.
 */
export function smoothField(frame, grid, scale, factor) {
  const { nx, ny } = grid;
  const centers = binCenters(scale);
  const rgb = paletteRGB(scale);

  const width = nx * factor;
  const height = ny * factor;
  const image = new ImageData(width, height);
  const out = image.data;

  const valueAt = (row, col) => {
    const index = frame[row * nx + col];
    return index === NO_DATA ? null : centers[index];
  };

  for (let y = 0; y < height; y += 1) {
    // el canvas crece hacia abajo y la grilla hacia el norte
    const gy = (ny - 1) - (y + 0.5) / factor + 0.5;
    const row0 = Math.max(0, Math.min(ny - 1, Math.floor(gy)));
    const row1 = Math.min(ny - 1, row0 + 1);
    const fy = Math.max(0, Math.min(1, gy - row0));

    for (let x = 0; x < width; x += 1) {
      const gx = (x + 0.5) / factor - 0.5;
      const col0 = Math.max(0, Math.min(nx - 1, Math.floor(gx)));
      const col1 = Math.min(nx - 1, col0 + 1);
      const fx = Math.max(0, Math.min(1, gx - col0));

      const v00 = valueAt(row0, col0);
      const v10 = valueAt(row0, col1);
      const v01 = valueAt(row1, col0);
      const v11 = valueAt(row1, col1);

      const offset = (y * width + x) * 4;
      if (v00 === null || v10 === null || v01 === null || v11 === null) {
        out[offset + 3] = 0;
        continue;
      }

      const value =
        v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) +
        v01 * (1 - fx) * fy + v11 * fx * fy;

      const [r, g, b] = colorFor(value, scale, rgb);
      out[offset] = r;
      out[offset + 1] = g;
      out[offset + 2] = b;
      out[offset + 3] = 255;
    }
  }

  return image;
}
