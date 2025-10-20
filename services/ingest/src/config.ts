import { promises as fs } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

export interface SourceConfig {
  schedule: string;
  options?: Record<string, unknown>;
  active?: boolean;
  timezone?: string;
}

export async function loadSourceConfig(): Promise<Record<string, SourceConfig>> {
  const override = process.env.SOURCES_CONFIG;
  const searchPaths = [
    ...(override ? [path.resolve(override)] : []),
    path.resolve(process.cwd(), "config", "sources.yml"),
    path.resolve(process.cwd(), "services", "ingest", "config", "sources.yml"),
  ];

  for (const candidate of searchPaths) {
    try {
      const contents = await fs.readFile(candidate, "utf-8");
      const parsed = parse(contents);
      if (!parsed || typeof parsed !== "object") {
        return {};
      }

      if ("sources" in parsed && parsed.sources && typeof parsed.sources === "object") {
        return parsed.sources as Record<string, SourceConfig>;
      }

      return parsed as Record<string, SourceConfig>;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  return {};
}
