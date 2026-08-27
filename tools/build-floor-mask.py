"""Build the floor matte for the flooring swapper.

The shader replaces the floor inside the room plate. Deciding *where* the floor
is cannot be done with a straight line: the sofa and the side table stand in
front of the wall, so their bases dip below any such line and get painted over,
while the floor running along the glazing sits above it and gets missed.

So the matte is grown from seed points on the floor, accepting a neighbour only
when it is within a small step of its neighbour's colour. That follows the
floor's light gradient into every corner and stops dead at real edges — the
sofa plinth, the side table, the door track.

One region needs help: along the left wall the plaster and the floor are the
same tone with no shadow line at all (the luminance profile is smooth straight
through the junction), so nothing can detect a boundary there and the grow
climbs the wall. That region gets a stated ceiling instead, set slightly low on
purpose — leaving a few pixels of original floor at the wall reads as a
skirting, whereas painting walnut up the wall does not.

Run this after changing the room plate:

    python tools/build-floor-mask.py
"""

from collections import deque

import numpy as np
from PIL import Image, ImageFilter

PLATE = "public/images/room-interior.webp"
OUT = "public/images/room-interior-floor-mask.webp"

# Points known to be on the floor.
SEEDS = [
    (0.30, 0.88),
    (0.50, 0.92),
    (0.70, 0.80),
    (0.12, 0.80),
    (0.88, 0.90),
    (0.97, 0.96),
]

# Highest the floor may reach. Tight where no edge exists to stop the grow;
# loose past the corner, where the door track does the work.
BACK_WALL_Y = 0.663
BACK_WALL_UNTIL_X = 0.63
GLAZING_CEILING_Y = 0.615

# How far a neighbouring pixel may differ and still be the same surface. Small
# enough to stop at the sofa plinth, large enough to walk the light gradient.
STEP_TOLERANCE = 4


def main() -> None:
    im = Image.open(PLATE).convert("RGB")
    width, height = im.size
    pixels = np.asarray(im).astype(np.int16)

    ceiling = np.where(
        np.arange(width) / width <= BACK_WALL_UNTIL_X,
        BACK_WALL_Y,
        GLAZING_CEILING_Y,
    )
    ceiling = (ceiling * height).astype(np.int32)

    seen = np.zeros((height, width), bool)
    queue: deque = deque()
    for sx, sy in SEEDS:
        x, y = int(sx * width), int(sy * height)
        seen[y, x] = True
        queue.append((y, x))

    while queue:
        y, x = queue.popleft()
        here = pixels[y, x]
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if not (0 <= ny < height and 0 <= nx < width) or seen[ny, nx]:
                continue
            if ny < ceiling[nx]:
                continue
            if np.abs(pixels[ny, nx] - here).max() <= STEP_TOLERANCE:
                seen[ny, nx] = True
                queue.append((ny, nx))

    mask = Image.fromarray((seen * 255).astype(np.uint8), "L")
    # Close pinholes left by grout lines and specks, then soften the cut so the
    # new floor meets the skirting without aliasing.
    mask = mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    mask = mask.filter(ImageFilter.GaussianBlur(1.2))
    mask.save(OUT, "WEBP", quality=90, method=6)
    print(f"floor is {seen.mean() * 100:.1f}% of the plate -> {OUT}")


if __name__ == "__main__":
    main()
