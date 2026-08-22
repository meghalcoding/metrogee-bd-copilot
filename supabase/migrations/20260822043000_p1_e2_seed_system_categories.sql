insert into public.business_categories (organization_id, name, slug, is_system, is_active)
values
  (null, 'Restaurant & Cafe', 'restaurant-cafe', true, true),
  (null, 'Retail Store', 'retail-store', true, true),
  (null, 'Salon & Beauty', 'salon-beauty', true, true),
  (null, 'Healthcare & Wellness', 'healthcare-wellness', true, true),
  (null, 'Professional Services', 'professional-services', true, true),
  (null, 'Home & Local Services', 'home-local-services', true, true),
  (null, 'Automotive', 'automotive', true, true),
  (null, 'Education & Coaching', 'education-coaching', true, true),
  (null, 'Hospitality & Travel', 'hospitality-travel', true, true),
  (null, 'Fitness & Sports', 'fitness-sports', true, true),
  (null, 'Real Estate', 'real-estate', true, true),
  (null, 'Other Local Business', 'other-local-business', true, true)
on conflict do nothing;
