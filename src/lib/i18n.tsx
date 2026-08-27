import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "de" | "en" | "ru";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "de", label: "DE" },
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
];

const dict = {
  de: {
    onAir: "On Air — 24/7",
    heroLine1: "Jede Art von Musik.",
    heroLine2: "Ein Sender.",
    heroSub: "Rap • UK Drill • Trap • Alles dazwischen",
    playlist: "PLAYLIST",
    tracks: "Tracks",
    noTracks: "Noch keine Tracks in der Playlist.",
    artists: "ARTISTS",
    roster: "Worldwide Roster",
    noArtists: "Noch keine Artists hinterlegt.",
    supportA: "SUPPORT THE",
    supportB: "MOVEMENT",
    artist: "Artist",
    recipient: "Empfänger",
    btc: "Bitcoin Wallet",
    eth: "Ethereum Wallet",
    paypal: "PayPal",
    iban: "IBAN",
    copy: "kopieren",
    prev: "Zurück",
    next: "Weiter",
    play: "Wiedergabe",
    language: "Sprache",
  },
  en: {
    onAir: "On Air — 24/7",
    heroLine1: "Every kind of music.",
    heroLine2: "One station.",
    heroSub: "Rap • UK Drill • Trap • Everything between",
    playlist: "PLAYLIST",
    tracks: "Tracks",
    noTracks: "No tracks in the playlist yet.",
    artists: "ARTISTS",
    roster: "Worldwide Roster",
    noArtists: "No artists added yet.",
    supportA: "SUPPORT THE",
    supportB: "MOVEMENT",
    artist: "Artist",
    recipient: "Recipient",
    btc: "Bitcoin Wallet",
    eth: "Ethereum Wallet",
    paypal: "PayPal",
    iban: "IBAN",
    copy: "copy",
    prev: "Previous",
    next: "Next",
    play: "Play",
    language: "Language",
  },
  ru: {
    onAir: "В эфире — 24/7",
    heroLine1: "Любая музыка.",
    heroLine2: "Одна радиостанция.",
    heroSub: "Рэп • UK Drill • Trap • И всё между",
    playlist: "ПЛЕЙЛИСТ",
    tracks: "треков",
    noTracks: "В плейлисте пока нет треков.",
    artists: "АРТИСТЫ",
    roster: "Worldwide Roster",
    noArtists: "Артисты пока не добавлены.",
    supportA: "ПОДДЕРЖИ",
    supportB: "ДВИЖЕНИЕ",
    artist: "Артист",
    recipient: "Получатель",
    btc: "Bitcoin кошелёк",
    eth: "Ethereum кошелёк",
    paypal: "PayPal",
    iban: "IBAN",
    copy: "копировать",
    prev: "Назад",
    next: "Далее",
    play: "Воспроизвести",
    language: "Язык",
  },
} as const;

export type TKey = keyof (typeof dict)["de"];

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string }>({
  lang: "de",
  setLang: () => {},
  t: (k) => dict.de[k],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("de");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved && LANGS.some((l) => l.code === saved)) setLang(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  return (
    <Ctx.Provider value={{ lang, setLang, t: (k) => dict[lang][k] }}>{children}</Ctx.Provider>
  );
}

export function useI18n() {
  return useContext(Ctx);
}

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="flex items-center gap-1" aria-label={t("language")}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2 py-1 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${
            lang === l.code ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
