"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFavorite } from "@/app/actions";
import { HeartIcon } from "./icons";

export function FavButton({ jobId, initial, variant = "icon" }: { jobId: string; initial: boolean; variant?: "icon" | "button" }) {
  const [fav, setFav] = useState(initial);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const path = usePathname();

  const click = () =>
    start(async () => {
      const res = await toggleFavorite(jobId);
      if (!res.ok && res.needLogin) { router.push(`/accedi?next=${encodeURIComponent(path)}`); return; }
      if (!res.ok) { setMsg(res.message); return; }
      setFav(Boolean(res.fav));
    });

  if (variant === "button")
    return (
      <>
        <button type="button" className="btn btn-ghost" aria-pressed={fav} onClick={click} disabled={pending}>{fav ? "Salvato" : "Salva"}</button>
        {msg && <p className="fine" role="status">{msg}</p>}
      </>
    );
  return (
    <button type="button" className="fav" aria-pressed={fav} aria-label={fav ? "Togli dai preferiti" : "Salva nei preferiti"} onClick={click} disabled={pending} title={msg || undefined}>
      <HeartIcon />
    </button>
  );
}
