import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, Share2, Eye, Star, ExternalLink, Bot, Gamepad2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMediaUrl } from "@/lib/media";
import { LanguageSwitcher } from "@/lib/i18n";
import { useEffect } from "react";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "Games & Apps — CLOUD FM | WLP International" },
      {
        name: "description",
        content:
          "Games und Apps von CLOUD FM: App der Woche, Top 10 Charts.",
      },
      { property: "og:title", content: "Games & Apps — CLOUD FM" },
      {
        property: "og:description",
        content: "App der Woche, Top 10 Games & Apps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamesPage,
});

type Post = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  platform: string | null;
  kind: string;
  rating: number;
  is_featured: boolean;
  top_rank: number | null;
  likes: number;
  shares: number;
  views: number;
};

type Review = {
  id: string;
  post_id: string;
  author: string;
  body: string;
  rating: number | null;
  likes: number;
};

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

function Metrics({ post, reviews }: { post: Post; reviews: Review[] }) {
  const qc = useQueryClient();
  const [liked, setLiked] = useState(false);

  async function bump(metric: "likes" | "shares") {
    await supabase.rpc("bump_post_metric", { _post_id: post.id, _metric: metric });
    qc.invalidateQueries({ queryKey: ["game_posts"] });
  }

  async function share() {
    const url = `${window.location.origin}/games#${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: post.title, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* abgebrochen */
    }
    void bump("shares");
  }

  return (
    <div className="flex items-center gap-5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
      <button
        onClick={() => {
          if (liked) return;
          setLiked(true);
          void bump("likes");
        }}
        className={`flex items-center gap-1.5 transition-colors hover:text-primary ${liked ? "text-primary" : ""}`}
      >
        <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {post.likes}
      </button>
      <button onClick={share} className="flex items-center gap-1.5 transition-colors hover:text-primary">
        <Share2 className="h-4 w-4" /> {post.shares}
      </button>
      <span className="flex items-center gap-1.5">
        <Eye className="h-4 w-4" /> {post.views}
      </span>
      <span className="flex items-center gap-1.5">
        <Bot className="h-4 w-4" /> {reviews.length}
      </span>
    </div>
  );
}

function Cover({ path, alt, className }: { path: string | null; alt: string; className?: string }) {
  const url = useSigned(path);
  return (
    <div className={`overflow-hidden bg-secondary ${className ?? ""}`}>
      {url && <img src={url} alt={alt} loading="lazy" className="h-full w-full object-cover" />}
    </div>
  );
}

function ReviewList({ reviews }: { reviews: Review[] }) {
  const qc = useQueryClient();
  if (reviews.length === 0) return null;
  return (
    <div className="mt-4 space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="border-l-2 border-primary/60 bg-secondary/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-base tracking-[0.15em] text-primary">{r.author}</p>
            {r.rating !== null && (
              <span className="flex items-center gap-1 text-xs font-bold text-foreground">
                <Star className="h-3.5 w-3.5 fill-current text-primary" /> {r.rating}/10
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
          <button
            onClick={async () => {
              await supabase.rpc("bump_review_likes", { _review_id: r.id });
              qc.invalidateQueries({ queryKey: ["game_reviews"] });
            }}
            className="mt-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
          >
            <Heart className="h-3.5 w-3.5" /> {r.likes}
          </button>
        </div>
      ))}
    </div>
  );
}

function GamesPage() {
  const { data: posts = [] } = useQuery({
    queryKey: ["game_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_posts")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["game_reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
  });

  const reviewsFor = (id: string) => reviews.filter((r) => r.post_id === id);
  const featured = posts.find((p) => p.is_featured) ?? null;
  const top = posts
    .filter((p) => p.top_rank !== null)
    .sort((a, b) => (a.top_rank ?? 99) - (b.top_rank ?? 99))
    .slice(0, 10);
  const rest = posts.filter((p) => p.id !== featured?.id);

  return (
    <div className="min-h-screen">
      <div className="veil">
        <header className="relative z-10 px-4 pt-4">
          <div className="mb-4 flex items-center justify-between">
            <LanguageSwitcher />
            <Link
              to="/"
              className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-primary"
            >
              Radio
            </Link>
          </div>
          <h1 className="flex flex-nowrap items-baseline justify-center whitespace-nowrap text-2xl tracking-[0.08em] sm:text-4xl md:text-5xl">
            <span className="text-chrome">CLOUD</span>
            <span className="ml-2 text-chrome">FM</span>
            <span className="mx-2 text-primary sm:mx-3">||</span>
            <span className="tracking-[0.14em] text-foreground/85">GAMES &amp; APPS</span>
          </h1>
          <div className="hairline mx-auto mt-5 max-w-2xl" />
        </header>

        <section className="mx-auto max-w-6xl px-6 pb-12 pt-14 text-center">
          <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.4em] text-primary mb-2">
            <Gamepad2 className="h-3.5 w-3.5" /> Palmon Survival Hub
          </p>
          <h2 className="text-chrome mx-auto mt-5 font-display text-5xl leading-[0.95] sm:text-7xl">
            GAMES. APPS.
          </h2>
        </section>
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {featured && (
          <section className="pt-10">
            <h3 className="mb-5 font-display text-4xl tracking-wide sm:text-5xl">APP DER WOCHE</h3>
            <article id={featured.id} className="surface-lux grid gap-0 md:grid-cols-2">
              <Cover path={featured.image_url} alt={featured.title} className="aspect-[16/10] md:aspect-auto" />
              <div className="p-6 sm:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                  {featured.kind === "app" ? "App" : "Game"}
                  {featured.platform ? ` • ${featured.platform}` : ""}
                </p>
                <h4 className="mt-2 font-display text-4xl leading-none">{featured.title}</h4>
                {featured.subtitle && (
                  <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    {featured.subtitle}
                  </p>
                )}
                {featured.description && (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{featured.description}</p>
                )}
                <div className="mt-5 flex items-center gap-4">
                  <span className="flex items-center gap-1 font-display text-2xl text-primary">
                    <Star className="h-5 w-5 fill-current" /> {featured.rating}
                  </span>
                  {featured.link_url && (
                    <a
                      href={featured.link_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 bg-primary px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground"
                    >
                      Öffnen <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <div className="mt-5">
                  <Metrics post={featured} reviews={reviewsFor(featured.id)} />
                </div>
                <ReviewList reviews={reviewsFor(featured.id)} />
              </div>
            </article>
          </section>
        )}

        {top.length > 0 && (
          <section className="pt-20">
            <h3 className="mb-5 font-display text-4xl tracking-wide sm:text-5xl">TOP 10</h3>
            <div className="surface-lux">
              {top.map((p, i) => (
                <a
                  key={p.id}
                  href={p.link_url ?? `#${p.id}`}
                  target={p.link_url ? "_blank" : undefined}
                  rel="noreferrer"
                  className="flex items-center gap-4 border-b border-white/5 px-4 py-3.5 transition-colors hover:bg-primary/10"
                >
                  <span className="w-8 shrink-0 font-display text-2xl text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Cover path={p.image_url} alt={p.title} className="h-12 w-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg tracking-wide">{p.title}</p>
                    <p className="truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {p.platform ?? (p.kind === "app" ? "App" : "Game")}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-foreground">
                    <Star className="h-4 w-4 fill-current text-primary" /> {p.rating}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="pt-20">
          <h3 className="mb-5 font-display text-4xl tracking-wide sm:text-5xl">ALLE BEITRÄGE</h3>
          {rest.length === 0 ? (
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              Noch keine Games oder Apps veröffentlicht.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {rest.map((p) => (
                <article key={p.id} id={p.id} className="surface-lux overflow-hidden">
                  <Cover path={p.image_url} alt={p.title} className="aspect-[16/9]" />
                  <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                      {p.kind === "app" ? "App" : "Game"}
                      {p.platform ? ` • ${p.platform}` : ""}
                    </p>
                    <h4 className="mt-1 font-display text-3xl leading-none">{p.title}</h4>
                    {p.description && (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <Metrics post={p} reviews={reviewsFor(p.id)} />
                      {p.link_url && (
                        <a
                          href={p.link_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary"
                        >
                          Öffnen <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <ReviewList reviews={reviewsFor(p.id)} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
