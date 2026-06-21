import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { prisma } from '@nano-game/database';
import { initQueue } from './services/queue';

import { settingsRouter } from './routes/settings';
import { generateTreeRouter } from './routes/generate-tree';
import { generateDesignPackageRouter } from './routes/generate-design-package';
import { generatePromptsRouter } from './routes/generate-prompts';
import { reskinGameRouter } from './routes/reskin-game';
import { projectsRouter } from './routes/projects';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const httpServer = createServer(app);

// Express handles HTTP routes. Socket.IO is attached to the same HTTP server so
// long-running generation jobs can push progress back to the browser.
const io = new Server(httpServer, {
  cors: {
    origin: '*', // For local dev, allow all
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(helmet());
// express.json() parses JSON request bodies before route handlers read req.body.
app.use(express.json());

// Each router owns one feature area; the API surface stays readable because the
// framework entrypoint only wires middleware and URL prefixes.
app.use('/api/settings', settingsRouter);
app.use('/api/generate-tree', generateTreeRouter);
app.use('/api/generate-design-package', generateDesignPackageRouter);
app.use('/api/generate-prompts', generatePromptsRouter);
app.use('/api/reskin-game', reskinGameRouter);
app.use('/api/projects', projectsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Nano Game Generator API is running' });
});

// Bootstrap is async because queue concurrency comes from persisted settings.
// Keeping startup here also guarantees Socket.IO is ready before jobs emit.
async function bootstrap() {
  const settings = await prisma.settings.findFirst();
  const concurrency = settings?.maxConcurrency || 3;
  initQueue(concurrency, io);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`[API Server] Running on http://localhost:${port}`);
  });
}

bootstrap().catch(console.error);
