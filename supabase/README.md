# MongoDB to Supabase migration

1. Create a Supabase project and copy the database connection string, project URL, and service-role key to `.env.local` using `.env.example` as the template.
2. In the Supabase SQL Editor, run `migrations/001_school_data.sql`.
3. Run `npm run db:migrate-mongo`. The importer is safe to rerun: it preserves each MongoDB `_id` as the Postgres text `id`, upserts rows, and replaces storage files using the same paths.
4. Verify record counts and sample files in Supabase, then run `npm run db:create-admin` only if the MongoDB admin was not imported.
5. Keep MongoDB available until the public site and admin workflows have been checked against Supabase. Then remove `MONGODB_URI` and the Mongo dependencies.

The migration covers `admins`, notices, book lists, events, results, import drafts, gallery metadata and GridFS images, staff records and photos, mandatory disclosures, PDFs, and disclosure-page content.

`SUPABASE_SERVICE_ROLE_KEY` is used only by the one-time migration process. Never expose it to the browser or commit it.
