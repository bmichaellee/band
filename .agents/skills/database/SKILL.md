---
name: database
description: Use when changing the database schema, adding or changing queries, or running migrations.
---

# Database

- **Queries are plain async functions** in the db package that take the `Db` client first (`insertUser(db, user)`) and never import a client themselves. The API owns one client and passes it in; tests pass a fake.
- **Tables live one per file** in the db package's schema folder, exported through its barrel. Type branded ids with `$type<UserId>()`, so rows carry the same id types as the shared shapes.
- **Migrations are generated, never hand-edited:** change the schema, then run `bun run generate` and `bun run migrate` in the db package folder (the config's paths are relative to it). Commit the generated files, including `drizzle/meta/`.
- **Every database needs the migration:** apply it to each database the code runs against, and check how production gets migrations before shipping a schema change.
