import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Bitcoin, Wallet, Copy, Check, Gamepad2, Star, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMediaUrl } from "@/lib/media";
import { getEmbed } from "@/lib/embed";
import { LanguageSwitcher, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CLOUD FM | WLP International — Rap, UK Drill & mehr" },
      {
        name: "description",
        content:
          "CLOUD FM by WLP International: Rap, UK Drill und jede Art von Musik. Playlist, Artists und direkter Support-Bereich.",
      },
      { property: "og:title", content: "CLOUD FM | WLP International" },
      {
        property: "og:description",
        content: "Rap, UK Drill und mehr — Playlist, Artists und Support von WLP International.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const GENRES = ["RAP", "UK DRILL", "TRAP", "HIP-HOP", "AFROBEAT", "DRILL", "R&B", "WORLDWIDE"];

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
    <header className="relative z-10 px-4 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <LanguageSwitcher />
        <Link
          to="/Games/palmon"
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-primary transition-colors hover:text-primary/80"
        >
          <Gamepad2 className="h-4 w-4" /> Palmon Hub
        </Link>
      </div>

      <h1 className="flex flex-nowrap items-baseline justify-center whitespace-nowrap text-2xl tracking-[0.08em] sm:text-4xl md:text-5xl">
        <span className="text-chrome">CLOUD</span>
        <span onClick={onFmClick} className="text-chrome ml-2 cursor-pointer select-none" aria-label="FM">
          FM
        </span>
        <span className="mx-2 text-primary sm:mx-3">||</span>
        <span className="text-foreground/85 tracking-[0.14em]">WLP INTERNATIONAL</span>
      </h1>
      <div className="hairline mx-auto mt-5 max-w-2xl" />
    </header>
  );
}

function GenreTicker() {
  const items = [...GENRES, ...GENRES];
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-secondary/40 py-3">
      <div className="marquee-track flex w-max items-center gap-10">
        {items.map((g, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap">
            <span className="font-display text-xl tracking-[0.2em] text-muted-foreground">{g}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
        ))}
      </div>
    </div>
  );
}

function TrackRow({
  track,
  index,
  active,
  onPlay,
}: {
  track: { id: string; title: string; artist: string; cover_url: string | null };
  index: number;
  active: boolean;
  onPlay: () => void;
}) {
  const cover = useSigned(track.cover_url);
  return (
    <button
      onClick={onPlay}
      className="group flex w-full items-center gap-4 border-b border-white/5 px-4 py-3.5 text-left transition-colors hover:bg-primary/10"
    >
      <span className={`w-6 shrink-0 font-display text-lg ${active ? "text-primary" : "text-muted-foreground/60"}`}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-secondary">
        {cover && <img src={cover} alt={track.title} className="h-full w-full object-cover" />}
        <span className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
          {active ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary" />}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate font-display text-lg tracking-wide ${active ? "text-primary" : "text-foreground"}`}>
          {track.title}
        </p>
        <p className="truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {track.artist}
        </p>
      </div>
    </button>
  );
}

function ArtistCard({ artist }: { artist: { name: string; bio: string | null; photo_url: string | null } }) {
  const { t } = useI18n();
  const photo = useSigned(artist.photo_url);
  return (
    <article className="group relative aspect-[4/5] overflow-hidden bg-secondary">
      {photo && (
        <img
          src={photo}
          alt={artist.name}
          loading="lazy"
          className="h-full w-full object-cover opacity-70 grayscale transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 w-full p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">{t("artist")}</p>
        <h3 className="font-display text-3xl leading-none text-foreground">{artist.name}</h3>
        {artist.bio && (
          <p className="mt-2 line-clamp-2 text-xs font-medium text-muted-foreground">{artist.bio}</p>
        )}
      </div>
    </article>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/15 py-4">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/50">{label}</p>
        <p className="mt-1 truncate font-mono text-sm font-semibold text-black">{value}</p>
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="shrink-0 p-2 text-black/60 transition-colors hover:text-primary"
        aria-label={`${label} ${t("copy")}`}
      >
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

function Home() {
  const { t } = useI18n();
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
  const embed = getEmbed(current?.audio_url);
  const currentUrl = useSigned(embed ? null : current?.audio_url);
  const currentIndex = tracks.findIndex((t) => t.id === currentId);

  useEffect(() => {
    if (!audioRef.current) return;
    if (embed) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      return;
    }
    if (!currentUrl) return;
    audioRef.current.src = currentUrl;
    if (playing) void audioRef.current.play().catch(() => setPlaying(false));
  }, [currentUrl, embed?.src]);

  useEffect(() => {
    if (!audioRef.current || embed) return;
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

  function step(dir: 1 | -1) {
    if (tracks.length === 0) return;
    const next = currentIndex < 0 ? 0 : (currentIndex + dir + tracks.length) % tracks.length;
    const t = tracks[next];
    if (!t) return;
    setCurrentId(t.id);
    setPlaying(true);
  }

  const currentCover = useSigned(current?.cover_url);

  return (
    <div className="min-h-screen">
      <div className="veil">
        <Header />
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-16 text-center sm:pt-24">
          <p className="flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.4em] text-primary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            {t("onAir")}
          </p>
          <h2 className="text-chrome mx-auto mt-6 font-display text-6xl leading-[0.95] tracking-tight sm:text-8xl">
            {t("heroLine1")}
            <br />
            <span className="text-primary">{t("heroLine2")}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground sm:text-base">
            {t("heroSub")}
          </p>
        </section>
        <GenreTicker />
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-40 sm:px-6">
        {/* Featured Game / App Section (Palmon Survival) */}
        <section id="featured-game" className="pt-14">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-4xl tracking-wide text-foreground sm:text-5xl">App der Woche</h2>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Featured</span>
          </div>
          <div className="surface-lux rounded-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-left flex-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                <Gamepad2 className="h-4 w-4" /> Game • Android, Apple
              </div>
              <h3 className="font-display text-3xl tracking-wide text-foreground">PALMON SURVIVAL</h3>
              <p className="text-sm text-muted-foreground">
                Offizielles Community- & Infos-Hub mit What's New, Serverstatus, Gilden und Quests.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-1 text-gold font-mono text-sm">
                  <Star className="h-4 w-4 fill-primary text-primary" /> 9.5
                </div>
              </div>
            </div>
            <div>
              <Link
                to="/Games/palmon"
                className="inline-flex items-center gap-2 bg-primary px-6 py-3 font-display text-sm tracking-wider text-background transition-transform hover:scale-105 rounded-sm"
              >
                Öffnen <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section id="playlist" className="pt-14">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-4xl tracking-wide text-foreground sm:text-5xl">{t("playlist")}</h2>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              {tracks.length} {t("tracks")}
            </span>
          </div>
          <div className="surface-lux">
            {tracks.length === 0 ? (
              <p className="p-10 text-center text-sm uppercase tracking-widest text-muted-foreground">
                {t("noTracks")}
              </p>
            ) : (
              tracks.map((t, i) => (
                <TrackRow
                  key={t.id}
                  track={t}
                  index={i}
                  active={t.id === currentId && playing}
                  onPlay={() => toggle(t.id)}
                />
              ))
            )}
          </div>
        </section>

        <section id="artists" className="pt-24">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-4xl tracking-wide text-foreground sm:text-5xl">{t("artists")}</h2>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              {t("roster")}
            </span>
          </div>
          {artists.length === 0 ? (
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              {t("noArtists")}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
              {artists.map((a) => (
                <ArtistCard key={a.id} artist={a} />
              ))}
            </div>
          )}
        </section>

        <section id="support" className="pt-24">
          <div className="relative overflow-hidden bg-foreground p-8 text-center text-background sm:p-14">
            <div className="pointer-events-none absolute inset-0 flex items-center overflow-hidden opacity-[0.04]">
              <h4 className="whitespace-nowrap font-display text-[16rem] leading-none">
                CLOUD FM CLOUD FM
              </h4>
            </div>
            <div className="relative z-10">
              <h3 className="font-display text-5xl leading-none sm:text-7xl">
                {t("supportA")} <span className="text-primary">{t("supportB")}</span>
              </h3>
              {donation?.note && (
                <p className="mx-auto mt-5 max-w-xl text-sm font-medium uppercase tracking-tight text-black/60">
                  {donation.note}
                </p>
              )}
              <div className="mx-auto mt-8 max-w-2xl text-left">
                {donation?.recipient && <CopyRow label={t("recipient")} value={donation.recipient} />}
                {donation?.btc_address && (
                  <div className="flex items-center gap-3">
                    <Bitcoin className="h-4 w-4 shrink-0 text-primary" />
                    <div className="flex-1">
                      <CopyRow label={t("btc")} value={donation.btc_address} />
                    </div>
                  </div>
                )}
                {donation?.eth_address && (
                  <div className="flex items-center gap-3">
                    <Wallet className="h-4 w-4 shrink-0 text-primary" />
                    <div className="flex-1">
                      <CopyRow label={t("eth")} value={donation.eth_address} />
                    </div>
                  </div>
                )}
                {donation?.paypal && <CopyRow label="PayPal" value={donation.paypal} />}
                {donation?.iban && <CopyRow label={t("iban")} value={donation.iban} />}
              </div>
            </div>
          </div>
        </section>
      </main>

      {current && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-secondary">
              {currentCover && (
                <img src={currentCover} alt={current.title} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full bg-primary ${playing ? "animate-pulse" : ""}`} />
                <p className="truncate font-display text-lg tracking-wide text-foreground">{current.title}</p>
              </div>
              <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {current.artist}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => step(-1)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label={t("prev")}
              >
                <SkipBack className="h-4 w-4" />
              </button>
              {!embed && (
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105"
                  aria-label={t("play")}
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
                </button>
              )}
              <button
                onClick={() => step(1)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label={t("next")}
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
          </div>
          {embed && (
            <div className="mx-auto max-w-6xl px-3 pb-3">
              <iframe
                key={embed.src}
                src={embed.src}
                title={current.title}
                height={embed.height}
                className="w-full border-0"
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              />
            </div>
          )}
        </div>
      )}
      <audio ref={audioRef} onEnded={() => step(1)} className="hidden" />
    </div>
  );
}
