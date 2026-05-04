export const ROLE_REFERRAL_CONFIG = {
  client: { code: 'CLT', pct: 5 },
  worker: { code: 'WRK', pct: 10 },
  admin: { code: 'ADM', pct: 15 },
  owner: { code: 'OWN', pct: 15 },
};

export const MAX_REFERRAL_DISCOUNT = 40;

const randomSegment = () =>
  Math.random().toString(36).toUpperCase().slice(2, 6).padEnd(4, 'X');

export const makeReferralCode = (role = 'client') => {
  const prefix = ROLE_REFERRAL_CONFIG[role]?.code || ROLE_REFERRAL_CONFIG.client.code;
  return `RYNX-${prefix}-${randomSegment()}`;
};

export const clampReferralDiscountPercent = (discountPercent) =>
  Math.min(
    MAX_REFERRAL_DISCOUNT,
    Math.max(0, Math.round(Number(discountPercent || 0)))
  );

export const getReferralDiscountForRole = (role = 'client') =>
  clampReferralDiscountPercent(ROLE_REFERRAL_CONFIG[role]?.pct || 0);

export default {
  ROLE_REFERRAL_CONFIG,
  clampReferralDiscountPercent,
  getReferralDiscountForRole,
  makeReferralCode,
};
