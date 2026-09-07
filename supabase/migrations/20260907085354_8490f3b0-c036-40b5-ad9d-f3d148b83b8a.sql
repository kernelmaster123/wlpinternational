
CREATE TABLE public.game_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  description text,
  image_url text,
  link_url text,
  platform text,
  kind text NOT NULL DEFAULT 'game',
  rating numeric(3,1) NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  top_rank integer,
  likes integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  views integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.game_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_posts TO authenticated;
GRANT ALL ON public.game_posts TO service_role;
ALTER TABLE public.game_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY game_posts_public_read ON public.game_posts FOR SELECT USING (true);
CREATE POLICY game_posts_admin_write ON public.game_posts FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'olepoetter@gmx.de')
  WITH CHECK ((auth.jwt() ->> 'email') = 'olepoetter@gmx.de');

CREATE TABLE public.game_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.game_posts(id) ON DELETE CASCADE,
  author text NOT NULL DEFAULT 'CLOUD BOT',
  body text NOT NULL,
  rating numeric(3,1),
  tone text,
  lang text NOT NULL DEFAULT 'de',
  likes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.game_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_reviews TO authenticated;
GRANT ALL ON public.game_reviews TO service_role;
ALTER TABLE public.game_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY game_reviews_public_read ON public.game_reviews FOR SELECT USING (true);
CREATE POLICY game_reviews_admin_write ON public.game_reviews FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'olepoetter@gmx.de')
  WITH CHECK ((auth.jwt() ->> 'email') = 'olepoetter@gmx.de');

CREATE TABLE public.bot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT true,
  bot_name text NOT NULL DEFAULT 'CLOUD BOT',
  tone text NOT NULL DEFAULT 'street',
  lang text NOT NULL DEFAULT 'de',
  length text NOT NULL DEFAULT 'kurz',
  instructions text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bot_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bot_settings TO authenticated;
GRANT ALL ON public.bot_settings TO service_role;
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY bot_settings_public_read ON public.bot_settings FOR SELECT USING (true);
CREATE POLICY bot_settings_admin_write ON public.bot_settings FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'olepoetter@gmx.de')
  WITH CHECK ((auth.jwt() ->> 'email') = 'olepoetter@gmx.de');

CREATE OR REPLACE FUNCTION public.bump_post_metric(_post_id uuid, _metric text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _metric = 'likes' THEN
    UPDATE public.game_posts SET likes = likes + 1 WHERE id = _post_id;
  ELSIF _metric = 'shares' THEN
    UPDATE public.game_posts SET shares = shares + 1 WHERE id = _post_id;
  ELSIF _metric = 'views' THEN
    UPDATE public.game_posts SET views = views + 1 WHERE id = _post_id;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.bump_post_metric(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.bump_review_likes(_review_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.game_reviews SET likes = likes + 1 WHERE id = _review_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.bump_review_likes(uuid) TO anon, authenticated;

INSERT INTO public.bot_settings (enabled, bot_name, tone, lang, length, instructions)
VALUES (true, 'CLOUD BOT', 'street', 'de', 'kurz', 'Schreibe ehrliche, kurze Rezensionen im Street-Style.');
