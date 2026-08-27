import type { Metadata } from "next";
import { KineticHeading } from "@/components/KineticHeading/KineticHeading";
import { CONTACT, SITE } from "@/lib/site";
import styles from "./contact.module.scss";

export const metadata: Metadata = {
  title: "Enquire",
  description: CONTACT.body,
};

// An empty value in SITE means "not supplied yet". Anything without both a
// value and a destination is dropped rather than rendered blank.
const DETAILS = [
  { label: "Telephone", value: SITE.phoneDisplay, href: SITE.phoneHref },
  { label: "WhatsApp", value: SITE.phoneDisplay, href: SITE.whatsappHref },
  { label: "Email", value: SITE.email, href: SITE.emailHref },
  { label: "Instagram", value: SITE.instagramHandle, href: SITE.instagramHref },
  { label: "TikTok", value: SITE.tiktokHandle, href: SITE.tiktokHref },
].filter((detail) => detail.value && detail.href);

const ADDRESS = [SITE.addressLine1, SITE.addressLine2].filter(Boolean);
const HAS_STUDIO = ADDRESS.length > 0 || Boolean(SITE.hours) || Boolean(SITE.mapsHref);

export default function Contact() {
  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{CONTACT.eyebrow}</p>
        <KineticHeading as="h1" trigger="immediate" className={styles.title}>
          {CONTACT.title}
        </KineticHeading>
        <p className={styles.body}>{CONTACT.body}</p>
      </header>

      {DETAILS.length > 0 || HAS_STUDIO ? (
        <div className={styles.columns}>
          {DETAILS.length > 0 && (
            <section className={styles.block}>
              <h2 className={styles.blockLabel}>Direct</h2>
              <dl className={styles.details}>
                {DETAILS.map((detail) => (
                  <div key={detail.label} className={styles.detail}>
                    <dt className={styles.detailLabel}>{detail.label}</dt>
                    <dd className={styles.detailValue}>
                      <a href={detail.href} className={styles.link}>
                        {detail.value}
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {HAS_STUDIO && (
            <section className={styles.block}>
              <h2 className={styles.blockLabel}>Studio</h2>
              {ADDRESS.length > 0 && (
                <address className={styles.address}>
                  {ADDRESS.map((line) => (
                    <span key={line} className={styles.addressLine}>
                      {line}
                    </span>
                  ))}
                </address>
              )}
              {SITE.hours && <p className={styles.hours}>{SITE.hours}</p>}
              {SITE.mapsHref && (
                <a
                  href={SITE.mapsHref}
                  className={styles.link}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  Open in maps
                </a>
              )}
            </section>
          )}
        </div>
      ) : (
        // Nothing to list yet. Say so plainly rather than leaving a page of
        // empty headings, or inventing details that would have to be unpicked.
        <p className={styles.pending}>{CONTACT.pending}</p>
      )}

      {/* No form: a mockup that appears to accept enquiries but posts nowhere is
          worse than one that is plainly a set of contact routes. Wire a Server
          Action here once a mail provider is chosen. */}
      <p className={styles.note}>
        This site is a mockup. Enquiries will run through the studio&rsquo;s own
        channels once they are connected.
      </p>
    </article>
  );
}
