import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter/SiteFooter";
import { SITE } from "@/lib/site";
import "./globals.scss";

// Variable font: no `weight` array. next/font rejects weight alongside a
// variable axis range, and the range is what the 300/400/500 scale needs.
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.fullName} — ${SITE.tagline}`,
    template: `%s — ${SITE.fullName}`,
  },
  description: SITE.description,
};

// The palette is ivory stone in every state; there is no dark variant to
// negotiate, so opt out of the browser forcing one.
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#fdfbf7",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
