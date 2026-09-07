import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "olepoetter@gmx.de";

type Input = {
  title: string;
  kind: string;
  description?: string;
  tone: string;
  lang: string;
  length: string;
  instructions?: string;
  botName: string;
};

export const generateReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Input) => data)
  .handler(async ({ data, context }) => {
    const email = (context.claims as { email?: string } | null)?.email;
    if (email !== ADMIN_EMAIL) throw new Error("Forbidden");

    const langName = data.lang === "en" ? "English" : data.lang === "ru" ? "Russian" : "German";
    const lengthHint =
      data.length === "lang" ? "4-6 sentences" : data.length === "mittel" ? "2-3 sentences" : "1-2 sentences";

    const prompt = [
      `Write a review of the ${data.kind === "app" ? "app" : "game"} "${data.title}".`,
      data.description ? `Context: ${data.description}` : "",
      `Language: ${langName}. Tone/style: ${data.tone}. Length: ${lengthHint}.`,
      data.instructions ? `Extra instructions: ${data.instructions}` : "",
      `You are "${data.botName}", the in-house reviewer of the CLOUD FM gaming section.`,
      `Reply with the review text only, plus a final line "RATING: X.X" with a score from 0 to 10.`,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (res.status === 429) return { ok: false as const, error: "Rate limit erreicht, bitte kurz warten." };
    if (res.status === 402) return { ok: false as const, error: "AI-Guthaben aufgebraucht." };
    if (!res.ok) return { ok: false as const, error: `AI-Fehler (${res.status})` };

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content?.trim() ?? "";
    const match = raw.match(/RATING:\s*([0-9]+(?:\.[0-9])?)/i);
    const rating = match ? Number(match[1]) : null;
    const body = raw.replace(/RATING:\s*[0-9]+(?:\.[0-9])?/i, "").trim();

    return { ok: true as const, body, rating };
  });
