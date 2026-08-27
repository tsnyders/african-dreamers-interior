// Geometry for pasting a floor into a photograph.
//
// Kept out of the component so the component stays about lifecycle, and so the
// projective maths can be read (and checked) on its own.

export type Point = readonly [number, number];

/**
 * Where a plate lands inside its box under `object-fit: cover`.
 *
 * The canvas sits exactly on top of the `<img>`, so the shader has to reproduce
 * the same crop the browser applied, or the pasted floor drifts away from the
 * room as the viewport changes shape.
 *
 * Returns the offset and scale that map plate coordinates (0..1, top-left
 * origin) into screen coordinates on the canvas.
 */
export function coverTransform(
  boxW: number,
  boxH: number,
  imageW: number,
  imageH: number,
) {
  const scale = Math.max(boxW / imageW, boxH / imageH);
  const drawnW = imageW * scale;
  const drawnH = imageH * scale;
  return {
    offset: [(boxW - drawnW) / 2 / boxW, (boxH - drawnH) / 2 / boxH] as const,
    scale: [drawnW / boxW, drawnH / boxH] as const,
  };
}

/** Apply a cover transform to a point in plate space. */
export function toScreen(
  p: Point,
  t: ReturnType<typeof coverTransform>,
): Point {
  return [p[0] * t.scale[0] + t.offset[0], p[1] * t.scale[1] + t.offset[1]];
}

/**
 * The homography taking the unit square onto a quad, row-major.
 *
 * Corners map (0,0)->q0, (1,0)->q1, (1,1)->q2, (0,1)->q3, so passing the floor
 * as near-left, near-right, far-right, far-left gives a floor space where x
 * runs across the room and y runs away from the viewer.
 *
 * Standard projective construction: solve for the two perspective terms first,
 * then the affine part falls out.
 */
export function squareToQuad(q0: Point, q1: Point, q2: Point, q3: Point) {
  const [x0, y0] = q0;
  const [x1, y1] = q1;
  const [x2, y2] = q2;
  const [x3, y3] = q3;

  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;

  // A parallelogram has no perspective term; the general solve divides by zero.
  if (Math.abs(dx3) < 1e-10 && Math.abs(dy3) < 1e-10) {
    return [x1 - x0, x2 - x1, x0, y1 - y0, y2 - y1, y0, 0, 0, 1] as const;
  }

  const den = dx1 * dy2 - dy1 * dx2;
  const g = (dx3 * dy2 - dy3 * dx2) / den;
  const h = (dx1 * dy3 - dy1 * dx3) / den;

  return [
    x1 - x0 + g * x1,
    x3 - x0 + h * x3,
    x0,
    y1 - y0 + g * y1,
    y3 - y0 + h * y3,
    y0,
    g,
    h,
    1,
  ] as const;
}

/**
 * Mean luminance of the plate's floor, averaged over the matte.
 *
 * The shader relights the new material by the old floor's brightness; without a
 * reference the whole floor would be scaled by an arbitrary amount. Sampled on
 * downscaled copies — this is a single average, not a texture.
 */
export function floorLuminance(
  image: HTMLImageElement,
  mask: HTMLImageElement,
): number {
  const W = 96;
  const H = Math.max(1, Math.round((image.naturalHeight / image.naturalWidth) * W));

  const read = (source: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(source, 0, 0, W, H);
    try {
      return ctx.getImageData(0, 0, W, H).data;
    } catch {
      // A tainted canvas would throw. The plate is same-origin, so this is
      // belt and braces; a neutral mid-grey keeps the relight from blowing the
      // floor out.
      return null;
    }
  };

  const plate = read(image);
  const matte = read(mask);
  if (!plate || !matte) return 0.5;

  let total = 0;
  let count = 0;
  for (let i = 0; i < plate.length; i += 4) {
    if (matte[i] < 128) continue;
    total +=
      (0.2126 * plate[i] + 0.7152 * plate[i + 1] + 0.0722 * plate[i + 2]) / 255;
    count++;
  }
  return count ? total / count : 0.5;
}
