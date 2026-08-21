"use strict";
/**
 * REST API Endpoints for AI Voice Assistant & Financial Ratio Analyzer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const express_1 = require("express");
const cashier_parser_1 = require("../ai/cashier-parser");
const financial_analyzer_1 = require("../ai/financial-analyzer");
const gemini_provider_1 = require("../ai/gemini-provider");
exports.aiRouter = (0, express_1.Router)();
const cashierService = new cashier_parser_1.CashierParserService();
const geminiProvider = new gemini_provider_1.GeminiVoiceProvider();
/**
 * POST /api/ai/parse-order (and /api/v1/ai/voice-parse)
 * Parses voice order into structured transaction JSON.
 */
exports.aiRouter.post(['/parse-order', '/voice-parse', '/process-command'], async (req, res) => {
    const startTime = Date.now();
    try {
        const parseReq = {
            transcript: req.body.transcript,
            audio_base64: req.body.audio_base64,
            audio_mime_type: req.body.audio_mime_type,
            language: req.body.language || req.body.dialect || 'auto',
            dialect: req.body.dialect || req.body.language || 'auto',
            cashier_id: req.body.cashier_id,
            cashier_context: req.body.cashier_context || {
                agency_code: req.body.agency_code || 'A02',
                cashier_id: req.body.cashier_id || 'MINDIZINA TOMROM',
                offline_mode: req.body.offline_mode || false
            }
        };
        if (!parseReq.transcript && !parseReq.audio_base64) {
            res.status(400).json({
                success: false,
                error: 'Missing required field: either "transcript" or "audio_base64" must be provided.',
                latency_ms: Date.now() - startTime
            });
            return;
        }
        const result = await cashierService.parseCashierOrder(parseReq);
        res.setHeader('X-Response-Time-Ms', result.latency_ms.toString());
        res.status(200).json(result);
    }
    catch (err) {
        console.error('[AI Router] Error parsing voice order:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Internal error in Voice AI parser',
            latency_ms: Date.now() - startTime
        });
    }
});
/**
 * POST /api/ai/financial-query (and /api/v1/ai/financial-query, /api/v1/compliance/prudential-ratios)
 * Analyzes executive queries on BCEAO prudential ratios.
 */
exports.aiRouter.post(['/financial-query', '/prudential-ratios', '/ratios'], async (req, res) => {
    const startTime = Date.now();
    try {
        const queryReq = {
            query: req.body.query || '',
            language: req.body.language || 'fr-FR',
            agency_code: req.body.agency_code,
            portfolio_context: req.body.portfolio_context
        };
        const result = (0, financial_analyzer_1.processFinancialQuery)(queryReq);
        res.setHeader('X-Response-Time-Ms', result.latency_ms.toString());
        res.status(200).json(result);
    }
    catch (err) {
        console.error('[AI Router] Error processing financial query:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Internal error in Financial Ratio Analyzer',
            latency_ms: Date.now() - startTime
        });
    }
});
/**
 * GET /api/ai/health
 * Health check endpoint for AI subsystem.
 */
exports.aiRouter.get('/health', async (_req, res) => {
    const health = await geminiProvider.healthCheck();
    res.status(200).json({
        service: 'banolia-ai-assistant',
        ...health,
        timestamp: new Date().toISOString()
    });
});
