import Link from "next/link";
import { NAV, SITE } from "@/lib/site";
import styles from "./SiteFooter.module.scss";

// An empty value in SITE means "not supplied yet". Filter rather than render a
// blank row, and drop a whole column once nothing in it survives — a heading
// over an empty list reads as broken, not as pending.
const SOCIALS = [
  { label: "Instagram", href: SITE.instagramHref },
  { label: "TikTok", href: SITE.tiktokHref },
  { label: "Facebook", href: SITE.facebookHref },
].filter((social) => social.href);

const CONTACTS = [
  { label: SITE.phoneDisplay, href: SITE.phoneHref },
  { label: SITE.email, href: SITE.emailHref },
].filter((item) => item.label && item.href);

const ADDRESS = [SITE.addressLine1, SITE.addressLine2].filter(Boolean);

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

        {(CONTACTS.length > 0 || ADDRESS.length > 0) && (
          <div className={styles.column}>
            <h2 className={styles.columnTitle}>Contact</h2>
            <ul className={styles.list}>
              {CONTACTS.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className={styles.link}>
                    {item.label}
                  </a>
                </li>
              ))}
              {ADDRESS.length > 0 && (
                <li className={styles.address}>
                  {ADDRESS.map((line) => (
                    <span key={line} className={styles.addressLine}>
                      {line}
                    </span>
                  ))}
                </li>
              )}
            </ul>
          </div>
        )}

        {SOCIALS.length > 0 && (
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
        )}
      </div>

      <p className={styles.colophon}>
        {SITE.fullName} — mockup. Imagery and contact details are placeholders.
      </p>
    </footer>
  );
}
