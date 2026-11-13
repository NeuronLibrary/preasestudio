DROP POLICY IF EXISTS pv_read ON public.product_variants;
CREATE POLICY pv_read ON public.product_variants FOR SELECT TO public
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variants.product_id AND (p.is_active OR public.is_admin())));

DROP POLICY IF EXISTS pi_read ON public.product_images;
CREATE POLICY pi_read ON public.product_images FOR SELECT TO public
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_images.product_id AND (p.is_active OR public.is_admin())));

DROP POLICY IF EXISTS pc_read ON public.product_categories;
CREATE POLICY pc_read ON public.product_categories FOR SELECT TO public
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_categories.product_id AND (p.is_active OR public.is_admin())));