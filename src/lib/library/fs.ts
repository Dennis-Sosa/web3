import fs from "node:fs/promises";
import path from "node:path";

export async function listFilesRecursive(rootDir: string): Promise<string[]> {
  const out: string[] = [];

  async function walk(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const ent of entries) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          await walk(p);
        } else if (ent.isFile()) {
          out.push(p);
        }
      }
    } catch {
      return;
    }
  }

  await walk(rootDir);
  return out;
}

export function toPosixPath(p: string) {
  return p.split(path.sep).join("/");
}

export function encodePathForUrl(posixPath: string) {
  return posixPath
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

