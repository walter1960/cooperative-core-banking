import React, { useState } from 'react';
import { TellerDesk } from './teller/TellerDesk';
import { ShiftBalancingModal } from './shift/ShiftBalancingModal';
import { useLiveActiveShift } from '../hooks/useLiveStorage';
import { Member, Account } from '../types';

interface CashierDeskProps {
  members?: Member[];
  accountsMap?: Record<string, Account[]>;
  isOnline?: boolean;
  onTransactionComplete?: () => void;
  selectedAccountNumber?: string;
}

export const CashierDesk: React.FC<CashierDeskProps> = ({
  isOnline = true,
  onTransactionComplete = () => {},
  selectedAccountNumber
}) => {
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const activeShift = useLiveActiveShift();

  return (
    <div>
      <TellerDesk
        isOnline={isOnline}
        onOpenShiftModal={() => setIsShiftModalOpen(true)}
        selectedAccountNumber={selectedAccountNumber}
      />

      <ShiftBalancingModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        activeShift={activeShift}
        onShiftUpdated={() => {
          onTransactionComplete();
        }}
      />
    </div>
  );
};
