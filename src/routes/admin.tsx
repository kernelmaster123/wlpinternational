import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — CLOUD FM | WLP International" },
      { name: "description", content: "Interner Admin-Bereich von CLOUD FM." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — CLOUD FM" },
      { property: "og:description", content: "Interner Admin-Bereich von CLOUD FM." },
    ],
  }),
  component: AdminPage,
});

const ADMIN_EMAIL = "olepoetter@gmx.de";

function AdminPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return null;

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl tracking-[0.2em]">
            <span className="text-gold">ADMIN</span>
          </h1>
          <Link to="/" className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-primary">
            Zur Seite
          </Link>
        </div>
        <div className="hairline mt-6" />
        {email === ADMIN_EMAIL ? <Panel /> : <LoginForm hint={email} />}
      </div>
    </div>
  );
}

function LoginForm({ hint }: { hint: string | null }) {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const mail = String(fd.get("email"));
    const pass = String(fd.get("password"));
    setLoading(true);
    let { error } = await supabase.auth.signInWithPassword({ email: mail, password: pass });
    if (error && /invalid login/i.test(error.message)) {
      const signup = await supabase.auth.signUp({ email: mail, password: pass });
      error = signup.error;
      if (!error) {
        const retry = await supabase.auth.signInWithPassword({ email: mail, password: pass });
        error = retry.error;
      }
    }
    setLoading(false);
    if (error) toast.error(error.message);
  }

  return (
    <form onSubmit={onSubmit} className="surface-lux mt-10 space-y-5 rounded-sm p-8">
      {hint && (
        <p className="text-sm text-muted-foreground">
          Angemeldet als {hint} — kein Admin-Konto.{" "}
          <button type="button" className="text-primary underline" onClick={() => supabase.auth.signOut()}>
            Abmelden
          </button>
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Passwort</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Anmelden…" : "Anmelden"}
      </Button>
    </form>
  );
}

function Panel() {
  return (
    <div className="mt-10">
      <div className="mb-6 flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
          Abmelden
        </Button>
      </div>
      <Tabs defaultValue="tracks">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="tracks">Playlist</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="donation">Spenden</TabsTrigger>
        </TabsList>
        <TabsContent value="tracks"><TracksAdmin /></TabsContent>
        <TabsContent value="artists"><ArtistsAdmin /></TabsContent>
        <TabsContent value="games"><GamesAdmin /></TabsContent>
        <TabsContent value="donation"><DonationAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

function TracksAdmin() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: tracks = [] } = useQuery({
    queryKey: ["tracks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tracks").select("*").order("position");
      if (error) throw error;
      return data;
    },
  });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const audio = fd.get("audio") as File | null;
    const cover = fd.get("cover") as File | null;
    const audioLink = String(fd.get("audio_link") ?? "").trim();
    if (!audio?.size && !audioLink) {
      toast.error("Bitte Audiodatei hochladen oder Link angeben.");
      return;
    }
    setBusy(true);
    try {
      const audio_url = audio?.size ? await uploadMedia(audio, "tracks") : audioLink;
      const cover_url = cover?.size ? await uploadMedia(cover, "covers") : null;
      const { error } = await supabase.from("tracks").insert({
        title: String(fd.get("title")),
        artist: String(fd.get("artist") ?? ""),
        audio_url,
        cover_url,
        position: Number(fd.get("position") ?? 0),
      });
      if (error) throw error;
      form.reset();
      qc.invalidateQueries({ queryKey: ["tracks"] });
      toast.success("Track hinzugefügt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("tracks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["tracks"] });
  }

  return (
    <div className="mt-6 space-y-8">
      <form onSubmit={onSubmit} className="surface-lux space-y-4 rounded-sm p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Titel</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="artist">Artist</Label>
          <Input id="artist" name="artist" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audio">Audiodatei</Label>
          <Input id="audio" name="audio" type="file" accept="audio/*" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audio_link">…oder Audio-Link</Label>
          <Input id="audio_link" name="audio_link" placeholder="https://…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cover">Cover (Bild)</Label>
          <Input id="cover" name="cover" type="file" accept="image/*" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">Reihenfolge</Label>
          <Input id="position" name="position" type="number" defaultValue={0} />
        </div>
        <Button type="submit" disabled={busy}>{busy ? "Speichern…" : "Track hinzufügen"}</Button>
      </form>

      <div className="surface-lux rounded-sm">
        {tracks.map((t) => (
          <div key={t.id} className="flex items-center justify-between border-b border-border/60 px-5 py-3">
            <span className="truncate text-sm">
              {t.title} <span className="text-muted-foreground">— {t.artist}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => remove(t.id)}>Löschen</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtistsAdmin() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: artists = [] } = useQuery({
    queryKey: ["artists"],
    queryFn: async () => {
      const { data, error } = await supabase.from("artists").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const photo = fd.get("photo") as File | null;
    setBusy(true);
    try {
      const photo_url = photo?.size ? await uploadMedia(photo, "artists") : null;
      const { error } = await supabase.from("artists").insert({
        name: String(fd.get("name")),
        bio: String(fd.get("bio") ?? ""),
        photo_url,
      });
      if (error) throw error;
      form.reset();
      qc.invalidateQueries({ queryKey: ["artists"] });
      toast.success("Artist hinzugefügt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("artists").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["artists"] });
  }

  return (
    <div className="mt-6 space-y-8">
      <form onSubmit={onSubmit} className="surface-lux space-y-4 rounded-sm p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Beschreibung</Label>
          <Textarea id="bio" name="bio" rows={3} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="photo">Foto</Label>
          <Input id="photo" name="photo" type="file" accept="image/*" />
        </div>
        <Button type="submit" disabled={busy}>{busy ? "Speichern…" : "Artist hinzufügen"}</Button>
      </form>

      <div className="surface-lux rounded-sm">
        {artists.map((a) => (
          <div key={a.id} className="flex items-center justify-between border-b border-border/60 px-5 py-3">
            <span className="truncate text-sm">{a.name}</span>
            <Button variant="ghost" size="sm" onClick={() => remove(a.id)}>Löschen</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function GamesAdmin() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState("game");
  const [platform, setPlatform] = useState("");
  const [rating, setRating] = useState("8.5");
  const [topRank, setTopRank] = useState("");
  const [likes, setLikes] = useState("0");
  const [shares, setShares] = useState("0");
  const [views, setViews] = useState("0");
  const [linkUrl, setLinkUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [position, setPosition] = useState("0");

  const { data: games = [] } = useQuery({
    queryKey: ["game_posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("game_posts").select("*").order("position");
      if (error) throw error;
      return data;
    },
  });

  function startEdit(g: any) {
    setEditingId(g.id);
    setTitle(g.title ?? "");
    setSubtitle(g.subtitle ?? "");
    setDescription(g.description ?? "");
    setKind(g.kind ?? "game");
    setPlatform(g.platform ?? "");
    setRating(String(g.rating ?? 8.5));
    setTopRank(g.top_rank !== null ? String(g.top_rank) : "");
    setLikes(String(g.likes ?? 0));
    setShares(String(g.shares ?? 0));
    setViews(String(g.views ?? 0));
    setLinkUrl(g.link_url ?? "");
    setIsFeatured(Boolean(g.is_featured));
    setPosition(String(g.position ?? 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle("");
    setSubtitle("");
    setDescription("");
    setKind("game");
    setPlatform("");
    setRating("8.5");
    setTopRank("");
    setLikes("0");
    setShares("0");
    setViews("0");
    setLinkUrl("");
    setIsFeatured(false);
    setPosition("0");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const image = fd.get("image") as File | null;
    setBusy(true);
    try {
      const image_url = image?.size ? await uploadMedia(image, "games") : undefined;

      const payload: any = {
        title,
        subtitle,
        description,
        kind,
        platform,
        rating: Number(rating),
        link_url: linkUrl,
        is_featured: isFeatured,
        top_rank: topRank ? Number(topRank) : null,
        position: Number(position),
        likes: Number(likes),
        shares: Number(shares),
        views: Number(views),
      };

      if (image_url) {
        payload.image_url = image_url;
      }

      if (editingId) {
        const { error } = await supabase.from("game_posts").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Game/App aktualisiert");
      } else {
        const { error } = await supabase.from("game_posts").insert(payload);
        if (error) throw error;
        toast.success("Game/App hinzugefügt");
      }

      cancelEdit();
      qc.invalidateQueries({ queryKey: ["game_posts"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("game_posts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      if (editingId === id) cancelEdit();
      qc.invalidateQueries({ queryKey: ["game_posts"] });
      toast.success("Gelöscht");
    }
  }

  return (
    <div className="mt-6 space-y-8">
      <form onSubmit={onSubmit} className="surface-lux space-y-4 rounded-sm p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg">{editingId ? "Game/App bearbeiten" : "Neues Game / Neue App"}</h3>
          {editingId && (
            <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
              Abbrechen
            </Button>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Titel</Label>
          <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subtitle">Untertitel</Label>
          <Input id="subtitle" name="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea id="description" name="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="kind">Art</Label>
            <select id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="game">Game</option>
              <option value="app">App</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform">Plattform</Label>
            <Input id="platform" name="platform" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="z.B. iOS, Android, PC" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rating">Rating (0-10)</Label>
            <Input id="rating" name="rating" type="number" step="0.1" value={rating} onChange={(e) => setRating(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="top_rank">Top 10 Rang (optional)</Label>
            <Input id="top_rank" name="top_rank" type="number" value={topRank} onChange={(e) => setTopRank(e.target.value)} placeholder="1-10" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="likes">Likes</Label>
            <Input id="likes" name="likes" type="number" value={likes} onChange={(e) => setLikes(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shares">Shares</Label>
            <Input id="shares" name="shares" type="number" value={shares} onChange={(e) => setShares(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="views">Views</Label>
            <Input id="views" name="views" type="number" value={views} onChange={(e) => setViews(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="link_url">Link-URL</Label>
          <Input id="link_url" name="link_url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="image">Cover / Bild {editingId && "(leer lassen, um das aktuelle zu behalten)"}</Label>
          <Input id="image" name="image" type="file" accept="image/*" />
        </div>
        <div className="flex items-center space-x-2 pt-2">
          <input type="checkbox" id="is_featured" name="is_featured" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4 rounded border-input" />
          <Label htmlFor="is_featured">Als „App der Woche“ (Featured) markieren</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">Reihenfolge</Label>
          <Input id="position" name="position" type="number" value={position} onChange={(e) => setPosition(e.target.value)} />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Speichern…" : editingId ? "Änderungen speichern" : "Game/App hinzufügen"}
        </Button>
      </form>

      <div className="surface-lux rounded-sm">
        {games.map((g) => (
          <div key={g.id} className="flex items-center justify-between border-b border-border/60 px-5 py-3">
            <span className="truncate text-sm">
              {g.title} <span className="text-muted-foreground">— Likes: {g.likes} | Shares: {g.shares} | Views: {g.views}</span>
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => startEdit(g)}>Bearbeiten</Button>
              <Button variant="ghost" size="sm" onClick={() => remove(g.id)}>Löschen</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonationAdmin() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data } = useQuery({
    queryKey: ["donation"],
    queryFn: async () => {
      const { data, error } = await supabase.from("donation_info").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      btc_address: String(fd.get("btc") ?? ""),
      eth_address: String(fd.get("eth") ?? ""),
      paypal: String(fd.get("paypal") ?? ""),
      iban: String(fd.get("iban") ?? ""),
      recipient: String(fd.get("recipient") ?? ""),
      note: String(fd.get("note") ?? ""),
      updated_at: new Date().toISOString(),
    };
    setBusy(true);
    const { error } = data?.id
      ? await supabase.from("donation_info").update(payload).eq("id", data.id)
      : await supabase.from("donation_info").insert(payload);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      qc.invalidateQueries({ queryKey: ["donation"] });
      toast.success("Spendendaten gespeichert");
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface-lux mt-6 space-y-4 rounded-sm p-6" key={data?.id ?? "new"}>
      <div className="space-y-2">
        <Label htmlFor="recipient">Empfänger / Name</Label>
        <Input id="recipient" name="recipient" defaultValue={data?.recipient ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="btc">Bitcoin Wallet</Label>
        <Input id="btc" name="btc" defaultValue={data?.btc_address ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="eth">Ethereum Wallet</Label>
        <Input id="eth" name="eth" defaultValue={data?.eth_address ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="paypal">PayPal</Label>
        <Input id="paypal" name="paypal" defaultValue={data?.paypal ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="iban">IBAN</Label>
        <Input id="iban" name="iban" defaultValue={data?.iban ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="note">Hinweistext</Label>
        <Textarea id="note" name="note" rows={3} defaultValue={data?.note ?? ""} />
      </div>
      <Button type="submit" disabled={busy}>{busy ? "Speichern…" : "Speichern"}</Button>
    </form>
  );
}
