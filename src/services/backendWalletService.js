import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { apiRequest, isBackendConfigured } from "./apiClient";

let walletBackendEnabled = true;

const buildFinanceShape = (payload = {}) => {
  const totalEarned = Number(payload.totalEarned || 0);

  return {
    totalEarned,
    nextPayoutDate: payload.nextPayoutDate || null,
    lifetimeEarnings: totalEarned,
    totalEarnings: totalEarned,
    pendingAmount: 0,
    pending: 0,
    withdrawableAmount: 0,
    withdrawable: 0,
  };
};

const getLocalLedgerSummary = async (userId) => {
  const snapshot = await getDocs(
    query(collection(db, "ledgerEntries"), where("userId", "==", userId))
  ).catch(() => null);

  const totalEarned =
    snapshot?.docs.reduce((sum, docSnapshot) => {
      const entry = docSnapshot.data();
      return sum + Number(entry.amount || 0);
    }, 0) || 0;

  return buildFinanceShape({
    totalEarned,
    nextPayoutDate: null,
  });
};

const shouldUseLocalFinanceFallback = (error) =>
  error?.statusCode === 401 ||
  error?.statusCode === 403 ||
  error?.code === "auth_network_failed" ||
  error?.code === "connection_refused" ||
  String(error?.message || "").toLowerCase().includes("log in") ||
  String(error?.message || "").toLowerCase().includes("sign in");

export const getWalletOverview = async (userId) => {
  if (!userId) {
    return {
      wallet: buildFinanceShape(),
      withdrawals: [],
    };
  }

  if (isBackendConfigured() && walletBackendEnabled) {
    try {
      const response = await apiRequest("/finance/worker", {
        authMode: "required",
      });

      return {
        wallet: buildFinanceShape(response || {}),
        withdrawals: [],
      };
    } catch (error) {
      if (!shouldUseLocalFinanceFallback(error)) {
        throw error;
      }

      walletBackendEnabled = false;
    }
  }

  return {
    wallet: await getLocalLedgerSummary(userId),
    withdrawals: [],
  };
};

export const getWallet = async (userId) => {
  const overview = await getWalletOverview(userId);
  return overview.wallet;
};

export const requestWalletWithdrawal = async () => {
  throw new Error("Payouts are handled manually by admin payroll. No withdrawal request is required.");
};

export default {
  getWalletOverview,
  getWallet,
  requestWalletWithdrawal,
};
