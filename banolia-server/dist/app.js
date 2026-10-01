"use strict";
/**
 * Banolia Server Express Application Setup
 * Real Persistent Core Banking Backend with SQLite ACID Engine
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
const sqlite_1 = require("./db/sqlite");
const ai_routes_1 = require("./api/ai.routes");
const mobile_routes_1 = require("./api/mobile.routes");
const members_routes_1 = require("./api/members.routes");
const accounts_routes_1 = require("./api/accounts.routes");
const loans_routes_1 = require("./api/loans.routes");
const caisse_routes_1 = require("./api/caisse.routes");
const dashboard_routes_1 = require("./api/dashboard.routes");
function createApp() {
    // Initialisation de la vraie base de données SQLite
    (0, sqlite_1.initializeDatabase)();
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
        res.status(200).json({
            status: 'UP',
            app: 'BANOLIA Core Banking',
            database: 'SQLite Persistent (WAL mode)',
            timestamp: new Date().toISOString()
        });
    });
    // Core Banking REST API Endpoints
    app.use('/api/members', members_routes_1.membersRouter);
    app.use('/api/accounts', accounts_routes_1.accountsRouter);
    app.use('/api/loans', loans_routes_1.loansRouter);
    app.use('/api/caisse', caisse_routes_1.caisseRouter);
    app.use('/api/dashboard', dashboard_routes_1.dashboardRouter);
    // Mobile Inbound Requests Routes
    app.use('/api/mobile', mobile_routes_1.mobileRouter);
    app.use('/api/v1/mobile', mobile_routes_1.mobileRouter);
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
