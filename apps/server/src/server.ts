import http from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { MatchRoom } from "./rooms/MatchRoom.ts";

export function createServer(): {
  app: express.Express;
  httpServer: http.Server;
  gameServer: Server;
} {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", protocolVersion: 1 });
  });

  app.get("/api/info", (_req, res) => {
    res.json({
      name: "AIP Ultimate Fighter Server",
      company: "Aros IT-Partner",
      status: "running",
    });
  });

  const httpServer = http.createServer(app);

  const gameServer = new Server({
    transport: new WebSocketTransport({
      server: httpServer,
    }),
  });

  gameServer.define("match", MatchRoom);

  return { app, httpServer, gameServer };
}
