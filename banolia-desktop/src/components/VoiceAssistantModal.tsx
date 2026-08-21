import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, X, Volume2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Member, Account } from '../types';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  accountsMap: Record<string, Account[]>;
  onExecuteAction: (action: {
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'VIEW_MEMBER';
    memberCode: string;
    amount?: number;
  }) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  members,
  accountsMap,
  onExecuteAction
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [detectedAction, setDetectedAction] = useState<any>(null);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = 'fr-FR';
      rec.interimResults = false;

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        processVoiceCommand(text);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur (utilisez Google Chrome).");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setAiResponse('');
      setDetectedAction(null);
      recognition.start();
      setIsListening(true);
    }
  };

  const processVoiceCommand = (text: string) => {
    const lower = text.toLowerCase();
    
    // Extract numbers (amounts)
    const numbersMatch = lower.match(/\d+/g);
    let amount = numbersMatch ? parseInt(numbersMatch.join(''), 10) : undefined;
    if (lower.includes('cinquante mille')) amount = 50000;
    if (lower.includes('cent mille')) amount = 100000;
    if (lower.includes('vingt mille') || lower.includes('20 mille')) amount = 20000;
    if (lower.includes('dix mille') || lower.includes('10 mille')) amount = 10000;
    if (lower.includes('cinq mille') || lower.includes('5 mille')) amount = 5000;

    // Find member
    const targetMember = members.find(m => 
      lower.includes(m.fullName.toLowerCase().split(' ')[0].toLowerCase()) ||
      lower.includes(m.fullName.toLowerCase()) ||
      lower.includes(m.manualNumber) ||
      lower.includes(m.code.toLowerCase())
    ) || members[0];

    if (lower.includes('versement') || lower.includes('dépôt') || lower.includes('depot') || lower.includes('verser')) {
      const parsed = {
        type: 'DEPOSIT' as const,
        memberCode: targetMember.code,
        memberName: targetMember.fullName,
        amount: amount || 25000
      };
      setDetectedAction(parsed);
      setAiResponse(`J'ai préparé un versement de ${parsed.amount.toLocaleString('fr-FR')} F.CFA pour ${parsed.memberName}.`);
      speak(`Versement de ${parsed.amount.toLocaleString('fr-FR')} francs CFA préparé pour ${parsed.memberName}.`);
    } else if (lower.includes('retrait') || lower.includes('retirer')) {
      const parsed = {
        type: 'WITHDRAWAL' as const,
        memberCode: targetMember.code,
        memberName: targetMember.fullName,
        amount: amount || 10000
      };
      setDetectedAction(parsed);
      setAiResponse(`J'ai préparé un retrait de ${parsed.amount.toLocaleString('fr-FR')} F.CFA pour ${parsed.memberName}.`);
      speak(`Retrait de ${parsed.amount.toLocaleString('fr-FR')} francs CFA préparé pour ${parsed.memberName}.`);
    } else if (lower.includes('solde') || lower.includes('situation') || lower.includes('compte') || lower.includes('fiche')) {
      const parsed = {
        type: 'VIEW_MEMBER' as const,
        memberCode: targetMember.code,
        memberName: targetMember.fullName
      };
      setDetectedAction(parsed);
      setAiResponse(`Affichage de la situation complète de ${parsed.memberName}.`);
      speak(`Affichage de la situation des comptes de ${parsed.memberName}.`);
    } else {
      setAiResponse(`Je n'ai pas bien compris. Essayez : "Versement de 50 000 francs pour Tomrom" ou "Afficher la situation de l'adhérent 610".`);
    }
  };

  const speak = (msg: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.lang = 'fr-FR';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleConfirmAction = () => {
    if (detectedAction) {
      onExecuteAction(detectedAction);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Banolia AI Voice Assistant</h3>
              <p className="text-[11px] text-slate-400">Propulsé par Gemini Multimodal Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Interaction Body */}
        <div className="p-6 text-center space-y-5">
          {/* Big Pulsing Mic Button */}
          <div className="flex justify-center">
            <button
              onClick={toggleListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse ring-8 ring-rose-500/30 shadow-rose-900/50'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/50 hover:scale-105'
              }`}
            >
              {isListening ? <Mic className="w-10 h-10 animate-bounce" /> : <Mic className="w-10 h-10" />}
            </button>
          </div>

          <div className="text-xs text-slate-400">
            {isListening ? (
              <span className="text-rose-400 font-semibold animate-pulse">
                🎙️ À l'écoute... Parlez maintenant (Français ou langues locales)
              </span>
            ) : (
              <span>Cliquez sur le micro pour donner une instruction vocale</span>
            )}
          </div>

          {/* Transcript box */}
          {transcript && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-left">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Vous avez dit :</div>
              <p className="text-sm font-medium text-white italic">"{transcript}"</p>
            </div>
          )}

          {/* AI Response & Action Preview */}
          {aiResponse && (
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3 text-left space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interprétation IA :</span>
              </div>
              <p className="text-xs text-slate-200">{aiResponse}</p>

              {detectedAction && (
                <button
                  onClick={handleConfirmAction}
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                >
                  <span>Exécuter cette opération</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Examples Pills */}
          <div className="pt-2">
            <div className="text-[11px] text-slate-400 mb-2">Exemples de commandes à tester :</div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {[
                "Versement de 50000 francs pour Tomrom",
                "Retrait de 20000 pour MILDZINA",
                "Situation du compte de l'adhérent 610",
                "Nye di be maɖo akpe blaeve ɖe Tomrom ƒe akɔnta me",
                "Sɔ akpe blaetɔ̃ do Ablavi ƒe akɔnti me",
                "Pose deux sacs pour Tomrom"
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setTranscript(example);
                    processVoiceCommand(example);
                  }}
                  className="bg-slate-950 hover:bg-slate-800 text-slate-300 text-[11px] px-3 py-1.5 rounded-full border border-slate-800 hover:border-slate-700 transition-all text-left"
                >
                  🗣️ "{example}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
