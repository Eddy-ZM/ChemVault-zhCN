CREATE TABLE IF NOT EXISTS records (
  record_key TEXT PRIMARY KEY,
  id TEXT NOT NULL,
  type TEXT NOT NULL,
  type_label TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  body TEXT,
  domain TEXT,
  family TEXT,
  risk TEXT,
  maturity INTEGER DEFAULT 0,
  formula TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  href TEXT,
  source_href TEXT,
  image_url TEXT,
  raw_json TEXT NOT NULL DEFAULT '{}',
  search_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS records_type_id_idx ON records (type, id);
CREATE INDEX IF NOT EXISTS records_type_idx ON records (type);
CREATE INDEX IF NOT EXISTS records_title_idx ON records (title);
CREATE INDEX IF NOT EXISTS records_search_idx ON records (search_text);
