/**
 * Voice Cashier Order Parser Service
 * Orchestrates voice-to-JSON parsing, entity resolution, and latency management (<2000ms)
 */
import { IGeminiProvider } from './gemini-provider';
import { MemberRecord, VoiceParseRequest, VoiceParseResponse } from './types';
export declare const SEED_MEMBERS: MemberRecord[];
export declare class CashierParserService {
    private aiProvider;
    private members;
    constructor(aiProvider?: IGeminiProvider, initialMembers?: MemberRecord[]);
    setMembers(members: MemberRecord[]): void;
    addMember(member: MemberRecord): void;
    getMembers(): MemberRecord[];
    /**
     * Parses cashier voice command into structured transaction data.
     * Latency target: Strictly < 2000ms.
     */
    parseCashierOrder(request: VoiceParseRequest): Promise<VoiceParseResponse>;
    private decodeAudioPlaceholder;
}
