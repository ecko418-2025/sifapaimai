import fs from "node:fs";
import path from "node:path";

export function createLogger(logFile) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });

  function write(level, message, extra) {
    const line = JSON.stringify({
      time: new Date().toISOString(),
      level,
      message,
      ...(extra ? { extra } : {})
    });
    fs.appendFileSync(logFile, `${line}\n`, "utf8");
  }

  return {
    info: (message, extra) => write("info", message, extra),
    warn: (message, extra) => write("warn", message, extra),
    error: (message, extra) => write("error", message, extra)
  };
}
