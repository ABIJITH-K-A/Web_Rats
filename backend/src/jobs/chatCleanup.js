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

    // Delete all order-linked messages from the simple messages collection.
    const messagesQuery = await adminDb()
      .collection('messages')
      .where('orderId', '==', orderId)
      .get();

    const batch = adminDb().batch();
    messagesQuery.docs.forEach((msg) => batch.delete(msg.ref));
    
    // Update thread to mark as deleted
    batch.update(chatDoc.ref, {
      deletedAt: new Date().toISOString(),
      lastMessage: null,
    });
    
    await batch.commit();

    console.log(`Chat deleted for order ${orderId}`);
  }
};
