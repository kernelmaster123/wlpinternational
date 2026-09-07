import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Shield, UserPlus, Trash2, Edit, Sparkles, Star, ExternalLink, Settings, Plus, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMediaUrl } from "@/lib/media";

export const Route = createFileRoute("/Games/Palmon")({
  component: PalmonSurvivalPage,
});

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
  effect_type: string; // 'none' | 'glow' | 'blink' | 'pulse'
  custom_color: string | null;
  bio: string | null;
  position: number;
};

function useSigned(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useState(() => {
    if (path) {
      getMediaUrl(path).then((u) => setUrl(u));
    }
  });
  return url;
}

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
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("patchnotes");
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // States für Admin-Formulare
  const [selectedGuildForMember, setSelectedGuildForMember] = useState<string | null>(null);
  const [editingGuild, setEditingGuild] = useState<Partial<Guild> | null>(null);
  const [editingMember, setEditingMember] = useState<Partial<GuildMember> | null>(null);

  // Daten aus Supabase laden
  const { data: guilds = [] } = useQuery({
    queryKey: ["palmon_guilds"],
    queryFn: async () => {
      const { data, error } = await supabase.from("guilds").select("*").order("position", { ascending: true });
      if (error) throw error;
      return data as Guild[];
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["palmon_guild_members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("guild_members").select("*").order("position", { ascending: true });
      if (error) throw error;
      return data as GuildMember[];
    },
  });

  // Statische Daten für Patchnotes, Server, Quests
  const patchnotes = [
    { version: "v1.0.4", title: "Große Map-Erweiterung", category: "Patch", date: "05.06.2026", content: "Neue Biome, neue Palmon-Arten und Bugfixes für das Multiplayer-Hosting." },
    { version: "v1.0.3", title: "Performance Hotfix", category: "Hotfix", date: "28.05.2026", content: "Ladezeiten im Inventar optimiert und Server-Lag reduziert." },
  ];

  const servers = [
    { name: "EU Official #1 (PvP)", ip: "play.palmon-survival.de:27015", status: "Online", rates: "2x XP, 3x Zucht", players: "48/64" },
    { name: "EU Community (PvE)", ip: "pve.palmon-survival.de:27016", status: "Online", rates: "1.5x XP, 2x Ressourcen", players: "24/40" },
  ];

  const quests = [
    { title: "Der erste Funke", category: "Story", reward: "Legendäre Sphäre", desc: "Baue deine erste Basis und fange dein erstes Palmon der Stufe 10." },
    { title: "Turm des Syndikats", category: "Boss-Quest", reward: "Antike Technologie-Punkte", desc: "Bezwinge den Boss im ersten Wüstenturm." },
  ];

  // Admin-Aktionen Gilden
  async function saveGuild(e: React.FormEvent) {
    e.preventDefault();
    if (!editingGuild?.name) return;
    if (editingGuild.id) {
      await supabase.from("guilds").update(editingGuild).eq("id", editingGuild.id);
    } else {
      await supabase.from("guilds").insert([editingGuild]);
    }
    setEditingGuild(null);
    qc.invalidateQueries({ queryKey: ["palmon_guilds"] });
  }

  async function deleteGuild(id: string) {
    if (!confirm("Gilde wirklich löschen?")) return;
    await supabase.from("guilds").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["palmon_guilds"] });
  }

  // Admin-Aktionen Mitglieder
  async function saveMember(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMember?.name || !editingMember?.guild_id) return;
    if (editingMember.id) {
      await supabase.from("guild_members").update(editingMember).eq("id", editingMember.id);
    } else {
      await supabase.from("guild_members").insert([editingMember]);
    }
    setEditingMember(null);
    qc.invalidateQueries({ queryKey: ["palmon_guild_members"] });
  }

  async function deleteMember(id: string) {
    await supabase.from("guild_members").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["palmon_guild_members"] });
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
          <button
            onClick={() => setIsAdminOpen(!isAdminOpen)}
            className="flex items-center gap-2 rounded border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-background"
          >
            <Settings className="h-4 w-4" /> {isAdminOpen ? "Admin schließen" : "Admin-Menü"}
          </button>
        </div>

        <div className="hairline" />

        {/* ADMIN MENÜ MODAL / BEREICH */}
        {isAdminOpen && (
          <div className="surface-lux border-2 border-primary/60 p-6 space-y-6 rounded-sm bg-black/80">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="font-display text-xl text-primary flex items-center gap-2">
                <Settings className="h-5 w-5" /> Zentrales Gilden-Admin-Menü
              </h2>
              <button onClick={() => setIsAdminOpen(false)} className="text-muted-foreground hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Gilde erstellen / bearbeiten */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg">Gilden verwalten</h3>
                <button
                  onClick={() => setEditingGuild({ name: "", color: "#ef4444", description: "" })}
                  className="flex items-center gap-1 bg-primary px-3 py-1.5 text-xs font-bold uppercase text-primary-foreground"
                >
                  <Plus className="h-3.5 w-3.5" /> Neue Gilde
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
                      className="bg-background px-3 py-2 text-sm border border-white/10"
                      required
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">Gildenfarbe:</label>
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
                    placeholder="Logo URL / Bildpfad"
                    value={editingGuild.logo_url || ""}
                    onChange={(e) => setEditingGuild({ ...editingGuild, logo_url: e.target.value })}
                    className="w-full bg-background px-3 py-2 text-sm border border-white/10"
                  />
                  <textarea
                    placeholder="Beschreibung"
                    value={editingGuild.description || ""}
                    onChange={(e) => setEditingGuild({ ...editingGuild, description: e.target.value })}
                    className="w-full bg-background px-3 py-2 text-sm border border-white/10"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingGuild(null)} className="px-3 py-1.5 text-xs bg-secondary">Abbrechen</button>
                    <button type="submit" className="px-3 py-1.5 text-xs bg-primary text-primary-foreground font-bold">Speichern</button>
                  </div>
                </form>
              )}

              {/* Gilden-Liste im Admin */}
              <div className="space-y-2">
                {guilds.map((g) => (
                  <div key={g.id} className="flex items-center justify-between bg-secondary/30 p-3 rounded">
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: g.color }} />
                      <span className="font-display text-sm">{g.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingGuild(g)}
                        className="p-1.5 text-muted-foreground hover:text-primary"
                        title="Bearbeiten"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteGuild(g.id)}
                        className="p-1.5 text-muted-foreground hover:text-red-500"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mitglieder verwalten */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg">Gildenmitglieder & Spieler verwalten</h3>
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
                      className="bg-background px-3 py-2 text-sm border border-white/10"
                      required
                    >
                      <Wählen Sie eine Gilde></Wählen>
                      {guilds.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Spielername"
                      value={editingMember.name || ""}
                      onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                      className="bg-background px-3 py-2 text-sm border border-white/10"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Rang (z.B. Gildenmeister)"
                      value={editingMember.rank || ""}
                      onChange={(e) => setEditingMember({ ...editingMember, rank: e.target.value })}
                      className="bg-background px-3 py-2 text-sm border border-white/10"
                    />
                    <select
                      value={editingMember.effect_type || "none"}
                      onChange={(e) => setEditingMember({ ...editingMember, effect_type: e.target.value })}
                      className="bg-background px-3 py-2 text-sm border border-white/10"
                    >
                      <option value="none">Effekt: Keiner</option>
                      <option value="glow">Leuchten (Glow)</option>
                      <option value="blink">Blinken</option>
                      <option value="pulse">Pulsieren</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">Indiv. Farbe:</label>
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
                    placeholder="Avatar Bild-URL"
                    value={editingMember.avatar_url || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, avatar_url: e.target.value })}
                    className="w-full bg-background px-3 py-2 text-sm border border-white/10"
                  />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingMember.highlight || false}
                        onChange={(e) => setEditingMember({ ...editingMember, highlight: e.target.checked })}
                      />
                      Diesen Spieler besonders hervorheben
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingMember(null)} className="px-3 py-1.5 text-xs bg-secondary">Abbrechen</button>
                    <button type="submit" className="px-3 py-1.5 text-xs bg-primary text-primary-foreground font-bold">Speichern</button>
                  </div>
                </form>
              )}

              {/* Mitglieder Liste im Admin */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {members.map((m) => {
                  const guildName = guilds.find((g) => g.id === m.guild_id)?.name || "Unbekannt";
                  return (
                    <div key={m.id} className="flex items-center justify-between bg-secondary/30 p-3 rounded">
                      <div className="flex items-center gap-3">
                        <span className="font-display text-sm">{m.name}</span>
                        <span className="text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded">Gilde: {guildName}</span>
                        <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded">{m.rank}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingMember(m)} className="p-1.5 text-muted-foreground hover:text-primary">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteMember(m.id)} className="p-1.5 text-muted-foreground hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tabs für die Bereiche */}
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

          {/* Update Infos */}
          {activeTab === "patchnotes" && (
            <div className="space-y-4">
              {patchnotes.map((item, idx) => (
                <div key={idx} className="surface-lux rounded-sm p-6 space-y-2">
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

          {/* Server Infos */}
          {activeTab === "servers" && (
            <div className="space-y-4">
              {servers.map((server, idx) => (
                <div key={idx} className="surface-lux flex items-center justify-between rounded-sm p-6">
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

          {/* GILDEN BEREICH (DYNAMISCH MIT ADMIN-STEUERUNG & EFFEKTEN) */}
          {activeTab === "guilds" && (
            <div className="space-y-8">
              {guilds.length === 0 ? (
                <div className="surface-lux p-8 text-center text-muted-foreground">
                  <p>Noch keine Gilden vorhanden. Öffne das <button onClick={() => setIsAdminOpen(true)} className="text-primary underline">Admin-Menü</button>, um Gilden und Mitglieder hinzuzufügen.</p>
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

                      {/* Mitglieder-Grid */}
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

          {/* Quests */}
          {activeTab === "quests" && (
            <div className="space-y-4">
              {quests.map((quest, idx) => (
                <div key={idx} className="surface-lux rounded-sm p-6 space-y-2">
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
