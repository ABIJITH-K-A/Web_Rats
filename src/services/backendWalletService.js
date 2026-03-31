import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  getWallet as getWalletFromFirestore,
  requestWithdrawal as requestWithdrawalFromFirestore,
} from './financialService';
import { apiRequest, isBackendConfigured } from './apiClient';

const sortByRequestedAtDesc = (records = []) =>
  [...records].sort((left, right) => {
    const leftTime =
      (typeof left?.requestedAt?.toDate === 'function'
        ? left.requestedAt.toDate()
        : new Date(left?.requestedAt || 0)
      )?.getTime?.() || 0;
    const rightTime =
      (typeof right?.requestedAt?.toDate === 'function'
        ? right.requestedAt.toDate()
        : new Date(right?.requestedAt || 0)
      )?.getTime?.() || 0;

    return rightTime - leftTime;
  });

export const getWalletOverview = async (userId) => {
  if (!userId) {
    return {
      wallet: null,
      withdrawals: [],
    };
  }

  if (isBackendConfigured()) {
    const response = await apiRequest(`/wallet/${userId}`, {
      authMode: 'required',
    });

    return {
      wallet: response?.wallet || null,
      withdrawals: response?.withdrawals || [],
    };
  }

  const [wallet, withdrawalSnapshot] = await Promise.all([
    getWalletFromFirestore(userId),
    getDocs(
      query(collection(db, 'withdrawals'), where('userId', '==', userId))
    ).catch(() => null),
  ]);

  return {
    wallet,
    withdrawals: sortByRequestedAtDesc(
      withdrawalSnapshot?.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) || []
    ).slice(0, 20),
  };
};

export const getWallet = async (userId) => {
  const overview = await getWalletOverview(userId);
  return overview.wallet;
};

export const requestWalletWithdrawal = async (amount, method, details = {}) => {
  if (isBackendConfigured()) {
    const response = await apiRequest('/wallet/withdraw', {
      method: 'POST',
      authMode: 'required',
      body: {
        amount,
        method,
        details,
      },
    });

    return response?.withdrawalId || null;
  }

  if (!details?.userId) {
    throw new Error('Missing local user id for fallback withdrawal flow.');
  }

  return requestWithdrawalFromFirestore(details.userId, amount, method, details);
};

export default {
  getWalletOverview,
  getWallet,
  requestWalletWithdrawal,
};
