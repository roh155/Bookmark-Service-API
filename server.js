const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const bookmarks = new Map();

function validateBookmarkInput(req, res, next) {
  const { url } = req.body || {};

  if (url === undefined || url === null) {
    return res.status(400).json({ error: "Field 'url' is required" });
  }

  if (typeof url !== 'string') {
    return res.status(400).json({ error: "Field 'url' must be a string" });
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return res.status(400).json({ error: "Field 'url' cannot be empty" });
  }

  if (Buffer.byteLength(trimmed, 'utf8') > 2048) {
    return res.status(400).json({ error: "Field 'url' exceeds maximum length of 2KB" });
  }

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: "Field 'url' must use http or https protocol" });
    }
    req.normalizedUrl = parsed.href;
    next();
  } catch {
    return res.status(400).json({ error: "Field 'url' is not a valid URL format" });
  }
}

app.post('/bookmarks', validateBookmarkInput, (req, res) => {
  for (const item of bookmarks.values()) {
    if (item.url === req.normalizedUrl) {
      return res.status(200).json(item);
    }
  }

  const newBookmark = {
    id: crypto.randomUUID(),
    url: req.normalizedUrl,
    createdAt: new Date().toISOString()
  };

  bookmarks.set(newBookmark.id, newBookmark);
  return res.status(201).json(newBookmark);
});

app.get('/bookmarks', (req, res) => {
  res.status(200).json(Array.from(bookmarks.values()));
});

app.get('/bookmarks/:id', (req, res) => {
  const item = bookmarks.get(req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Bookmark not found" });
  }
  res.status(200).json(item);
});

app.delete('/bookmarks/:id', (req, res) => {
  if (!bookmarks.has(req.params.id)) {
    return res.status(404).json({ error: "Bookmark not found" });
  }
  bookmarks.delete(req.params.id);
  res.status(204).send();
});

app.use((err, req, res, next) => {
  res.status(400).json({ error: "Malformed request payload" });
});

app.listen(3000, () => console.log('Bookmark API running on port 3000'));