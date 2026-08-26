import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>();

/** Erzeugt eine signierte URL für eine Datei im "media"-Bucket. */
export async function getMediaUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const cached = cache.get(path);
  if (cached) return cached;
  const { data, error } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24);
  if (error || !data?.signedUrl) return null;
  cache.set(path, data.signedUrl);
  return data.signedUrl;
}

export async function uploadMedia(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}
