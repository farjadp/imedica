-- Default blog categories. Safe to re-run: existing slugs are left alone,
-- and editors can rename or delete them in the admin afterwards.
INSERT INTO "content"."BlogCategory" ("id", "slug", "name", "description", "sortOrder")
VALUES
  (gen_random_uuid()::text, 'case-breakdowns', 'Case breakdowns', 'One call, decision by decision: what the rules say and why.', 1),
  (gen_random_uuid()::text, 'protocols', 'Protocols & directives', 'Notes on Canadian ALS and BLS directives and what changed.', 2),
  (gen_random_uuid()::text, 'training', 'Training & education', 'For training leads: practice design, debriefs and measuring readiness.', 3),
  (gen_random_uuid()::text, 'privacy-data', 'Privacy & data', 'How training data is handled under PIPEDA and PHIPA.', 4),
  (gen_random_uuid()::text, 'product', 'Product notes', 'What''s new in Imedica.', 5)
ON CONFLICT ("slug") DO NOTHING;
