import { createServer } from "./server.ts";

const PORT = Number(process.env["PORT"] ?? 2567);
const { httpServer } = createServer();

httpServer.listen(PORT, () => {
  console.log(`[AIP Ultimate Fighter Server] Running on http://localhost:${PORT}`);
  console.log(`[Colyseus WebSocket] ws://localhost:${PORT}`);
});
