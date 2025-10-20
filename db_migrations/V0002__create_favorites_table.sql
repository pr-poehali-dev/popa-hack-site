CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  file_id INTEGER REFERENCES files(id),
  username VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_favorites_username ON favorites(username);
CREATE INDEX idx_favorites_file_id ON favorites(file_id);