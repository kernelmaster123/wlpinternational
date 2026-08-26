import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Bitcoin, Wallet, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMediaUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CLOUD FM | WLP International — Musik, Artists & Support" },
      {
        name: "description",
        content:
          "CLOUD FM by WLP International: kuratierte Playlist, Artists und ein direkter Support-Bereich mit Krypto- und Bank-Daten.",
      },
      { property: "og:title", content: "CLOUD FM | WLP International" },
      {
        property: "og:description",
        content: "Kuratierte Playlist, Artists und Support-Bereich von WLP International.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function useSigned(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getMediaUrl(path).then((u) => active && setUrl(u));
    return () => {
      active = false;
    };
  }, [path]);
  return url;
}

function Header() {
  const navigate = useNavigate();
  const clicks = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onFmClick() {
    clicks.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => (clicks.current = 0), 1500);
    if (clicks.current >= 4) {
      clicks.current = 0;
      navigate({ to: "/admin" });
    }
  }

  return (
    <header className="relative z-10 px-6 pt-10">
      <h1 className="text-center text-3xl tracking-[0.18em] sm:text-5xl">
        <span className="text-gold">CLOUD </span>
        <span
          onClick={onFmClick}
          className="text-gold cursor-pointer select-none"
          aria-label="FM"
        >
          FM
        </span>
        <span className="mx-3 text-muted-foreground">||</span>
        <span className="text-foreground/90 text-xl sm:text-3xl tracking-[0.3em]">
          WLP INTERNATIONAL
        </span>
      </h1>
      <div className="hairline mx-auto mt-6 max-w-2xl" />
    </header>
  );
}

function TrackRow({
  track,
  active,
  onPlay,
}: {
  track: { id: string; title: string; artist: string; cover_url: string | null };
  active: boolean;
  onPlay: () => void;
}) {
  const cover = useSigned(track.cover_url);
  return (
    <button
      onClick={onPlay}
      className="group flex w-full items-center gap-4 border-b border-border/60 px-4 py-4 text-left transition-colors hover:bg-accent/50"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-secondary">
        {cover && <img src={cover} alt={track.title} className="h-full w-full object-cover" />}
        <span className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 transition-opacity group-hover:opacity-100">
          {active ? <Pause className="h-5 w-5 text-primary" /> : <Play className="h-5 w-5 text-primary" />}
        </span>
      </div>
      <div className="min-w-0">
        <p className={`truncate text-sm tracking-wide ${active ? "text-primary" : "text-foreground"}`}>
          {track.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
      </div>
    </button>
  );
}

function ArtistCard({ artist }: { artist: { name: string; bio: string | null; photo_url: string | null } }) {
  const photo = useSigned(artist.photo_url);
  return (
    <article className="surface-lux overflow-hidden rounded-sm">
      <div className="aspect-[4/5] w-full bg-secondary">
        {photo && <img src={photo} alt={artist.name} loading="lazy" className="h-full w-full object-cover" />}
      </div>
      <div className="p-5">
        <h3 className="text-xl">{artist.name}</h3>
        {artist.bio && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{artist.bio}</p>}
      </div>
    </article>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-4">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
        <p className="mt-1 truncate font-mono text-sm text-foreground">{value}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        aria-label={`${label} kopieren`}
      >
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function Home() {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: tracks = [] } = useQuery({
    queryKey: ["tracks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: artists = [] } = useQuery({
    queryKey: ["artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: donation } = useQuery({
    queryKey: ["donation"],
    queryFn: async () => {
      const { data, error } = await supabase.from("donation_info").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const current = tracks.find((t) => t.id === currentId) ?? null;
  const currentUrl = useSigned(current?.audio_url);

  useEffect(() => {
    if (!audioRef.current || !currentUrl) return;
    audioRef.current.src = currentUrl;
    if (playing) void audioRef.current.play().catch(() => setPlaying(false));
  }, [currentUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (playing) void audioRef.current.play().catch(() => setPlaying(false));
    else audioRef.current.pause();
  }, [playing]);

  function toggle(id: string) {
    if (id === currentId) setPlaying((p) => !p);
    else {
      setCurrentId(id);
      setPlaying(true);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="veil">
        <Header />
        <section className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
          <p className="text-xs uppercase tracking-[0.45em] text-muted-foreground">Sound Collection</p>
          <h2 className="mt-6 text-4xl leading-tight sm:text-6xl">
            Musik, kuratiert mit <span className="text-gold">Haltung</span>.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Eine schlichte Bühne für Klang und Künstler. Handverlesene Tracks, Gesichter dahinter
            und die Möglichkeit, direkt zu unterstützen.
          </p>
        </section>
      </div>

      <main className="mx-auto max-w-5xl px-6 pb-40">
        <section id="playlist" className="pt-4">
          <h2 className="text-2xl sm:text-3xl">Playlist</h2>
          <div className="hairline mt-4" />
          <div className="surface-lux mt-8 rounded-sm">
            {tracks.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Noch keine Tracks in der Playlist.
              </p>
            ) : (
              tracks.map((t) => (
                <TrackRow
                  key={t.id}
                  track={t}
                  active={t.id === currentId && playing}
                  onPlay={() => toggle(t.id)}
                />
              ))
            )}
          </div>
        </section>

        <section id="artists" className="pt-24">
          <h2 className="text-2xl sm:text-3xl">Artists</h2>
          <div className="hairline mt-4" />
          {artists.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">Noch keine Artists hinterlegt.</p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {artists.map((a) => (
                <ArtistCard key={a.id} artist={a} />
              ))}
            </div>
          )}
        </section>

        <section id="support" className="pt-24">
          <h2 className="text-2xl sm:text-3xl">Support</h2>
          <div className="hairline mt-4" />
          <div className="surface-lux mt-8 rounded-sm p-6 sm:p-10">
            {donation?.note && (
              <p className="text-sm leading-relaxed text-muted-foreground">{donation.note}</p>
            )}
            <div className="mt-6">
              {donation?.recipient && <CopyRow label="Empfänger" value={donation.recipient} />}
              {donation?.btc_address && (
                <div className="flex items-center gap-3">
                  <Bitcoin className="h-4 w-4 shrink-0 text-primary" />
                  <div className="flex-1">
                    <CopyRow label="Bitcoin Wallet" value={donation.btc_address} />
                  </div>
                </div>
              )}
              {donation?.eth_address && (
                <div className="flex items-center gap-3">
                  <Wallet className="h-4 w-4 shrink-0 text-primary" />
                  <div className="flex-1">
                    <CopyRow label="Ethereum Wallet" value={donation.eth_address} />
                  </div>
                </div>
              )}
              {donation?.paypal && <CopyRow label="PayPal" value={donation.paypal} />}
              {donation?.iban && <CopyRow label="IBAN" value={donation.iban} />}
            </div>
          </div>
        </section>
      </main>

      {current && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
            <Button size="icon" onClick={() => setPlaying((p) => !p)} aria-label="Wiedergabe">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm">{current.title}</p>
              <p className="truncate text-xs text-muted-foreground">{current.artist}</p>
            </div>
          </div>
        </div>
      )}
      <audio ref={audioRef} onEnded={() => setPlaying(false)} className="hidden" />
    </div>
  );
}
