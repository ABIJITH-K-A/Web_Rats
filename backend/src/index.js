import { createServer } from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { initDB } from './config/db.js';

const server = createServer(app);

const startServer = async () => {
  try {
    // Initialize Databases (PostgreSQL financial system)
    await initDB();

    server.listen(env.port, () => {
      console.log(`TN WEB RATS backend listening on port ${env.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
