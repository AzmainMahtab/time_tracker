-- Enable extension for EXCLUDE constraints with non-range types (user_id)
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS app_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    app_name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
   
    -- Constrain for no overlaping usage for the same user
    CONSTRAINT no_overlapping_usage EXCLUDE USING gist (
        user_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    )
);

-- Index for Report APIs 
CREATE INDEX idx_usage_report_lookup ON app_usage (user_id, start_time DESC);
