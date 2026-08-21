/**
 * Multilingual NLP Engine & Dialect Lexicon (French, Éwé, Mina)
 * Including TogoPhonex Phonetic Encoder, Compound Number Evaluator, and Entity Matcher
 */
import { AccountType, MemberMatch, MemberRecord, OperationIntent, SupportedLocale } from './types';
export declare function normalizeGbeText(input: string): string;
/**
 * TogoPhonex: Gbe/Togolese specialized phonetic key encoder.
 * Normalizes West African patronyms (MILDZINA, AGBODJAN, AMOUZOU) and day-names (Koffi, Kokou, Ablavi, Kodjo).
 */
export declare function encodeTogoPhonex(name: string): string;
export declare function weightedLevenshteinDistance(s1: string, s2: string): number;
export declare function similarityScore(s1: string, s2: string): number;
export declare function tokenJaccardSimilarity(s1: string, s2: string): number;
export declare function resolveMemberFromText(text: string, members: MemberRecord[]): {
    member: MemberRecord | null;
    confidence: number;
    candidates: MemberMatch[];
};
export declare function extractAmountFromText(text: string): {
    amount: number | null;
    spoken_words: string | null;
    confidence: number;
};
export declare function extractIntentFromText(text: string): OperationIntent;
export declare function extractAccountTypeFromText(text: string): AccountType;
export declare function detectLanguage(text: string): 'fr-FR' | 'ee-TG' | 'gej-TG' | 'mixed';
export declare function generateLocalizedFeedback(intent: OperationIntent, amount: number | null, memberName: string | null, locale: SupportedLocale): {
    locale: 'fr-FR' | 'ee-TG' | 'gej-TG';
    text_to_speak: string;
};
