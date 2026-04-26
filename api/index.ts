import { readFile } from "node:fs/promises";
import { type IncomingHttpHeaders, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import serverEntry from "../dist/server/index.js";

function contentType(pathname: string): string {
  if (pathname.endsWith(".css")) return "text/css; charset=utf-8";
  if (pathname.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (pathname.endsWith(".json")) return "application/json; charset=utf-8";
  if (pathname.endsWith(".svg")) return "image/svg+xml";
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".ico")) return "image/x-icon";
  return "application/octet-stream";
}

function normalizeHeaders(headers: IncomingHttpHeaders): Record<string, string> {
  const out: Record<string, string> = {};
  Object.entries(headers).forEach(([key, value]) => {
    if (typeof value === "string") out[key] = value;
    else if (Array.isArray(value)) out[key] = value.join(", ");
  });
  return out;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = req.method ?? "GET";
  const host = req.headers.host ?? "localhost";
  const protocol = req.headers["x-forwarded-proto"] ?? "https";
  const url = new URL(req.url ?? "/", `${protocol}://${host}`);
  const normalizedPathname = url.pathname === "/api"
    ? "/"
    : url.pathname.startsWith("/api/")
      ? url.pathname.slice(4)
      : url.pathname;

  // Serve Vite client assets generated in dist/client/assets.
  if (normalizedPathname.startsWith("/assets/")) {
    const relativeAssetPath = normalizedPathname.slice(1);
    const runtimeDir = dirname(fileURLToPath(import.meta.url));
    const candidatePaths = [
      resolve(process.cwd(), "dist", "client", relativeAssetPath),
      resolve(runtimeDir, "..", "dist", "client", relativeAssetPath),
      resolve(runtimeDir, "..", "..", "dist", "client", relativeAssetPath),
      resolve("/var/task", "dist", "client", relativeAssetPath),
    ];
    try {
      for (const filePath of candidatePaths) {
        try {
          const body = await readFile(filePath);
          res.statusCode = 200;
          res.setHeader("Content-Type", contentType(normalizedPathname));
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          res.end(body);
          return;
        } catch {
          // Try next candidate path.
        }
      }
      res.statusCode = 404;
      res.end("Not found");
      return;
    } catch {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
  }

  const requestUrl = new URL(url.toString());
  requestUrl.pathname = normalizedPathname;
  const request = new Request(requestUrl, {
    method,
    headers: normalizeHeaders(req.headers),
    body: method === "GET" || method === "HEAD" ? undefined : req,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
  const response = await serverEntry.fetch(request);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}
