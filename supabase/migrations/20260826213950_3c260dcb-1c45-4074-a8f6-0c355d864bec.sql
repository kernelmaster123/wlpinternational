DROP POLICY "artists_admin_write" ON public.artists;
DROP POLICY "tracks_admin_write" ON public.tracks;
DROP POLICY "donation_admin_write" ON public.donation_info;
DROP POLICY "media_admin_write" ON storage.objects;
DROP FUNCTION IF EXISTS public.is_admin();

CREATE POLICY "artists_admin_write" ON public.artists FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'olepoetter@gmx.de')
  WITH CHECK ((auth.jwt() ->> 'email') = 'olepoetter@gmx.de');

CREATE POLICY "tracks_admin_write" ON public.tracks FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'olepoetter@gmx.de')
  WITH CHECK ((auth.jwt() ->> 'email') = 'olepoetter@gmx.de');

CREATE POLICY "donation_admin_write" ON public.donation_info FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'olepoetter@gmx.de')
  WITH CHECK ((auth.jwt() ->> 'email') = 'olepoetter@gmx.de');

CREATE POLICY "media_admin_write" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'media' AND (auth.jwt() ->> 'email') = 'olepoetter@gmx.de')
  WITH CHECK (bucket_id = 'media' AND (auth.jwt() ->> 'email') = 'olepoetter@gmx.de');