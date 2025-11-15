// схема на будущее, когда буду реализовывать хранение статистики
package db

const SchemaSQL = `
CREATE TABLE IF NOT EXISTS spikes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    detected_at DATETIME DEFAULT (datetime('now')),
    pid INTEGER NOT NULL,
    name TEXT NOT NULL,
    cpu_percent REAL,
    memory_rss INTEGER,
    memory_vms INTEGER,
    duration_sec INTEGER DEFAULT 0,
    reason TEXT NOT NULL      
);

CREATE INDEX IF NOT EXISTS idx_pid ON spikes(pid);
CREATE INDEX IF NOT EXISTS idx_detected_at ON spikes(detected_at);
CREATE INDEX IF NOT EXISTS idx_reason ON spikes(reason);
`
