import Link from "next/link";
import { KineticHeading } from "@/components/KineticHeading/KineticHeading";
import { CONTACT, SITE } from "@/lib/site";
import styles from "./ContactBand.module.scss";

export function ContactBand() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>{CONTACT.eyebrow}</p>
        <KineticHeading as="h2" className={styles.title}>
          {CONTACT.title}
        </KineticHeading>
        <p className={styles.body}>{CONTACT.body}</p>

        <div className={styles.actions}>
          <Link href="/contact" className={styles.primary}>
            {CONTACT.cta}
          </Link>
          {SITE.phoneDisplay && SITE.phoneHref && (
            <a href={SITE.phoneHref} className={styles.secondary}>
              {SITE.phoneDisplay}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
