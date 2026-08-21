/**
 * Client Voice AI Service Helper
 * Handles Web Audio / SpeechRecognition, API communication with Banolia Server,
 * and text-to-speech feedback playback.
 */

export interface VoiceActionResult {
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'LOAN_REPAYMENT' | 'TONTINE_COLLECTION' | 'VIEW_MEMBER' | 'UNKNOWN';
  memberCode?: string;
  memberName?: string;
  amount?: number;
  currency?: string;
  accountType?: string;
  rawIntent?: string;
  spokenFeedback?: string;
  latencyMs?: number;
}

export class VoiceClientService {
  private serverBaseUrl: string;

  constructor(serverBaseUrl: string = 'http://localhost:3000') {
    this.serverBaseUrl = serverBaseUrl;
  }

  public isSpeechSupported(): boolean {
    return typeof window !== 'undefined' &&
      Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public async parseVoiceOrder(transcript: string, locale: string = 'auto'): Promise<VoiceActionResult> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${this.serverBaseUrl}/api/ai/parse-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          language: locale,
          cashier_context: {
            agency_code: 'A02',
            cashier_id: 'MINDIZINA TOMROM',
            offline_mode: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const extracted = data.extracted_data || {};

      let actionType: VoiceActionResult['type'] = 'UNKNOWN';
      if (data.intent === 'CASH_DEPOSIT') actionType = 'DEPOSIT';
      else if (data.intent === 'CASH_WITHDRAWAL') actionType = 'WITHDRAWAL';
      else if (data.intent === 'LOAN_REPAYMENT') actionType = 'LOAN_REPAYMENT';
      else if (data.intent === 'TONTINE_COLLECTION') actionType = 'TONTINE_COLLECTION';
      else if (data.intent === 'BALANCE_INQUIRY') actionType = 'VIEW_MEMBER';

      return {
        type: actionType,
        memberCode: extracted.member_code || undefined,
        memberName: extracted.member_name || undefined,
        amount: extracted.amount || undefined,
        currency: extracted.currency || 'XOF',
        accountType: extracted.account_type || undefined,
        rawIntent: data.intent,
        spokenFeedback: data.spoken_feedback?.text_to_speak,
        latencyMs: data.latency_ms || (Date.now() - startTime)
      };
    } catch (err) {
      console.warn('[VoiceClient] Server parsing failed, falling back to local heuristic:', err);
      return this.localFallbackParse(transcript);
    }
  }

  public speak(text: string, locale: string = 'fr-FR'): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale.startsWith('ee') || locale.startsWith('gej') ? 'fr-FR' : locale;
      window.speechSynthesis.speak(utterance);
    }
  }

  private localFallbackParse(transcript: string): VoiceActionResult {
    const lower = transcript.toLowerCase();
    let amount: number | undefined;

    if (lower.includes('cinquante mille') || lower.includes('50 000')) amount = 50000;
    else if (lower.includes('cent mille') || lower.includes('100 000') || lower.includes('un sac')) amount = 100000;
    else if (lower.includes('vingt mille') || lower.includes('20 000') || lower.includes('akpe blaeve')) amount = 20000;
    else if (lower.includes('dix mille') || lower.includes('10 000')) amount = 10000;
    else if (lower.includes('deux sacs') || lower.includes('2 sacs')) amount = 200000;

    let type: VoiceActionResult['type'] = 'UNKNOWN';
    if (lower.includes('versement') || lower.includes('dépôt') || lower.includes('depot') || lower.includes('ga dodo')) {
      type = 'DEPOSIT';
    } else if (lower.includes('retrait') || lower.includes('ga ɖeɖe') || lower.includes('ga dede')) {
      type = 'WITHDRAWAL';
    } else if (lower.includes('remboursement') || lower.includes('fe ququ')) {
      type = 'LOAN_REPAYMENT';
    } else if (lower.includes('tontine') || lower.includes('asusu')) {
      type = 'TONTINE_COLLECTION';
    } else if (lower.includes('solde') || lower.includes('situation')) {
      type = 'VIEW_MEMBER';
    }

    return {
      type,
      amount,
      currency: 'XOF',
      rawIntent: type,
      spokenFeedback: `Opération ${type} détectée localement.`
    };
  }
}

export const voiceClient = new VoiceClientService();
