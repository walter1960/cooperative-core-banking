import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './database';

export const useLiveActiveShift = () => {
  return useLiveQuery(() => db.cashShifts.where('status').equals('OPEN').first());
};
