"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const database_1 = require("@nano-game/database");
const queue_1 = require("./services/queue");
const settings_1 = require("./routes/settings");
const generate_tree_1 = require("./routes/generate-tree");
const generate_prompts_1 = require("./routes/generate-prompts");
const reskin_game_1 = require("./routes/reskin-game");
const projects_1 = require("./routes/projects");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
const httpServer = (0, http_1.createServer)(app);
// Setup Socket.io
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*', // For local dev, allow all
        methods: ['GET', 'POST']
    }
});
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use('/api/settings', settings_1.settingsRouter);
app.use('/api/generate-tree', generate_tree_1.generateTreeRouter);
app.use('/api/generate-prompts', generate_prompts_1.generatePromptsRouter);
app.use('/api/reskin-game', reskin_game_1.reskinGameRouter);
app.use('/api/projects', projects_1.projectsRouter);
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Nano Game Generator API is running' });
});
// Init Queue with Concurrency from Settings
async function bootstrap() {
    const settings = await database_1.prisma.settings.findFirst();
    const concurrency = settings?.maxConcurrency || 3;
    (0, queue_1.initQueue)(concurrency, io);
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
//# sourceMappingURL=index.js.map