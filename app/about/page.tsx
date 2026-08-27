import type { Metadata } from "next";
import { KineticHeading } from "@/components/KineticHeading/KineticHeading";
import { ContactBand } from "@/components/sections/ContactBand/ContactBand";
import { CAPABILITIES, STUDIO, TESTIMONIALS } from "@/lib/site";
import styles from "./about.module.scss";

export const metadata: Metadata = {
  title: "Studio",
  description: STUDIO.body[0],
};

export default function About() {
  return (
    <>
      <article className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{STUDIO.eyebrow}</p>
          <KineticHeading as="h1" trigger="immediate" className={styles.title}>
            {STUDIO.title}
          </KineticHeading>
        </header>

        <div className={styles.prose}>
          {STUDIO.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className={styles.paragraph}>
              {paragraph}
            </p>
          ))}
        </div>

        <section className={styles.capabilities}>
          <h2 className={styles.sectionLabel}>Capabilities</h2>
          <ul className={styles.grid}>
            {CAPABILITIES.map((capability) => (
              <li key={capability.title} className={styles.capability}>
                <h3 className={styles.capabilityTitle}>{capability.title}</h3>
                <p className={styles.capabilityBody}>{capability.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.capabilities}>
          <h2 className={styles.sectionLabel}>Client feedback</h2>
          {TESTIMONIALS.length > 0 ? (
            <ul className={styles.grid}>
              {TESTIMONIALS.map((item) => (
                <li key={item.attribution} className={styles.capability}>
                  <p className={styles.capabilityBody}>{item.quote}</p>
                  <p className={styles.attribution}>{item.attribution}</p>
                </li>
              ))}
            </ul>
          ) : (
            // Never invented. The empty state is the honest answer until the
            // studio supplies real, attributable feedback.
            <p className={styles.empty}>
              No client feedback published yet.
            </p>
          )}
        </section>
      </article>

      <ContactBand />
    </>
  );
}
