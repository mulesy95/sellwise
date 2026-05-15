ALTER TABLE public.shops
  ADD CONSTRAINT shops_user_id_platform_shop_id_key UNIQUE (user_id, platform, shop_id);
