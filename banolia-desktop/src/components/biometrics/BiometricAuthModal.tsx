import React, { useState } from 'react';
import { Fingerprint, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck, User } from 'lucide-react';
import { MockBiometricDriver } from '../../services/biometrics/MockBiometricDriver';
import { Iso19794Parser } from '../../services/biometrics/Iso19794Parser';
import { MinutiaeMatcher } from '../../services/biometrics/MinutiaeMatcher';
import { DbMember } from '../../types/database';
import { BiometricMatchResult } from '../../types/biometrics';

interface BiometricAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMember?: DbMember;
  allMembers?: DbMember[];
  onAuthenticated: (member: DbMember) => void;
}

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  isOpen,
  onClose,
  targetMember,
  allMembers = [],
  onAuthenticated
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [matchResult, setMatchResult] = useState<BiometricMatchResult | null>(null);
  const [identifiedMember, setIdentifiedMember] = useState<DbMember | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleScan = async () => {
    setIsScanning(true);
    setErrorMsg('');
    setMatchResult(null);
    setIdentifiedMember(null);

    const driver = new MockBiometricDriver();
    await driver.initialize();

    try {
      if (targetMember) {
        // 1:1 Verification against selected member
        const probeTemplate = await driver.captureLive(5000, targetMember.code);
        const refTemplate = driver.generateDeterministicTemplate(targetMember.code, 0);

        const result = MinutiaeMatcher.match(probeTemplate, refTemplate);
        setMatchResult(result);

        if (result.matched) {
          setIdentifiedMember(targetMember);
          setTimeout(() => {
            onAuthenticated(targetMember);
          }, 1200);
        } else {
          setErrorMsg(`Empreinte non reconnue pour ${targetMember.fullName} (Score: ${result.score}%).`);
        }
      } else if (allMembers.length > 0) {
        // 1:N Identification across all enrolled members
        const simulatedMember = allMembers[0];
        const probeTemplate = await driver.captureLive(5000, simulatedMember.code);

        const candidates = allMembers.map(m => ({
          memberCode: m.code,
          template: driver.generateDeterministicTemplate(m.code, 0)
        }));

        const result = MinutiaeMatcher.identify1toN(probeTemplate, candidates);
        setMatchResult(result);

        if (result.matched && result.memberCode) {
          const found = allMembers.find(m => m.code === result.memberCode) || null;
          setIdentifiedMember(found);
          if (found) {
            setTimeout(() => {
              onAuthenticated(found);
            }, 1200);
          }
        } else {
          setErrorMsg('Aucun sociétaire correspondant trouvé dans la base.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur du capteur biométrique USB.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Authentification Biométrique (ISO 19794-2)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Info context */}
        {targetMember ? (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              {targetMember.fullName.charAt(0)}
            </div>
            <div>
              <div className="text-xs text-slate-400">Vérification 1:1 pour :</div>
              <div className="text-sm font-bold text-white">{targetMember.fullName}</div>
              <div className="text-xs font-mono text-emerald-400">{targetMember.code} ({targetMember.phone})</div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center gap-2 text-xs text-slate-300">
            <User className="w-4 h-4 text-sky-400" />
            <span>Mode Recherche 1:N — Posez le doigt pour identifier automatiquement le sociétaire.</span>
          </div>
        )}

        {/* Scanner Animation Visual */}
        <div className="flex flex-col items-center justify-center py-6 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className={`relative p-6 rounded-full border-2 transition-all ${
            isScanning
              ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.3)] animate-pulse'
              : matchResult?.matched
              ? 'border-emerald-500 bg-emerald-950/30'
              : matchResult && !matchResult.matched
              ? 'border-rose-500 bg-rose-950/30'
              : 'border-slate-700 bg-slate-900/50'
          }`}>
            <Fingerprint className={`w-20 h-20 transition-all ${
              isScanning
                ? 'text-emerald-400 animate-bounce'
                : matchResult?.matched
                ? 'text-emerald-400'
                : matchResult && !matchResult.matched
                ? 'text-rose-400'
                : 'text-slate-500'
            }`} />
          </div>

          <div className="mt-4 text-xs font-semibold text-center">
            {isScanning ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Lecture du gabarit ISO 19794-2 en cours...
              </span>
            ) : matchResult?.matched ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Authentification Réussie (Score: {matchResult.score}%)
              </span>
            ) : matchResult && !matchResult.matched ? (
              <span className="text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Échec de correspondance (Score: {matchResult.score}%)
              </span>
            ) : (
              <span className="text-slate-400">Posez l'index droit sur le lecteur USB</span>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/50 border border-rose-700/50 text-rose-300 p-3 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action button */}
        <div className="flex gap-3">
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all"
          >
            <Fingerprint className="w-4 h-4" />
            <span>{isScanning ? 'Numérisation...' : 'Lancer le Scan Biométrique'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
