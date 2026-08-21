import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TellerDesk } from '../TellerDesk';
import { db } from '../../../db/database';
import { seedDatabase } from '../../../db/seed';

describe('TellerDesk UI Component Integration Tests', () => {
  beforeEach(async () => {
    await db.open();
    await seedDatabase(db);
  });

  it('should render TellerDesk with member selection, quick cash buttons, and operation switcher', async () => {
    const onOpenShiftMock = vi.fn();
    render(<TellerDesk isOnline={true} onOpenShiftModal={onOpenShiftMock} />);

    // Verify main headings and buttons exist
    expect(screen.getByText(/Guichet Express : Opération de Caisse/i)).toBeInTheDocument();
    expect(screen.getByText(/VERSEMENT \/ DÉPÔT/i)).toBeInTheDocument();
    expect(screen.getByText(/RETRAIT ESPÈCES/i)).toBeInTheDocument();

    // Verify Quick Cash buttons exist
    const buttons50k = screen.getAllByText(/50\s?000\s?F/i);
    expect(buttons50k.length).toBeGreaterThan(0);
    expect(screen.getByText(/100\s?000\s?F/i)).toBeInTheDocument();
  });

  it('should calculate change and denomination suggestions when amount and received amount are entered', async () => {
    const onOpenShiftMock = vi.fn();
    render(<TellerDesk isOnline={true} onOpenShiftModal={onOpenShiftMock} />);

    const amountInput = screen.getByPlaceholderText(/Ex: 50000/i);
    fireEvent.change(amountInput, { target: { value: '35000' } });

    const receivedInput = screen.getByPlaceholderText(/Ex: 100000/i);
    fireEvent.change(receivedInput, { target: { value: '50000' } });

    // Change should be 15,000 XOF
    expect(screen.getByText(/15\s?000\s?F\.CFA/i)).toBeInTheDocument();
  });

  it('should open Transfer Modal when Virement button is clicked', async () => {
    const onOpenShiftMock = vi.fn();
    render(<TellerDesk isOnline={true} onOpenShiftModal={onOpenShiftMock} />);

    const transferBtn = screen.getByRole('button', { name: /Virement/i });
    fireEvent.click(transferBtn);

    expect(screen.getByText(/Virement Interne Compte à Compte/i)).toBeInTheDocument();
  });

  it('should open Account Opening Wizard when Nouveau Membre button is clicked', async () => {
    const onOpenShiftMock = vi.fn();
    render(<TellerDesk isOnline={true} onOpenShiftModal={onOpenShiftMock} />);

    const newMemberBtn = screen.getByRole('button', { name: /Nouveau Membre/i });
    fireEvent.click(newMemberBtn);

    expect(screen.getByText(/Nouvelle Adhésion & Ouverture de Compte/i)).toBeInTheDocument();
  });
});
