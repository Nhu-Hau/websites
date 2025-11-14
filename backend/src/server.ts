//backend/src/server.ts
import dotenv from "dotenv";
dotenv.config();

import { createServer } from "./app";
import { setupSocketIO } from "./shared/services/socket.service";
import { startCronJobs } from "./shared/services/cron.service";
import { Server as HTTPServer } from "http";


const PORT = process.env.PORT || 4000;

createServer()
  .then((app) => {
    const server = new HTTPServer(app);
    
    // Setup Socket.IO
    const io = setupSocketIO(server);
    
    // Make io available globally
    (global as any).io = io;
    
    // Start cron jobs
    startCronJobs();
    
    server.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
      console.log(`Socket.IO server ready`);
      console.log(`Cron jobs started`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
  
);
