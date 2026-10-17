import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { CookieBanner } from "@/components/CookieBanner";
import { Logo } from "@/components/icons";
import { MainNav, TabBar } from "@/components/Nav";
import { getSession } from "@/lib/account";
import { SEO_PAGES } from "@/lib/seo";
import { SITE_URL } from "@/lib/supabase/config";
// Font ospitati dal sito stesso: nessuna richiesta a Google (meglio per privacy e GDPR)
import "@fontsource/bricolage-grotesque/latin-600.css";
import "@fontsource/bricolage-grotesque/latin-800.css";
import "@fontsource/schibsted-grotesk/latin-400.css";
import "@fontsource/schibsted-grotesk/latin-500.css";
import "@fontsource/schibsted-grotesk/latin-600.css";
import "@fontsource/schibsted-grotesk/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Primopasso — stage, tirocini e primo lavoro in Italia", template: "%s | Primopasso" },
  description: "Solo annunci per chi inizia: stage curricolari, tirocini extracurricolari, apprendistato, internship e lavori junior con 0-2 anni di esperienza. Verificati uno per uno.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  const counts = { fav: s.favCount, alert: s.alertCount };
  return (
    <html lang="it">
      <body>
        <header className="top">
          <div className="wrap">
            <Link href="/" className="logo" aria-label="Primopasso, home" style={{ color: "inherit", textDecoration: "none" }}>
              <Logo /> primopasso <span className="tag">beta</span>
            </Link>
            <MainNav counts={counts} admin={s.isAdmin} />
            {s.user ? (
              <Link href="/account" className="authbtn"><span className="av">{s.user.email[0]?.toUpperCase()}</span>Profilo</Link>
            ) : (
              <Link href="/accedi" className="authbtn">Accedi</Link>
            )}
          </div>
        </header>

        <main>{children}</main>

        <footer>
          <div className="wrap">
            <div>
              <h2>primopasso</h2>
              <p>Il job board per stage, tirocini, apprendistato e primi lavori in Italia. Ti mandiamo sempre all&apos;annuncio originale dell&apos;azienda per candidarti.</p>
            </div>
            <div>
              <h2>Ricerche frequenti</h2>
              <ul>
                {SEO_PAGES.slice(0, 6).map((p) => (
                  <li key={p.slug}><Link className="linkbtn" href={`/lavoro/${p.slug}`}>{p.title}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h2>Informazioni</h2>
              <ul>
                <li><Link className="linkbtn" href="/privacy">Privacy policy</Link></li>
                <li><Link className="linkbtn" href="/cookie">Cookie policy</Link></li>
                <li><Link className="linkbtn" href="/termini">Termini d&apos;uso</Link></li>
                <li><Link className="linkbtn" href="/aziende">Aziende: pubblica un annuncio</Link></li>
              </ul>
            </div>
          </div>
        </footer>

        <TabBar counts={counts} admin={s.isAdmin} />
        <CookieBanner />
        {/* Statistiche di visita senza cookie (da attivare nella sezione Analytics di Vercel) */}
        <Analytics />
      </body>
    </html>
  );
}
