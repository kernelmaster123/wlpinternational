import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/games/palmon")({
  component: PalmonSurvivalPage,
});

// Hier kannst du die Daten ganz ohne Datenbank direkt anpassen
const PALMON_DATA = {
  patchnotes: [
    { version: "v1.0.4", title: "Große Map-Erweiterung", category: "Patch", date: "05.06.2026", content: "Neue Biome, neue Palmon-Arten und Bugfixes für das Multiplayer-Hosting." },
    { version: "v1.0.3", title: "Performance Hotfix", category: "Hotfix", date: "28.05.2026", content: "Ladezeiten im Inventar optimiert und Server-Lag reduziert." },
  ],
  servers: [
    { name: "EU Official #1 (PvP)", ip: "play.palmon-survival.de:27015", status: "Online", rates: "2x XP, 3x Zucht", players: "48/64" },
    { name: "EU Community (PvE)", ip: "pve.palmon-survival.de:27016", status: "Online", rates: "1.5x XP, 2x Ressourcen", players: "24/40" },
  ],
  guilds: [
    { name: "Dragon Riders", leader: "Alex_99", contact: "Discord: /dragonriders", desc: "Aktive Gilde sucht Verstärkung für Boss-Raids und gemeinsame Zucht." },
    { name: "Shadow Hunters", leader: "Valkyrie", contact: "Discord: /shadows", desc: "Fokus auf PvP und Basenbau. Erfahrenes Team." },
  ],
  quests: [
    { title: "Der erste Funke", category: "Story", reward: "Legendäre Sphäre", desc: "Baue deine erste Basis und fange dein erstes Palmon der Stufe 10." },
    { title: "Turm des Syndikats", category: "Boss-Quest", reward: "Antike Technologie-Punkte", desc: "Bezwinge den Boss im ersten Wüstenturm." },
  ],
};

function PalmonSurvivalPage() {
  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link to="/" className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-primary">
              ← Zurück zur Startseite
            </Link>
            <h1 className="mt-2 font-display text-3xl tracking-wide text-gold">PALMON SURVIVAL</h1>
            <p className="text-sm text-muted-foreground">Offizielles Community- & Infos-Hub</p>
          </div>
        </div>

        <div className="hairline" />

        {/* Tabs für die Bereiche */}
        <Tabs defaultValue="patchnotes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 text-xs">
            <TabsTrigger value="patchnotes">What's New</TabsTrigger>
            <TabsTrigger value="servers">Server & Sessions</TabsTrigger>
            <TabsTrigger value="guilds">Gilden</TabsTrigger>
            <TabsTrigger value="quests">Quests & Guides</TabsTrigger>
          </TabsList>

          {/* Update Infos */}
          <TabsContent value="patchnotes" className="space-y-4">
            {PALMON_DATA.patchnotes.map((item, idx) => (
              <div key={idx} className="surface-lux rounded-sm p-6 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="text-primary font-bold">[{item.version}]</span>
                  <span>{item.date}</span>
                </div>
                <h3 className="font-display text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.content}</p>
              </div>
            ))}
          </TabsContent>

          {/* Server Infos */}
          <TabsContent value="servers" className="space-y-4">
            {PALMON_DATA.servers.map((server, idx) => (
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
          </TabsContent>

          {/* Gilden */}
          <TabsContent value="guilds" className="space-y-4">
            {PALMON_DATA.guilds.map((guild, idx) => (
              <div key={idx} className="surface-lux rounded-sm p-6 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-display text-lg">{guild.name}</h3>
                  <span className="text-xs text-muted-foreground">Leitung: {guild.leader}</span>
                </div>
                <p className="text-sm text-muted-foreground">{guild.desc}</p>
                <div className="pt-2">
                  <span className="text-xs text-primary">{guild.contact}</span>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Quests */}
          <TabsContent value="quests" className="space-y-4">
            {PALMON_DATA.quests.map((quest, idx) => (
              <div key={idx} className="surface-lux rounded-sm p-6 space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="uppercase tracking-widest text-primary">{quest.category}</span>
                  <span>Belohnung: {quest.reward}</span>
                </div>
                <h3 className="font-display text-lg">{quest.title}</h3>
                <p className="text-sm text-muted-foreground">{quest.desc}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
