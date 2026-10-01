/**
 * Voice Cashier Order Parser Service
 * Orchestrates voice-to-JSON parsing, entity resolution, and latency management (<2000ms)
 */

import { GeminiVoiceProvider, IGeminiProvider } from './gemini-provider';
import { MemberRecord, VoiceParseRequest, VoiceParseResponse } from './types';

export const SEED_MEMBERS: MemberRecord[] = [
  {
    code: '130049',
    manualNumber: '130049',
    fullName: 'MILDZINA Tomrom',
    phone: '22262101',
    accounts: [
      {
        accountNumber: '2512110013004901',
        productName: 'EPARGNE ORDINAIRE (001)',
        type: 'SAVINGS',
        balance: 280424
      },
      {
        accountNumber: '2041211013004901',
        productName: 'CREDIT AU PERSONNEL (002)',
        type: 'LOAN',
        balance: 5257109
      },
      {
        accountNumber: '2533101013004901',
        productName: 'EPARGNE REMBOURSEMENT CREDIT / PLAN (003)',
        type: 'CAREER_PLAN',
        balance: 125839
      },
      {
        accountNumber: '2533102013004901',
        productName: 'PLAN EPARGNE PROJET PLUS (004)',
        type: 'PROJECT_PLAN',
        balance: 0
      }
    ]
  },
  {
    code: '130050',
    manualNumber: '130050',
    fullName: 'AGBODJAN Koffi Mensah',
    phone: '90123456',
    accounts: [
      {
        accountNumber: '2512110013005001',
        productName: 'EPARGNE ORDINAIRE (001)',
        type: 'SAVINGS',
        balance: 150000
      },
      {
        accountNumber: '2011000013005001',
        productName: 'CREDIT COURT TERME (001)',
        type: 'LOAN',
        balance: 450000
      }
    ]
  },
  {
    code: '130051',
    manualNumber: '130051',
    fullName: 'AMOUZOU Ablavi',
    phone: '98765432',
    accounts: [
      {
        accountNumber: '2512110013005101',
        productName: 'EPARGNE ORDINAIRE (001)',
        type: 'SAVINGS',
        balance: 85000
      },
      {
        accountNumber: '2580000013005101',
        productName: 'COMPTE TONTINE JOURNALIERE (005)',
        type: 'TONTINE',
        balance: 31000
      }
    ]
  }
];

export class CashierParserService {
  private aiProvider: IGeminiProvider;
  private members: MemberRecord[];

  constructor(aiProvider?: IGeminiProvider, initialMembers: MemberRecord[] = SEED_MEMBERS) {
    this.aiProvider = aiProvider || new GeminiVoiceProvider();
    this.members = [...initialMembers];
  }

  public setMembers(members: MemberRecord[]): void {
    this.members = [...members];
  }

  public addMember(member: MemberRecord): void {
    this.members.push(member);
  }

  public getMembers(): MemberRecord[] {
    return this.members;
  }

  /**
   * Parses cashier voice command into structured transaction data.
   * Latency target: Strictly < 2000ms.
   */
  public async parseCashierOrder(request: VoiceParseRequest): Promise<VoiceParseResponse> {
    const startTime = Date.now();

    // If audio_base64 is provided without transcript, decode or transcribe
    if (request.audio_base64 && !request.transcript) {
      request.transcript = this.decodeAudioPlaceholder(request.audio_base64);
    }

    const response = await this.aiProvider.parseVoiceOrder(request, this.members);

    // Enforce total latency measurement
    response.latency_ms = Date.now() - startTime;

    return response;
  }

  private decodeAudioPlaceholder(base64Audio: string): string {
    // In local mode / test environments without active STT streaming, extracts embedded metadata if present
    if (base64Audio.startsWith('data:audio/text;')) {
      try {
        const decoded = Buffer.from(base64Audio.split(',')[1], 'base64').toString('utf-8');
        return decoded;
      } catch {
        return '';
      }
    }
    return '';
  }
}
