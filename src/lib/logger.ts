import path, { join } from "node:path";
import config from "@/config";
import pino from "pino";
import type { PrettyOptions } from "pino-pretty";

function omitKeys(obj: Record<string, unknown>, keys: string[]) {
  for (const key in obj) {
    if (keys.includes(key)) {
      obj[key] = "********";
    }
  }
}

function sanitizeItem(
  item: unknown,
  options?: DeepSanitizeObjectOptions,
): unknown {
  if (typeof item === "string") {
    return `${item.slice(0, 50)}${item.length > 50 ? "..." : ""}`;
  }
  if (Array.isArray(item)) {
    return item.map((i) => sanitizeItem(i, options));
  }
  if (typeof item === "object") {
    return deepSanitizeObject(item as Record<string, unknown>, options);
  }
  return item;
}

interface DeepSanitizeObjectOptions {
  omitKeys?: string[];
}

export function deepSanitizeObject(
  obj: Record<string, unknown>,
  options?: DeepSanitizeObjectOptions,
) {
  const output = structuredClone(obj);
  if (options?.omitKeys) {
    omitKeys(output, options.omitKeys);
  }

  for (const key in output) {
    output[key] = sanitizeItem(output[key], options);
  }

  return output;
}

export const baileysLogger = pino({
  level: "debug",
  transport: {
    targets: [
      {
        level: config.baileys.logLevel,
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
        } as PrettyOptions,
      },
      {
        level: config.baileys.logLevel,
        target: "pino-roll",
        options: {
          file: path.join("logs", "baileys"),
          size: "50m",
          limit: { count: 10 },
        },
      },
    ],
  },
});

let logger = pino({
  level: "debug",
  transport: {
    targets: [
      {
        level: config.logLevel,
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
        } as PrettyOptions,
      },
      {
        level: config.logLevel,
        target: "pino-roll",
        options: {
          file: path.join("logs", "log"),
          size: "50m",
          limit: { count: 10 },
        },
      },
    ],
  },
});

if (config.env === "development") {
  logger = require("pino-caller")(logger, {
    relativeTo: join(__dirname, ".."),
  });
}

// biome-ignore lint/style/noDefaultExport: <explanation>
export default logger;
