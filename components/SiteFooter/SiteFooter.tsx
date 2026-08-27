import Link from "next/link";
import { NAV, SITE } from "@/lib/site";
import styles from "./SiteFooter.module.scss";

const SOCIALS = [
  { label: "Instagram", handle: SITE.instagramHandle, href: SITE.instagramHref },
  { label: "TikTok", handle: SITE.tiktokHandle, href: SITE.tiktokHref },
  { label: "Facebook", handle: SITE.facebookName, href: SITE.facebookHref },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <p className={styles.wordmark}>{SITE.fullName}</p>
          <p className={styles.tagline}>{SITE.tagline}</p>
        </div>

        <div className={styles.column}>
          <h2 className={styles.columnTitle}>Studio</h2>
          <ul className={styles.list}>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.column}>
          <h2 className={styles.columnTitle}>Contact</h2>
          <ul className={styles.list}>
            <li>
              <a href={SITE.phoneHref} className={styles.link}>
                {SITE.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={SITE.emailHref} className={styles.link}>
                {SITE.email}
              </a>
            </li>
            <li className={styles.address}>
              {SITE.addressLine1}
              <br />
              {SITE.addressLine2}
            </li>
          </ul>
        </div>

        <div className={styles.column}>
          <h2 className={styles.columnTitle}>Follow</h2>
          <ul className={styles.list}>
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  className={styles.link}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className={styles.colophon}>
        {SITE.fullName} — mockup. Imagery and contact details are placeholders.
      </p>
    </footer>
  );
}
