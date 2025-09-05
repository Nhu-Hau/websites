//backend/src/server.ts
import dotenv from "dotenv";
dotenv.config();

import { createServer } from "./app";

const PORT = process.env.PORT || 4000;

createServer()
  .then((app) => {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
