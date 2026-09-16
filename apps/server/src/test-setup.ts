// Prevent axm/pm2 from sending messages over process.send during vitest
const originalSend = process.send;
if (typeof originalSend === "function") {
  process.send = function (message: any, ...args: any[]) {
    if (message && typeof message === "object" && message.type?.startsWith("axm:")) {
      return true;
    }
    return (originalSend as any).call(process, message, ...args);
  } as any;
}
