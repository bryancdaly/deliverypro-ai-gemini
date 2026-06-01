# DeliveryPro.AI Security Database

Run `db/schema.sql` first, then `db/seed.sql` against the Vercel Postgres/Neon database configured by `POSTGRES_URL` or `DATABASE_URL`.

The first production administrator is resolved by `INITIAL_ADMIN_EMAIL` until a matching `profiles` row and `memberships` grant are created. After seeding, grant that profile the `system-admin` role at `enterprise-global`.

The current workspace still loads the legacy portfolio UI inside the authenticated Next shell. Portfolio tables are represented by `portfolio_snapshots` for the first migration step; the next step is splitting the snapshot into first-class strategy, benefit, project, task, resource, RAID, scenario, and Copilot proposal tables.
