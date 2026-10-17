import { ExtIcon } from "./icons";
import type { Sponsor } from "@/lib/types";

/** Spazio sponsor venduto direttamente: nessun cookie, nessun tracciamento dei visitatori. */
export function SponsorCard({ sponsor, compact = false }: { sponsor: Sponsor; compact?: boolean }) {
  const Tag = compact ? "div" : "li";
  return (
    <Tag className={`sponsor${compact ? " compact" : ""}`}>
      <a href={`/vai/sponsor/${sponsor.slot}`} target="_blank" rel="sponsored noopener">
        <span className="sponsor-label">Sponsorizzato</span>
        <strong>{sponsor.name}</strong>
        {sponsor.text && <span className="sponsor-text">{sponsor.text}</span>}
        <span className="sponsor-cta">Scopri di più <ExtIcon size={14} /></span>
      </a>
    </Tag>
  );
}

/** Etichetta per gli annunci in evidenza. */
export function FeaturedTag() {
  return <span className="featured-tag">In evidenza</span>;
}
