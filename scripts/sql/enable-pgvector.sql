-- Enable pgvector on the database used by CairoCore (run once).
-- Requires a role with CREATE privilege on the database (often superuser).
CREATE EXTENSION IF NOT EXISTS vector;
