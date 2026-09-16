import { describe, expect, it, afterAll, beforeAll } from "vitest";
import http from "node:http";
import { createServer } from "./server.ts";

describe("apps/server integration", () => {
  let httpServer: http.Server;
  let port: number;

  beforeAll(async () => {
    const server = createServer();
    httpServer = server.httpServer;
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        if (addr && typeof addr !== "string") {
          port = addr.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  it("serves healthcheck endpoint", async () => {
    const res = await fetch(`http://localhost:${port}/health`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.status).toBe("ok");
    expect(data.protocolVersion).toBe(1);
  });

  it("serves api info endpoint with Aros IT-Partner branding", async () => {
    const res = await fetch(`http://localhost:${port}/api/info`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.company).toBe("Aros IT-Partner");
  });
});
