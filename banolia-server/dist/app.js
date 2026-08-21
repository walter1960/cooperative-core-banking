"use strict";
/**
 * Banolia Server Express Application Setup
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const ai_routes_1 = require("./api/ai.routes");
function createApp() {
    const app = (0, express_1.default)();
    // Security & standard middlewares
    app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
    app.use((0, cors_1.default)());
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Latency tracking middleware
    app.use((req, _res, next) => {
        req._startTime = Date.now();
        next();
    });
    // Base Health Check
    app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'UP', app: 'BANOLIA Core Banking', timestamp: new Date().toISOString() });
    });
    // AI & Voice Assistant Routes
    app.use('/api/ai', ai_routes_1.aiRouter);
    app.use('/api/v1/ai', ai_routes_1.aiRouter);
    app.use('/api/v1/voice', ai_routes_1.aiRouter);
    // Global 404 handler
    app.use((_req, res) => {
        res.status(404).json({ error: 'Endpoint not found' });
    });
    // Global Error Handler
    app.use((err, _req, res, _next) => {
        console.error('[App Error]', err);
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    });
    return app;
}
exports.app = createApp();
