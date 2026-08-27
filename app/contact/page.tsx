import type { Metadata } from "next";
import { KineticHeading } from "@/components/KineticHeading/KineticHeading";
import { CONTACT, SITE } from "@/lib/site";
import styles from "./contact.module.scss";

export const metadata: Metadata = {
  title: "Enquire",
  description: CONTACT.body,
};

const DETAILS = [
  { label: "Telephone", value: SITE.phoneDisplay, href: SITE.phoneHref },
  { label: "WhatsApp", value: SITE.phoneDisplay, href: SITE.whatsappHref },
  { label: "Email", value: SITE.email, href: SITE.emailHref },
  { label: "Instagram", value: SITE.instagramHandle, href: SITE.instagramHref },
  { label: "TikTok", value: SITE.tiktokHandle, href: SITE.tiktokHref },
];

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

      <div className={styles.columns}>
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

        <section className={styles.block}>
          <h2 className={styles.blockLabel}>Studio</h2>
          <address className={styles.address}>
            {SITE.addressLine1}
            <br />
            {SITE.addressLine2}
          </address>
          <p className={styles.hours}>{SITE.hours}</p>
          <a
            href={SITE.mapsHref}
            className={styles.link}
            rel="noreferrer noopener"
            target="_blank"
          >
            Open in maps
          </a>
        </section>
      </div>

      {/* No form: a mockup that appears to accept enquiries but posts nowhere is
          worse than one that is plainly a set of contact routes. Wire a Server
          Action here once a mail provider is chosen. */}
      <p className={styles.note}>
        Enquiries are handled directly on the numbers above while this site is a
        mockup.
      </p>
    </article>
  );
}
