"""Cut a cushion out of its studio backdrop.

The cushions drift across the ivory stone of the upholstery section, so they
need real alpha. Shot on a near-ivory sweep, an ivory cushion cannot be
separated by a plain colour threshold — that just punches holes through the
middle of the subject.

So: build a soft matte from distance-to-backdrop, then keep only the backdrop
that is REACHABLE FROM THE FRAME EDGE. Anything enclosed by the subject stays
opaque no matter how closely it matches the sweep. The ramp is pushed hard to
zero out in the open backdrop as well — a broad region sitting at alpha 0.1-0.3
is invisible on its own and reads as a faint rectangle once composited on the
stone.

Usage:
    python tools/cut-out-cushion.py <source-image> <id>

e.g. python tools/cut-out-cushion.py public/images/_src/boucle.png boucle
     -> public/images/cushion-boucle.webp
"""

import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

SIZE = 640


def matte(path: str) -> Image.Image:
    im = Image.open(path).convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
    pixels = np.asarray(im).astype(np.float32)

    border = np.concatenate(
        [
            pixels[:6].reshape(-1, 3),
            pixels[-6:].reshape(-1, 3),
            pixels[:, :6].reshape(-1, 3),
            pixels[:, -6:].reshape(-1, 3),
        ]
    )
    backdrop = np.median(border, axis=0)
    noise = np.abs(border - backdrop).max(axis=1).mean()

    distance = np.abs(pixels - backdrop).max(axis=2)
    soft = np.clip((distance - max(5.0, noise * 1.8)) / 22.0, 0, 1)

    # Only backdrop connected to the frame edge may become transparent.
    height, width = soft.shape
    low = soft < 0.5
    reachable = np.zeros((height, width), bool)
    queue: deque = deque()
    for y in range(height):
        for x in (0, width - 1):
            if low[y, x] and not reachable[y, x]:
                reachable[y, x] = True
                queue.append((y, x))
    for x in range(width):
        for y in (0, height - 1):
            if low[y, x] and not reachable[y, x]:
                reachable[y, x] = True
                queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if (
                0 <= ny < height
                and 0 <= nx < width
                and low[ny, nx]
                and not reachable[ny, nx]
            ):
                reachable[ny, nx] = True
                queue.append((ny, nx))

    open_backdrop = np.clip((soft - 0.40) / 0.30, 0, 1)
    alpha = np.where(reachable, open_backdrop, 1.0)
    alpha_im = Image.fromarray((alpha * 255).astype(np.uint8), "L").filter(
        ImageFilter.GaussianBlur(1.0)
    )

    out = im.convert("RGBA")
    out.putalpha(alpha_im)
    return out


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    source, name = sys.argv[1], sys.argv[2]
    out_path = f"public/images/cushion-{name}.webp"
    # `exact` keeps the RGB under fully transparent pixels, which stops WebP
    # bleeding backdrop colour into the feathered edge.
    matte(source).save(out_path, "WEBP", quality=86, method=6, exact=True)
    print(f"{source} -> {out_path}")


if __name__ == "__main__":
    main()
