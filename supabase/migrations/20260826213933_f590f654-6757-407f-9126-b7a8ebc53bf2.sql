CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(auth.jwt() ->> 'email', '') = 'olepoetter@gmx.de';
$$;

CREATE TABLE public.artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.artists TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artists TO authenticated;
GRANT ALL ON public.artists TO service_role;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artists_public_read" ON public.artists FOR SELECT USING (true);
CREATE POLICY "artists_admin_write" ON public.artists FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL DEFAULT '',
  audio_url text NOT NULL,
  cover_url text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tracks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracks TO authenticated;
GRANT ALL ON public.tracks TO service_role;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tracks_public_read" ON public.tracks FOR SELECT USING (true);
CREATE POLICY "tracks_admin_write" ON public.tracks FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.donation_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  btc_address text,
  eth_address text,
  paypal text,
  iban text,
  recipient text,
  note text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.donation_info TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donation_info TO authenticated;
GRANT ALL ON public.donation_info TO service_role;
ALTER TABLE public.donation_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donation_public_read" ON public.donation_info FOR SELECT USING (true);
CREATE POLICY "donation_admin_write" ON public.donation_info FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.donation_info (recipient, note)
VALUES ('WLP International', 'Unterstütze CLOUD FM und bleib Teil der Musik.');

CREATE POLICY "media_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "media_admin_write" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'media' AND public.is_admin()) WITH CHECK (bucket_id = 'media' AND public.is_admin());