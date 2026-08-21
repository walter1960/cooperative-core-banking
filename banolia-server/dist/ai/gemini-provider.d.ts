/**
 * Google Gemini Multimodal AI Provider & High-Speed Offline Fallback Pipeline
 * Integrates Google Generative AI API with deterministic LocalAiEmulator
 */
import { FinancialQueryRequest, FinancialQueryResponse, MemberRecord, VoiceParseRequest, VoiceParseResponse } from './types';
export interface IGeminiProvider {
    parseVoiceOrder(request: VoiceParseRequest, memberDb: MemberRecord[]): Promise<VoiceParseResponse>;
    analyzeFinancialQuery(request: FinancialQueryRequest): Promise<FinancialQueryResponse>;
    isOnline(): boolean;
    healthCheck(): Promise<{
        status: string;
        engine: 'gemini-flash' | 'local-emulator';
        latency_ms: number;
    }>;
}
export declare class GeminiVoiceProvider implements IGeminiProvider {
    private apiKey;
    private modelName;
    constructor(apiKey?: string, modelName?: string);
    isOnline(): boolean;
    healthCheck(): Promise<{
        status: string;
        engine: 'gemini-flash' | 'local-emulator';
        latency_ms: number;
    }>;
    /**
     * Parses voice transcript or audio into a structured cashier order.
     * If Gemini API is available and online, attempts multimodal inference;
     * otherwise immediately routes through LocalAiEmulator.
     */
    parseVoiceOrder(request: VoiceParseRequest, memberDb: MemberRecord[]): Promise<VoiceParseResponse>;
    /**
     * Deterministic LocalAiEmulator: High-speed, rule-based NLP extraction (<10ms).
     */
    private localParseVoiceOrder;
    /**
     * Online inference using Gemini API Flash model.
     */
    private onlineParseVoiceOrder;
    /**
     * Analyzes financial ratio inquiry using deterministic financial engine.
     */
    analyzeFinancialQuery(request: FinancialQueryRequest): Promise<FinancialQueryResponse>;
}
