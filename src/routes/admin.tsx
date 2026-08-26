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
        <TabsList className="w-full">
          <TabsTrigger value="tracks" className="flex-1">Playlist</TabsTrigger>
          <TabsTrigger value="artists" className="flex-1">Artists</TabsTrigger>
          <TabsTrigger value="donation" className="flex-1">Spenden</TabsTrigger>
        </TabsList>
        <TabsContent value="tracks"><TracksAdmin /></TabsContent>
        <TabsContent value="artists"><ArtistsAdmin /></TabsContent>
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
