import { adminDb } from '../config/firebaseAdmin.js';

export const cleanupExpiredChats = async () => {
  const now = new Date().toISOString();

  const snapshot = await adminDb().collection('chats')
    .where('deletionScheduledAt', '<=', now)
    .where('deletedAt', '==', null)
    .limit(20)
    .get();

  for (const chatDoc of snapshot.docs) {
    const orderId = chatDoc.id;

    // Delete all messages subcollection
    const messagesSnap = await adminDb()
      .collection('chats').doc(orderId)
      .collection('messages').get();

    const batch = adminDb().batch();
    messagesSnap.docs.forEach((msg) => batch.delete(msg.ref));
    await batch.commit();

    // Mark chat as deleted
    await chatDoc.ref.update({
      deletedAt: new Date().toISOString(),
      messageCount: 0,
    });

    console.log(`Chat deleted for order ${orderId}`);
  }
};
