import { Timestamp } from 'firebase-admin/firestore';

export const serializeValue = (value) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializeValue(item)])
    );
  }

  return value;
};

export const serializeDocument = (docSnapshot) => ({
  id: docSnapshot.id,
  ...serializeValue(docSnapshot.data()),
});

export default {
  serializeValue,
  serializeDocument,
};
