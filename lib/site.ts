// Single source of truth for African Dreamers Interior.
// Edit copy HERE, never in JSX.
//
// CONTACT DETAILS NOT SUPPLIED YET ──────────────────────────────────────────
// The contact fields below are empty on purpose. Empty means "not supplied",
// and every component that reads them skips the row, the link or the whole
// block rather than rendering a blank or a placeholder string. Fill them in
// here and the footer, the contact page and the enquiry band come back on
// their own — no markup to change.
// ────────────────────────────────────────────────────────────────────────────

export const SITE = {
  name: "African Dreamers",
  suffix: "Interior",
  fullName: "African Dreamers Interior",
  tagline: "Curated architectural luxury.",
  description:
    "Bespoke interior design studio crafting patios, flooring, upholstery and wall finishes for private estates, developers and commercial spaces.",

  phoneDisplay: "",
  phoneHref: "",
  whatsappHref: "",
  email: "",
  emailHref: "",

  addressLine1: "",
  addressLine2: "",
  mapsHref: "",
  hours: "",

  instagramHandle: "",
  instagramHref: "",
  tiktokHandle: "",
  tiktokHref: "",
  facebookName: "",
  facebookHref: "",
} as const;

export const NAV = [
  { label: "Work", href: "/#patio" },
  { label: "Studio", href: "/about" },
  { label: "Enquire", href: "/contact" },
] as const;

// ── Hero ─────────────────────────────────────────────────────────────────────

export const HERO = {
  curtainLeft: "AFRICAN DREAMERS",
  curtainRight: "INTERIOR",
  title: "Curated architectural luxury",
  subtitle:
    "Crafting bespoke living spaces through raw material authenticity — stone, timber, ceramic and cloth, held to an architect's discipline.",
  scrollCue: "Scroll to enter",
} as const;

// ── Section: Patio design styles (pinned horizontal track) ───────────────────

export type PatioStyle = {
  index: string;
  slug: string;
  name: string;
  blurb: string;
  image: string;
  alt: string;
};

export const PATIO_INTRO = {
  eyebrow: "01 — Outdoor living",
  title: "Patio design styles",
  body: "Every outdoor room begins with how light falls across it at four in the afternoon. We plan shade, stone and seating as one continuous surface rather than furniture placed on a slab.",
} as const;

export const PATIO_STYLES: PatioStyle[] = [
  {
    index: "01",
    slug: "shaded-pergola",
    name: "Shaded pergola",
    blurb:
      "Slatted timber overhead breaks the sun into bands that travel across the floor through the afternoon.",
    image: "/images/patio-pergola.webp",
    alt: "Timber slatted pergola over a pale stone patio with low seating",
  },
  {
    index: "02",
    slug: "stone-dining",
    name: "Natural stone dining",
    blurb:
      "A single quarried table anchors the space; everything around it stays deliberately quiet.",
    image: "/images/patio-stone-dining.webp",
    alt: "Outdoor dining table in honed natural stone beneath a pale wall",
  },
  {
    index: "03",
    slug: "sunken-lounge",
    name: "Sunken lounge",
    blurb:
      "Dropping the seating plane by three risers turns an open terrace into a room with walls of air.",
    image: "/images/patio-sunken-lounge.webp",
    alt: "Sunken outdoor lounge with deep upholstered seating and stone steps",
  },
  {
    index: "04",
    slug: "courtyard-garden",
    name: "Courtyard garden",
    blurb:
      "Planting is structural here — greenery reads as a wall, not as decoration set against one.",
    image: "/images/patio-courtyard.webp",
    alt: "Enclosed courtyard with tall planting against a pale plastered wall",
  },
];

// ── Section: Laminated flooring swapper (WebGL) ──────────────────────────────

export type FloorOption = {
  id: string;
  name: string;
  note: string;
  texture: string;
  swatch: string;
};

export const FLOORING_INTRO = {
  eyebrow: "02 — Surfaces",
  title: "Laminated flooring",
  body: "Flooring is the one finish a room is judged by before anyone looks up. Scroll to move the divider and compare three laminates under identical ambient light.",
} as const;

export const FLOOR_OPTIONS: FloorOption[] = [
  {
    id: "oak",
    name: "Natural oak",
    note: "Light plank, open grain",
    texture: "/images/floor-oak.webp",
    swatch: "#c9b08c",
  },
  {
    id: "walnut",
    name: "Deep walnut",
    note: "Dark plank, tight grain",
    texture: "/images/floor-walnut.webp",
    swatch: "#5a4133",
  },
  {
    id: "microcement",
    name: "Micro-cement",
    note: "Seamless, honed stone",
    texture: "/images/floor-microcement.webp",
    swatch: "#b3aca3",
  },
];

export const FLOORING_ROOM = {
  image: "/images/room-interior.webp",
  alt: "Bright minimal interior room with tall windows and a bare floor",

  // Where the floor actually is in the photograph.
  //
  // The matte is a grown selection of the floor, built by tools/build-floor-mask.py
  // — a straight junction line cannot work, because the sofa and table stand in
  // front of the wall (their bases fall below any line and get painted over)
  // while the floor along the glazing rises above it and gets missed.
  //
  // The quad is four corners of a floor rectangle, as fractions of the plate
  // with (0,0) at its top-left, and gives the shader the room's perspective.
  // The near pair sit outside the frame; the matte clips them.
  //
  // Re-measure BOTH whenever the room plate changes: overlay a percentage grid
  // on the image to read the corners, then re-run the mask tool.
  mask: "/images/room-interior-floor-mask.webp",
  floor: {
    /** Near-left, near-right, far-right, far-left. */
    quad: [
      [-0.1, 1.02],
      [1.25, 1.02],
      [0.62, 0.645],
      [0.045, 0.645],
    ],
    /** Plank tiling across the floor rectangle: (across, into the room). */
    repeat: [5, 8],
  },
} as const;

// ── Section: Scattered cushions (velocity physics) ───────────────────────────

export type Cushion = {
  id: string;
  name: string;
  image: string;
  alt: string;
};

export const CUSHIONS_INTRO = {
  eyebrow: "03 — Soft furnishing",
  title: "Upholstery in motion",
  body: "Cloth is the only part of a room that moves on its own. Cushions, throws and drapery are made to order in linen, boucle and handwoven cotton.",
} as const;

// Cut-outs: each plate carries its own alpha and is rendered on a `bare` Plate
// so it sits directly on the stone. Adding one here is enough — the drift
// arrangement wraps, so any number of cushions is laid out and animated.
// Cut out with tools/cut-out-cushion.py.
export const CUSHIONS: Cushion[] = [
  {
    id: "linen",
    name: "Washed linen",
    image: "/images/cushion-linen.webp",
    alt: "Square cushion in washed ivory linen",
  },
  {
    id: "boucle",
    name: "Ivory boucle",
    image: "/images/cushion-boucle.webp",
    alt: "Textured boucle cushion in warm ivory",
  },
  {
    id: "woven",
    name: "Handwoven cotton",
    image: "/images/cushion-woven.webp",
    alt: "Handwoven cotton cushion with a fine geometric weave",
  },
  {
    id: "ochre",
    name: "Ochre canvas",
    image: "/images/cushion-ochre.webp",
    alt: "Canvas cushion in muted ochre",
  },
];

// ── Section: Wallpaper unrolling (SVG mask) ──────────────────────────────────

export type WallpaperPattern = {
  id: string;
  name: string;
  note: string;
  tile: string;
};

export const WALLPAPER_INTRO = {
  eyebrow: "04 — Wall finishes",
  title: "Pattern, unrolled",
  body: "Wallpaper earns its place when it holds the room's geometry rather than fighting it. Three house patterns, each drawn to align with a standard ceiling height.",
} as const;

export const WALLPAPER_PATTERNS: WallpaperPattern[] = [
  {
    id: "reed",
    name: "Reed",
    note: "Vertical, fine repeat",
    tile: "/images/wallpaper-reed.webp",
  },
  {
    id: "woven-grid",
    name: "Woven grid",
    note: "Geometric, mid repeat",
    tile: "/images/wallpaper-grid.webp",
  },
  {
    id: "protea",
    name: "Protea",
    note: "Botanical, wide repeat",
    tile: "/images/wallpaper-protea.webp",
  },
];

// ── Studio / about ───────────────────────────────────────────────────────────

export const STUDIO = {
  eyebrow: "The studio",
  title: "A room is built twice",
  body: [
    "Once on paper, and once in the material. African Dreamers Interior works the second half as carefully as the first — sourcing stone, timber and cloth against a drawn plan rather than a mood board.",
    "The studio takes on private estates, developer show units and commercial interiors, from a single room through to a full fit-out. Work runs to an architect's drawing set, so every finish has a reason it is where it is.",
  ],
} as const;

export const CAPABILITIES = [
  {
    title: "Interior design",
    body: "Full-room design from measure and layout through to finish schedule and installation.",
  },
  {
    title: "Outdoor living",
    body: "Patios, pergolas and courtyards planned as rooms rather than leftover ground.",
  },
  {
    title: "Surfaces & flooring",
    body: "Laminate, engineered timber and micro-cement supplied and laid to specification.",
  },
  {
    title: "Soft furnishing",
    body: "Made-to-order cushions, throws and drapery in linen, boucle and handwoven cotton.",
  },
] as const;

// Deliberately empty. Nothing here is invented — the site renders a labelled
// empty state until the client supplies real, attributable feedback.
export const TESTIMONIALS: { quote: string; attribution: string }[] = [];

// ── Contact ──────────────────────────────────────────────────────────────────

export const CONTACT = {
  eyebrow: "Enquire",
  title: "Begin a project",
  body: "Tell us the room, the building and roughly when you would like to be living in it. We reply to every enquiry.",
  cta: "Send an enquiry",
  /** Shown on /contact only while SITE has no contact details to list. */
  pending: "Direct contact details are added before launch.",
} as const;
