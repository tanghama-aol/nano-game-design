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
import { generatePromptsRouter } from './routes/generate-prompts';
import { projectsRouter } from './routes/projects';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const httpServer = createServer(app);

// Setup Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: '*', // For local dev, allow all
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api/settings', settingsRouter);
app.use('/api/generate-tree', generateTreeRouter);
app.use('/api/generate-prompts', generatePromptsRouter);
app.use('/api/projects', projectsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Nano Game Generator API is running' });
});

// Init Queue with Concurrency from Settings
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
