import { getUserLedger } from '../services/ledgerService.js';

const getNextPayoutDate = () => {
  const nextPayout = new Date();
  nextPayout.setMonth(nextPayout.getMonth() + 1, 1);
  nextPayout.setHours(0, 0, 0, 0);
  return nextPayout.toISOString();
};

export const getWorkerFinance = async (req, res) => {
  const ledger = await getUserLedger(req.currentUser.uid);
  const totalEarned = Number(
    ledger.reduce((sum, entry) => sum + Number(entry.amount || 0), 0).toFixed(2)
  );

  res.json({
    totalEarned,
    nextPayoutDate: getNextPayoutDate(),
  });
};

export default {
  getWorkerFinance,
};
