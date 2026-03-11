-- Migration: Add item_us_states for US-only region (multiple states per item)
-- Run after countries and items exist.

-- Junction table: which US states an item applies to (only used when item.country_id = US)
CREATE TABLE IF NOT EXISTS item_us_states (
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  state_code VARCHAR(2) NOT NULL,
  PRIMARY KEY (item_id, state_code)
);

CREATE INDEX IF NOT EXISTS idx_item_us_states_item ON item_us_states(item_id);
