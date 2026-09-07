import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Shield, UserPlus, Trash2, Edit, Sparkles, Settings, Plus, X, Server, FileText, Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/Games/Palmon")({
  component: PalmonSurvivalPage,
});

type Patchnote = {
  id: string;
  version: string;
  title: string;
  category: string;
  date: string;
  content: string;
};

type ServerItem = {
  id: string;
  name: string;
  ip: string;
  status: string;
  rates: string;
  players: string;
};

type QuestItem = {
  id: string;
  title: string;
  category: string;
  reward: string;
  desc: string;
};

type Guild = {
  id: string;
  name: string;
  logo_url: string | null;
  color: string;
  description: string | null;
  position: number;
};

type GuildMember = {
  id: string;
  guild_id: string;
  name: string;
  avatar_url: string | null;
  rank: string;
  highlight: boolean;
  effect_type: string;
  custom_color: string | null;
  bio: string | null;
  position: number;
};

const INITIAL_PATCHNOTES: Patchnote[] = [
  { id: "p1", version: "v1.0.4", title: "Große Map-Erweiterung", category: "Patch", date: "05.06.2026", content: "Neue Biome, neue Palmon-Arten und Bugfixes für das Multiplayer-Hosting." },
  { id: "p2", version: "v1.0.3", title: "Performance Hotfix", category: "Hotfix", date: "28.05.2026", content: "Ladezeiten im Inventar optimiert und Server-Lag reduziert." },
];

const INITIAL_SERVERS: ServerItem[] = [
  { id: "s1", name: "EU Official #1 (PvP)", ip: "play.palmon-survival.de:27015", status: "Online", rates: "2x XP, 3x Zucht", players: "48/64" },
  { id: "s2", name: "EU Community (PvE)", ip: "pve.palmon-survival.de:27016", status: "Online", rates: "1.5x XP, 2x Ressourcen", players: "24/40" },
];

const INITIAL_QUESTS: QuestItem[] = [
  { id: "q1", title: "Der erste Funke", category: "Story", reward: "Legendäre Sphäre", desc: "Baue deine erste Basis und fange dein erstes Palmon der Stufe 10." },
  { id: "q2", title: "Turm des Syndikats", category: "Boss-Quest", reward: "Antike Technologie-Punkte", desc: "Bezwinge den Boss im ersten Wüstenturm." },
];

const INITIAL_GUILDS: Guild[] = [
  { id: "1", name: "Dragon Riders", color: "#ef4444", description: "Aktive Gilde sucht Verstärkung für Boss-Raids und gemeinsame Zucht.", logo_url: "", position: 0 },
  { id: "2", name: "Shadow Hunters", color: "#3b82f6", description: "Fokus auf PvP und Basenbau. Erfahrenes Team.", logo_url: "", position: 1 },
];

const INITIAL_MEMBERS: GuildMember[] = [
  { id: "m1", guild_id: "1", name: "Alex_99", rank: "Gildenmeister", highlight: true, effect_type: "glow", custom_color: "#ef4444", avatar_url: "", bio: "", position: 0 },
  { id: "m2", guild_id: "2", name: "Valkyrie", rank: "Offizier", highlight: false, effect_type: "pulse", custom_color: "#3b82f6", avatar_url: "", bio: "", position: 0 },
];

function getEffectClass(effectType: string) {
  switch (effectType) {
    case "glow":
      return "shadow-[0_0_20px_rgba(239,68,68,0.8)] border-primary animate-pulse";
    case "blink":
      return "animate-ping border-primary";
    case "pulse":
      return "animate-pulse border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]";
    default:
      return "border-white/10";
  }
}

function PalmonSurvivalPage() {
  const [activeTab, setActiveTab] = useState("patchnotes");
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState<"patchnotes" | "servers" | "guilds" | "quests">("patchnotes");

  // Admin Auth Check via Supabase
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAdmin(true);
      }
    }
    checkAuth();
  }, []);

  // Lokale States mit LocalStorage Synchronisation für alle Bereiche
  const [patchnotes, setPatchnotes] = useState<Patchnote[]>(() => {
    const saved = localStorage.getItem("palmon_local_patchnotes");
    return saved ? JSON.parse(saved) : INITIAL_PATCHNOTES;
  });

  const [servers, setServers] = useState<ServerItem[]>(() => {
    const saved = localStorage.getItem("palmon_local_servers");
    return saved ? JSON.parse(saved) : INITIAL_SERVERS;
  });

  const [quests, setQuests] = useState<QuestItem[]>(() => {
    const saved = localStorage.getItem("palmon_local_quests");
    return saved ? JSON.parse(saved) : INITIAL_QUESTS;
  });

  const [guilds, setGuilds] = useState<Guild[]>(() => {
    const saved = localStorage.getItem("palmon_local_guilds");
    return saved ? JSON.parse(saved) : INITIAL_GUILDS;
  });

  const [members, setMembers] = useState<GuildMember[]>(() => {
    const saved = localStorage.getItem("palmon_local_members");
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  useEffect(() => {
    localStorage.setItem("palmon_local_patchnotes", JSON.stringify(patchnotes));
  }, [patchnotes]);

  useEffect(() => {
    localStorage.setItem("palmon_local_servers", JSON.stringify(servers));
  }, [servers]);

  useEffect(() => {
    localStorage.setItem("palmon_local_quests", JSON.stringify(quests));
  }, [quests]);

  useEffect(() => {
    localStorage.setItem("palmon_local_guilds", JSON.stringify(guilds));
  }, [guilds]);

  useEffect(() => {
    localStorage.setItem("palmon_local_members", JSON.stringify(members));
  }, [members]);

  // Edit-States für Admin
  const [editingPatchnote, setEditingPatchnote] = useState<Partial<Patchnote> | null>(null);
  const [editingServer, setEditingServer] = useState<Partial<ServerItem> | null>(null);
  const [editingQuest, setEditingQuest] = useState<Partial<QuestItem> | null>(null);
  const [editingGuild, setEditingGuild] = useState<Partial<Guild> | null>(null);
  const [editingMember, setEditingMember] = useState<Partial<GuildMember> | null>(null);

  // Speicher- & Löschfunktionen für Patchnotes
  function savePatchnote(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPatchnote?.title) return;
    if (editingPatchnote.id) {
      setPatchnotes(patchnotes.map((p) => (p.id === editingPatchnote.id ? ({ ...p, ...editingPatchnote } as Patchnote) : p)));
    } else {
      const newItem: Patchnote = {
        id: crypto.randomUUID(),
        version: editingPatchnote.version || "v1.0.0",
        title: editingPatchnote.title,
        category: editingPatchnote.category || "Patch",
        date: editingPatchnote.date || new Date().toLocaleDateString(),
        content: editingPatchnote.content || "",
      };
      setPatchnotes([...patchnotes, newItem]);
    }
    setEditingPatchnote(null);
  }

  function deletePatchnote(id: string) {
    setPatchnotes(patchnotes.filter((p) => p.id !== id));
  }

  // Speicher- & Löschfunktionen für Server
  function saveServer(e: React.FormEvent) {
    e.preventDefault();
    if (!editingServer?.name) return;
    if (editingServer.id) {
      setServers(servers.map((s) => (s.id === editingServer.id ? ({ ...s, ...editingServer } as ServerItem) : s)));
    } else {
      const newItem: ServerItem = {
        id: crypto.randomUUID(),
        name: editingServer.name,
        ip: editingServer.ip || "",
        status: editingServer.status || "Online",
        rates: editingServer.rates || "1x XP",
        players: editingServer.players || "0/64",
      };
      setServers([...servers, newItem]);
    }
    setEditingServer(null);
  }

  function deleteServer(id: string) {
    setServers(servers.filter((s) => s.id !== id));
  }

  // Speicher- & Löschfunktionen für Quests
  function saveQuest(e: React.FormEvent) {
    e.preventDefault();
    if (!editingQuest?.title) return;
    if (editingQuest.id) {
      setQuests(quests.map((q) => (q.id === editingQuest.id ? ({ ...q, ...editingQuest } as QuestItem) : q)));
    } else {
      const newItem: QuestItem = {
        id: crypto.randomUUID(),
        title: editingQuest.title,
        category: editingQuest.category || "Story",
        reward: editingQuest.reward || "Keine",
        desc: editingQuest.desc || "",
      };
      setQuests([...quests, newItem]);
    }
    setEditingQuest(null);
  }

  function deleteQuest(id: string) {
    setQuests(quests.filter((q) => q.id !== id));
  }

  // Gilden & Mitglieder Funktionen
  function saveGuild(e: React.FormEvent) {
    e.preventDefault();
    if (!editingGuild?.name) return;
    if (editingGuild.id) {
      setGuilds(guilds.map((g) => (g.id === editingGuild.id ? ({ ...g, ...editingGuild } as Guild) : g)));
    } else {
      const newGuild: Guild = {
        id: crypto.randomUUID(),
        name: editingGuild.name,
        color: editingGuild.color || "#ef4444",
        description: editingGuild.description || "",
        logo_url: editingGuild.logo_url || "",
        position: guilds.length,
      };
      setGuilds([...guilds, newGuild]);
    }
    setEditingGuild(null);
  }

  function deleteGuild(id: string) {
    if (!confirm("Gilde wirklich löschen?")) return;
    setGuilds(guilds.filter((g) => g.id !== id));
    setMembers(members.filter((m) => m.guild_id !== id));
  }

  function saveMember(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMember?.name || !editingMember?.guild_id) return;
    if (editingMember.id) {
      setMembers(members.map((m) => (m.id === editingMember.id ? ({ ...m, ...editingMember } as GuildMember) : m)));
    } else {
      const newMember: GuildMember = {
        id: crypto.randomUUID(),
        guild_id: editingMember.guild_id,
        name: editingMember.name,
        rank: editingMember.rank || "Mitglied",
        effect_type: editingMember.effect_type || "none",
        highlight: editingMember.highlight || false,
        custom_color: editingMember.custom_color || null,
        avatar_url: editingMember.avatar_url || "",
        bio: editingMember.bio || "",
        position: members.length,
      };
      setMembers([...members, newMember]);
    }
    setEditingMember(null);
  }

  function deleteMember(id: string) {
    setMembers(members.filter((m) => m.id !== id));
  }

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link to="/games" className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-primary">
              ← Zurück zu Games & Apps
            </Link>
            <h1 className="mt-2 font-display text-3xl tracking-wide text-gold">PALMON SURVIVAL HUB</h1>
            <p className="text-sm text-muted-foreground">Offizielles Community-, Server- & Gilden-Hub</p>
          </div>

          {/* ADMIN-BUTTON: Nur sichtbar wenn eingeloggt */}
          {isAdmin && (
            <button
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              className="flex items-center gap-2 rounded border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-background"
            >
              <Settings className="h-4 w-4" /> {isAdminOpen ? "Admin schließen" : "Admin (CloudFM)"}
            </button>
          )}
        </div>

        <div className="hairline" />

        {/* ADMIN MENÜ (Vollständig für alle Bereiche) */}
        {isAdmin && isAdminOpen && (
          <div className="surface-lux border-2 border-primary/60 p-6 space-y-6 rounded-sm bg-black/90">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="font-display text-xl text-primary flex items-center gap-2">
                <Settings className="h-5 w-5" /> Palmon Admin-Steuerung (CloudFM)
              </h2>
              <button onClick={() => setIsAdminOpen(false)} className="text-muted-foreground hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Admin Sub-Tabs */}
            <div className="grid grid-cols-4 gap-2 bg-secondary p-1 rounded text-xs">
              <button
                onClick={() => setAdminSubTab("patchnotes")}
                className={`py-2 rounded font-display uppercase tracking-wider transition-colors ${adminSubTab === "patchnotes" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-white"}`}
              >
                What's New
              </button>
              <button
                onClick={() => setAdminSubTab("servers")}
                className={`py-2 rounded font-display uppercase tracking-wider transition-colors ${adminSubTab === "servers" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-white"}`}
              >
                Server
              </button>
              <button
                onClick={() => setAdminSubTab("guilds")}
                className={`py-2 rounded font-display uppercase tracking-wider transition-colors ${adminSubTab === "guilds" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-white"}`}
              >
                Gilden & Spieler
              </button>
              <button
                onClick={() => setAdminSubTab("quests")}
                className={`py-2 rounded font-display uppercase tracking-wider transition-colors ${adminSubTab === "quests" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-white"}`}
              >
                Quests
              </button>
            </div>

            {/* 1. PATCHNOTES ADMIN */}
            {adminSubTab === "patchnotes" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg">Patchnotes / What's New verwalten</h3>
                  <button
                    onClick={() => setEditingPatchnote({ version: "v1.0.5", title: "", category: "Patch", date: new Date().toLocaleDateString(), content: "" })}
                    className="flex items-center gap-1 bg-primary px-3 py-1.5 text-xs font-bold uppercase text-primary-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" /> Neuer Eintrag
                  </button>
                </div>

                {editingPatchnote && (
                  <form onSubmit={savePatchnote} className="space-y-3 bg-secondary/50 p-4 rounded border border-white/10">
                    <h4 className="text-xs font-bold uppercase text-primary">{editingPatchnote.id ? "Patchnote bearbeiten" : "Neuen Patchnote hinzufügen"}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Version (z.B. v1.0.5)"
                        value={editingPatchnote.version || ""}
                        onChange={(e) => setEditingPatchnote({ ...editingPatchnote, version: e.target.value })}
                        className="bg-background px-3 py-2 text-sm border border-white/10 text-white"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Kategorie (z.B. Patch/Hotfix)"
                        value={editingPatchnote.category || ""}
                        onChange={(e) => setEditingPatchnote({ ...editingPatchnote, category: e.target.value })}
                        className="bg-background px-3 py-2 text-sm border border-white/10 text-white"
                      />
                      <input
                        type="text"
                        placeholder="Datum"
                        value={editingPatchnote.date || ""}
                        onChange={(e) => setEditingPatchnote({ ...editingPatchnote, date: e.target.value })}
                        className="bg-background px-3 py-2 text-sm border border-white/10 text-white"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Titel"
                      value={editingPatchnote.title || ""}
                      onChange={(e) => setEditingPatchnote({ ...editingPatchnote, title: e.target.value })}
                      className="w-full bg-background px-3 py-2 text-sm border border-white/10 text-white"
                      required
                    />
                    <textarea
                      placeholder="Inhalt / Beschreibung"
                      value={editingPatchnote.content || ""}
                      onChange={(e) => setEditingPatchnote({ ...editingPatchnote, content: e.target.value })}
                      className="w-full bg-background px-3 py-2 text-sm border border-white/10 text-white"
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditingPatchnote(null)} className="px-3 py-1.5 text-xs bg-secondary text-white">Abbrechen</button>
                      <button type="submit" className="px-3 py-1.5 text-xs bg-primary text-primary-foreground font-bold">Speichern</button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {patchnotes.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-secondary/30 p-3 rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-bold text-xs">[{item.version}]</span>
                          <span className="font-display text-sm text-white">{item.title}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{item.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingPatchnote(item)} className="p-1.5 text-muted-foreground hover:text-primary"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => deletePatchnote(item.id)} className="p-1.5 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. SERVER ADMIN */}
            {adminSubTab === "servers" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg">Server & Sessions verwalten</h3>
                  <button
                    onClick={() => setEditingServer({ name: "", ip: "", status: "Online", rates: "2x XP", players: "0/64" })}
                    className="flex items-center gap-1 bg-primary px-3 py-1.5 text-xs font-bold uppercase text-primary-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" /> Server hinzufügen
                  </button>
                </div>

                {editingServer && (
                  <form onSubmit={saveServer} className="space-y-3 bg-secondary/50 p-4 rounded border border-white/10">
                    <h4 className="text-xs font-bold uppercase text-primary">{editingServer.id ? "Server bearbeiten" : "Neuen Server hinzufügen"}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Server Name (z.B. EU Official #1)"
                        value={editingServer.name || ""}
                        onChange={(e) => setEditingServer({ ...editingServer, name: e.target.value })}
                        className="bg-background px-3 py-2 text-sm border border-white/10 text-white"
                        required
                      />
                      <input
                        type="text"
                        placeholder="IP-Adresse & Port"
                        value={editingServer.ip || ""}
                        onChange={(e) => setEditingServer({ ...editingServer, ip: e.target.value })}
                        className="bg-background px-3 py-2 text-sm border border-white/10 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Raten (z.B. 2x XP, 3x Zucht)"
                        value={editingServer.rates || ""}
                        onChange={(e) => setEditingServer({ ...editingServer, rates: e.target.value })}
                        className="bg-background px-3 py-2 text-sm border border-white/10 text-white"
                      />
                      <input
                        type="text"
                        placeholder="Spieler (z.B. 48/64)"
                        value={editingServer.players || ""}
                        onChange={(e) => setEditingServer({ ...editingServer, players: e.target.value })}
                        className="bg-background px-3 py-2 text-sm border border-white/10 text-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditingServer(null)} className="px-3 py-1.5 text-xs bg-secondary text-white">Abbrechen</button>
                      <button type="submit" className="px-3 py-1.5 text-xs bg-primary text-primary-foreground font-bold">Speichern</button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {servers.map((srv) => (
                    <div key={srv.id} className="flex items-center justify-between bg-secondary/30 p-3 rounded">
                      <div>
                        <span className="font-display text-sm text-white">{srv.name}</span>
                        <p className="text-[10px] font-mono text-muted-foreground">{srv.ip} | Spieler: {srv.players}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingServer(srv)} className="p-1.5 text-muted-foreground hover:text-primary"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => deleteServer(srv.id)} className="p-1.5 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. GILDEN & MITGLIEDER ADMIN */}
            {adminSubTab === "guilds" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base text-primary">Gilden verwalten</h3>
                    <button
                      onClick={() => setEditingGuild({ name: "", color: "#ef4444", description: "" })}
                      className="flex items-center gap-1 bg-primary px-3 py-1.5 text-xs font-bold uppercase text-primary-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" /> Gilde hinzufügen
                    </button>
                  </div>

                  {editingGuild && (
                    <form onSubmit={saveGuild} className="space-y-3 bg-secondary/50 p-4 rounded border border-white/10">
                      <h4 className="text-xs font-bold uppercase text-primary">{editingGuild.id ? "Gilde bearbeiten" : "Neue Gilde anlegen"}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Gildenname"
                          value={editingGuild.name || ""}
                          onChange={(e) => setEditingGuild({ ...editingGuild, name: e.target.value })}
                          className="bg-background px-3 py-2 text-sm border border-white/10 text-white"
                          required
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-muted-foreground">Farbe:</label>
                          <input
                            type="color"
                            value={editingGuild.color || "#ef4444"}
                            onChange={(e) => setEditingGuild({ ...editingGuild, color: e.target.value })}
                            className="h-9 w-12 bg-transparent cursor-pointer"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Logo Bild-URL"
                        value={editingGuild.logo_url || ""}
                        onChange={(e) => setEditingGuild({ ...editingGuild, logo_url: e.target.value })}
                        className="w-full bg-background px-3 py-2 text-sm border border-white/10 text-white"
                      />
                      <textarea
                        placeholder="Beschreibung"
                        value={editingGuild.description || ""}
                        onChange={(e) => setEditingGuild({ ...editingGuild, description: e.target.value })}
                        className="w-full bg-background px-3 py-2 text-sm border border-white/10 text-white"
                      />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingGuild(null)} className="px-3 py-1.5 text-xs bg-secondary text-white">Abbrechen</button>
                        <button type="submit" className="px-3 py-1.5 text-xs bg-primary text-primary-foreground font-bold">Speichern</button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {guilds.map((g) => (
                      <div key={g.id} className="flex items-center justify-between bg-secondary/30 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: g.color }} />
                          <span className="font-display text-sm text-white">{g.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditingGuild(g)} className="p-1 text-muted-foreground hover:text-primary"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => deleteGuild(g.id)} className="p-1 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base text-primary">Mitglieder verwalten</h3>
                    <button
                      onClick={() => setEditingMember({ name: "", rank: "Mitglied", effect_type: "none", highlight: false, guild_id: guilds[0]?.id || "" })}
                      className="flex items-center gap-1 bg-primary px-3 py-1.5 text-xs font-bold uppercase text-primary-foreground"
                      disabled={guilds.length === 0}
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Spieler hinzufügen
                    </button>
                  </div>

                  {editingMember && (
                    <form onSubmit={saveMember} className="space-y-3 bg-secondary/50 p-4 rounded border border-white/10">
                      <h4 className="text-xs font-bold uppercase text-primary">{editingMember.id ? "Spieler bearbeiten" : "Neuen Spieler hinzufügen"}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select
                          value={editingMember.guild_id || ""}
                          onChange={(e) => setEditingMember({ ...editingMember, guild_id: e.target.value })}
                          className="bg-background px-3 py-2 text-sm border border-white/10 text-white"
                          required
                        >
                          <option value="">Gilde wählen...</option>
                          {guilds.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Spielername"
                          value={editingMember.name || ""}
                          onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                          className="bg-background px-3 py-2 text-sm border border-white/10 text-white"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Rang (z.B. Offizier)"
                          value={editingMember.rank || ""}
                          onChange={(e) => setEditingMember({ ...editingMember, rank: e.target.value })}
                          className="bg-background px-3 py-2 text-sm border border-white/10 text-white"
                        />
                        <select
                          value={editingMember.effect_type || "none"}
                          onChange={(e) => setEditingMember({ ...editingMember, effect_type: e.target.value })}
                          className="bg-background px-3 py-2 text-sm border border-white/10 text-white"
                        >
                          <option value="none">Effekt: Keiner</option>
                          <option value="glow">Leuchten (Glow)</option>
                          <option value="blink">Blinken</option>
                          <option value="pulse">Pulsieren</option>
                        </select>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-muted-foreground">Farbe:</label>
                          <input
                            type="color"
                            value={editingMember.custom_color || "#ef4444"}
                            onChange={(e) => setEditingMember({ ...editingMember, custom_color: e.target.value })}
                            className="h-9 w-12 bg-transparent cursor-pointer"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Avatar URL"
                        value={editingMember.avatar_url || ""}
                        onChange={(e) => setEditingMember({ ...editingMember, avatar_url: e.target.value })}
                        className="w-full bg-background px-3 py-2 text-sm border border-white/10 text-white"
                      />
                      <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingMember.highlight || false}
                          onChange={(e) => setEditingMember({ ...editingMember, highlight: e.target.checked })}
                        />
                        Diesen Spieler besonders hervorheben
                      </label>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingMember(null)} className="px-3 py-1.5 text-xs bg-secondary text-white">Abbrechen</button>
                        <button type="submit" className="px-3 py-1.5 text-xs bg-primary text-primary-foreground font-bold">Speichern</button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between bg-secondary/30 p-2 rounded">
                        <span className="font-display text-sm text-white">{m.name} <span className="text-xs text-muted-foreground">({m.rank})</span></span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditingMember(m)} className="p-1 text-muted-foreground hover:text-primary"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => deleteMember(m.id)} className="p-1 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. QUESTS ADMIN */}
            {adminSubTab === "quests" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg">Quests & Guides verwalten</h3>
                  <button
                    onClick={() => setEditingQuest({ title: "", category: "Story", reward: "", desc: "" })}
                    className="flex items-center gap-1 bg-primary px-3 py-1.5 text-xs font-bold uppercase text-primary-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" /> Quest hinzufügen
                  </button>
                </div>

                {editingQuest && (
                  <form onSubmit={saveQuest} className="space-y-3 bg-secondary/50 p-4 rounded border border-white/10">
                    <h4 className="text-xs font-bold uppercase text-primary">{editingQuest.id ? "Quest bearbeiten" : "Neue Quest hinzufügen"}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Titel"
                        value={editingQuest.title || ""}
                        onChange={(e) => setEditingQuest({ ...editingQuest, title: e.target.value })}
                        className="bg-background px-3 py-2 text-sm border border-white/10 text-white sm:col-span-2"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Kategorie (z.B. Story)"
                        value={editingQuest.category || ""}
                        onChange={(e) => setEditingQuest({ ...editingQuest, category: e.target.value })}
                        className="bg-background px-3 py-2 text-sm border border-white/10 text-white"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Belohnung (z.B. Legendäre Sphäre)"
                      value={editingQuest.reward || ""}
                      onChange={(e) => setEditingQuest({ ...editingQuest, reward: e.target.value })}
                      className="w-full bg-background px-3 py-2 text-sm border border-white/10 text-white"
                    />
                    <textarea
                      placeholder="Beschreibung"
                      value={editingQuest.desc || ""}
                      onChange={(e) => setEditingQuest({ ...editingQuest, desc: e.target.value })}
                      className="w-full bg-background px-3 py-2 text-sm border border-white/10 text-white"
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditingQuest(null)} className="px-3 py-1.5 text-xs bg-secondary text-white">Abbrechen</button>
                      <button type="submit" className="px-3 py-1.5 text-xs bg-primary text-primary-foreground font-bold">Speichern</button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {quests.map((q) => (
                    <div key={q.id} className="flex items-center justify-between bg-secondary/30 p-3 rounded">
                      <div>
                        <span className="font-display text-sm text-white">{q.title}</span>
                        <p className="text-[10px] text-muted-foreground">Kategorie: {q.category} | Belohnung: {q.reward}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingQuest(q)} className="p-1.5 text-muted-foreground hover:text-primary"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => deleteQuest(q.id)} className="p-1.5 text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Haupt-Tabs der Seite */}
        <div className="space-y-6">
          <div className="grid w-full grid-cols-4 text-xs bg-secondary p-1 rounded">
            <button
              onClick={() => setActiveTab("patchnotes")}
              className={`py-2 font-display uppercase tracking-wider rounded transition-all ${activeTab === "patchnotes" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"}`}
            >
              What's New
            </button>
            <button
              onClick={() => setActiveTab("servers")}
              className={`py-2 font-display uppercase tracking-wider rounded transition-all ${activeTab === "servers" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"}`}
            >
              Server & Sessions
            </button>
            <button
              onClick={() => setActiveTab("guilds")}
              className={`py-2 font-display uppercase tracking-wider rounded transition-all ${activeTab === "guilds" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"}`}
            >
              Gilden
            </button>
            <button
              onClick={() => setActiveTab("quests")}
              className={`py-2 font-display uppercase tracking-wider rounded transition-all ${activeTab === "quests" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"}`}
            >
              Quests & Guides
            </button>
          </div>

          {/* 1. What's New Ansicht */}
          {activeTab === "patchnotes" && (
            <div className="space-y-4">
              {patchnotes.map((item) => (
                <div key={item.id} className="surface-lux rounded-sm p-6 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="text-primary font-bold">[{item.version}]</span>
                    <span>{item.date}</span>
                  </div>
                  <h3 className="font-display text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* 2. Server Ansicht */}
          {activeTab === "servers" && (
            <div className="space-y-4">
              {servers.map((server) => (
                <div key={server.id} className="surface-lux flex items-center justify-between rounded-sm p-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="font-display text-base">{server.name}</h3>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">{server.ip}</p>
                    <p className="text-xs text-muted-foreground">Raten: {server.rates}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">Spieler</span>
                    <p className="font-mono text-sm">{server.players}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. Gilden Ansicht */}
          {activeTab === "guilds" && (
            <div className="space-y-8">
              {guilds.length === 0 ? (
                <div className="surface-lux p-8 text-center text-muted-foreground">
                  <p>Noch keine Gilden vorhanden.</p>
                </div>
              ) : (
                guilds.map((guild) => {
                  const guildMembers = members.filter((m) => m.guild_id === guild.id);
                  return (
                    <div
                      key={guild.id}
                      className="surface-lux rounded-sm p-6 space-y-4 border-l-4"
                      style={{ borderLeftColor: guild.color }}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                          {guild.logo_url && (
                            <img src={guild.logo_url} alt={guild.name} className="h-10 w-10 rounded object-cover border border-white/20" />
                          )}
                          <div>
                            <h3 className="font-display text-xl" style={{ color: guild.color }}>{guild.name}</h3>
                            {guild.description && <p className="text-xs text-muted-foreground">{guild.description}</p>}
                          </div>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest bg-secondary px-3 py-1 rounded text-primary">
                          {guildMembers.length} Mitglieder
                        </span>
                      </div>

                      <div className="hairline my-3" />

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {guildMembers.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">Keine Mitglieder in dieser Gilde.</p>
                        ) : (
                          guildMembers.map((member) => {
                            const effectClass = getEffectClass(member.effect_type);
                            return (
                              <div
                                key={member.id}
                                className={`p-3 rounded bg-secondary/40 border transition-all flex items-center gap-3 ${effectClass} ${member.highlight ? "bg-primary/10 ring-2 ring-primary/40" : ""}`}
                                style={member.custom_color ? { borderColor: member.custom_color } : undefined}
                              >
                                <div className="h-10 w-10 shrink-0 rounded bg-background overflow-hidden border border-white/10 flex items-center justify-center font-display text-sm text-primary">
                                  {member.avatar_url ? (
                                    <img src={member.avatar_url} alt={member.name} className="h-full w-full object-cover" />
                                  ) : (
                                    member.name.substring(0, 2).toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <p className="truncate font-display text-sm" style={member.custom_color ? { color: member.custom_color } : undefined}>
                                      {member.name}
                                    </p>
                                    {member.highlight && <Sparkles className="h-3 w-3 text-primary shrink-0" />}
                                  </div>
                                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{member.rank}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 4. Quests Ansicht */}
          {activeTab === "quests" && (
            <div className="space-y-4">
              {quests.map((quest) => (
                <div key={quest.id} className="surface-lux rounded-sm p-6 space-y-2">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span className="uppercase tracking-widest text-primary">{quest.category}</span>
                    <span>Belohnung: {quest.reward}</span>
                  </div>
                  <h3 className="font-display text-lg">{quest.title}</h3>
                  <p className="text-sm text-muted-foreground">{quest.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
