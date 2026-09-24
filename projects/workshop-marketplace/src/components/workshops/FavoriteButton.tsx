"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

export function FavoriteButton({ workshopId }: { workshopId: string }) {
  const router = useRouter();
  const [isFav, setIsFav] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/user/favorite?workshopId=${workshopId}`)
      .then(r => r.json())
      .then(d => {
        setIsFav(d.favorited);
        setAuthenticated(d.authenticated);
      })
      .catch(() => {});
  }, [workshopId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!authenticated) {
      router.push("/registro");
      return;
    }

    setLoading(true);
    const action = isFav ? "remove" : "add";
    await fetch("/api/user/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workshopId, action }),
    });
    setIsFav(!isFav);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
      className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors disabled:opacity-60"
    >
      <Heart
        size={15}
        className={isFav ? "fill-[#e80c87] text-[#e80c87]" : "text-[#888888]"}
      />
    </button>
  );
}
