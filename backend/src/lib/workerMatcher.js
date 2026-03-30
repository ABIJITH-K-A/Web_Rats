import { adminDb } from '../config/firebaseAdmin.js';
import { SKILL_TO_CATEGORIES } from '../lib/skillMapping.js';

export const findMatchingWorkers = async (orderCategory) => {
  // Find skills that cover this category
  const matchingSkills = Object.entries(SKILL_TO_CATEGORIES)
    .filter(([, categories]) => categories.includes(orderCategory))
    .map(([skill]) => skill);

  if (matchingSkills.length === 0) return [];

  // Find available workers with matching skills
  const snapshot = await adminDb().collection('workerProfiles')
    .where('availabilityStatus', '==', 'available')
    .where('skills', 'array-contains-any', matchingSkills)
    .get();

  const now = new Date();
  const today = now.getDay(); // 0-6

  return snapshot.docs
    .map((d) => d.data())
    .filter((profile) => {
      // Filter out unavailable days
      if (profile.unavailableDays?.includes(today)) return false;

      // Filter out workers at max capacity
      if (profile.currentActiveOrders >= profile.maxActiveOrders) return false;

      return true;
    });
};
