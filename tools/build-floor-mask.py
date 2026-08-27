"""Build the floor matte for the flooring swapper.

The shader replaces the floor inside the room plate. Deciding *where* the floor
is cannot be done with a straight line: the sofa and the side table stand in
front of the wall, so their bases dip below any such line and get painted over,
while the floor running along the glazing sits above it and gets missed.

So the matte is grown from seed points on the floor, accepting a neighbour only
when it is within a small step of its neighbour's colour. That follows the
floor's light gradient into every corner and stops dead at real edges — the
sofa plinth, the side table, the door track.

One region needs help: along the left wall the plaster and the floor are nearly
the same tone, so the grow can climb the wall. That wall's base is NOT a
horizontal line — it is a steep diagonal running from the corner behind the
sofa down to the bottom-left of the frame — so the ceiling is a polyline traced
off the plate rather than a constant. Getting this wrong paints a large wedge
of wall, which is exactly what a flat ceiling did.

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
    (0.12, 0.90),
    (0.88, 0.90),
    (0.97, 0.96),
    # Behind the sofa and into the left corner: that pocket is walled off from
    # the open floor by the sofa's plinth and its cast shadow, so it needs its
    # own seeds or it is simply never reached.
    (0.34, 0.685),
    (0.45, 0.685),
    (0.58, 0.685),
    (0.655, 0.665),
]

# Highest the floor may reach, as (x, y) fractions of the plate, linearly
# interpolated between. Traced off the plate; tight where no edge exists to stop
# the grow, loose past the corner where the door track does the work.
#
#   x < 0.055   the left wall's dark return — effectively no floor
#   -> 0.32     the left wall's base, a steep diagonal down to the frame edge
#   -> 0.63     the back wall's base, level
#   beyond      loose: the door track is a real edge and stops the grow itself
CEILING = [
    (0.000, 0.985),
    (0.055, 0.985),
    (0.320, 0.655),
    (0.630, 0.663),
    (0.680, 0.600),
    (1.000, 0.600),
]

# How far a neighbouring pixel may differ and still be the same surface. Small
# enough to stop at the sofa plinth, large enough to walk the light gradient.
STEP_TOLERANCE = 4


def main() -> None:
    im = Image.open(PLATE).convert("RGB")
    width, height = im.size
    pixels = np.asarray(im).astype(np.int16)

    xs = np.arange(width) / width
    ceiling = np.interp(xs, [p[0] for p in CEILING], [p[1] for p in CEILING])
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
    # Close the serrated notches the door track leaves along the glazing, then
    # open to drop specks, then feather so the matte doubles as the alpha.
    #
    # Keep the closing kernel small: closing bridges concavities, and a wide one
    # reaches straight across the gaps between the side table's legs and
    # swallows the legs with them.
    mask = mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))

    # Whatever the morphology did, a pixel much darker than the floor around it
    # is furniture, not floor. This is what actually protects the table legs.
    lum = np.asarray(im.convert("L")).astype(np.float32)
    floor_lum = np.median(lum[seen]) if seen.any() else 128.0
    mask = Image.fromarray(
        np.where(lum < floor_lum * 0.62, 0, np.asarray(mask)).astype(np.uint8), "L"
    )

    mask = mask.filter(ImageFilter.GaussianBlur(1.4))
    mask.save(OUT, "WEBP", quality=90, method=6)
    print(f"floor is {seen.mean() * 100:.1f}% of the plate -> {OUT}")


if __name__ == "__main__":
    main()
