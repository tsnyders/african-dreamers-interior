import Image from "next/image";
import styles from "./Plate.module.scss";

type Props = {
  src: string;
  alt: string;
  /** Responsive sizes hint — always pass one, `fill` images default to 100vw. */
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Omit when a parent already constrains the frame's height. */
  ratio?: string;
  /** For cut-outs with their own alpha: no ground, no rule, no label. */
  bare?: boolean;
};

/**
 * A photographic plate held in a fixed-ratio frame.
 *
 * The frame reserves its own space before the image decodes, which is what
 * keeps CLS near zero next to pinned ScrollTriggers — a section that grows
 * after pin distances are measured drags every trigger below it out of sync.
 *
 * The ceramic ground and its label stay visible behind the image, so a plate
 * that has not been supplied yet reads as a labelled placeholder rather than a
 * broken asset. `bare` drops both, for images that carry their own alpha and
 * are meant to sit directly on the stone.
 */
export function Plate({
  src,
  alt,
  sizes,
  priority,
  className,
  ratio,
  bare,
}: Props) {
  return (
    <figure
      className={`${styles.plate} ${bare ? styles.bare : ""} ${className ?? ""}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      {!bare && (
        <span className={styles.label} aria-hidden="true">
          {alt}
        </span>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        // Next's image optimizer flattens the alpha channel — a cut-out comes
        // back as opaque RGB and lands on the page as a rectangle. These plates
        // are already sized and compressed for their slot, so serving the file
        // as authored costs nothing and is the only way to keep the silhouette.
        unoptimized={bare}
        className={styles.image}
      />
    </figure>
  );
}
