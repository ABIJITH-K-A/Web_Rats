import { adminDb } from '../config/firebaseAdmin.js';

export const cleanupExpiredChats = async () => {
  const now = new Date().toISOString();

  // Query chatThreads for scheduled deletion
  const snapshot = await adminDb().collection('chatThreads')
    .where('deletionScheduledAt', '<=', now)
    .where('deletedAt', '==', null)
    .limit(20)
    .get();

  for (const chatDoc of snapshot.docs) {
    const orderId = chatDoc.id;

    // Delete all messages from chatMessages collection (top-level, not subcollection)
    const messagesQuery = await adminDb()
      .collection('chatMessages')
      .where('orderId', '==', orderId)
      .get();

    const batch = adminDb().batch();
    messagesQuery.docs.forEach((msg) => batch.delete(msg.ref));
    await batch.commit();

    // Mark chat thread as deleted
    await chatDoc.ref.update({
      deletedAt: new Date().toISOString(),
      lastMessage: null,
    });

    console.log(`Chat deleted for order ${orderId}`);
  }
};
