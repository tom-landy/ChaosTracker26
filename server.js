/*
 * Minimal zero-dependency static file server.
 *
 * You normally DON'T need this: deploy ChaosTracker26 as a Render *Static Site*
 * (no start command). This exists only so the app also works if it's deployed as
 * a Render *Web Service*, where a start command is required:
 *     Start Command:  node server.js
 * It serves the files in this folder and honours Render's $PORT.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch (e) {
    urlPath = "/";
  }
  if (urlPath === "/") urlPath = "/index.html";

  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Fall back to index.html so the single-page app always loads.
      return fs.readFile(path.join(ROOT, "index.html"), (e2, d2) => {
        if (e2) {
          res.writeHead(404);
          return res.end("Not found");
        }
        res.writeHead(200, { "Content-Type": TYPES[".html"] });
        res.end(d2);
      });
    }
    const ext = path.extname(filePath).toLowerCase();
    const headers = { "Content-Type": TYPES[ext] || "application/octet-stream" };
    if (filePath.endsWith("service-worker.js")) {
      headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    }
    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, () => console.log("ChaosTracker26 listening on port " + PORT));
