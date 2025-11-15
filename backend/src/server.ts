//backend/src/server.ts
import dotenv from "dotenv";
import path from "path";

// Load .env file from project root (backend directory)
// Try both __dirname (compiled) and process.cwd() (development) to find .env
const envPath = path.resolve(__dirname, "../.env");
const result = dotenv.config({ path: envPath });

// If not found, try process.cwd() as fallback
if (result.error || !process.env.GROQ_API_KEY) {
  const fallbackPath = path.resolve(process.cwd(), ".env");
  dotenv.config({ path: fallbackPath });
}

// Verify GROQ_API_KEY is loaded
if (!process.env.GROQ_API_KEY) {
  console.warn("⚠️  Warning: GROQ_API_KEY is not set in environment variables");
  console.warn(`   Tried .env at: ${envPath}`);
  console.warn(`   Also tried: ${path.resolve(process.cwd(), ".env")}`);
  if (result.error) {
    console.warn(`   Error loading .env: ${result.error.message}`);
  }
} else {
  console.log("✅ GROQ_API_KEY loaded successfully");
}

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
