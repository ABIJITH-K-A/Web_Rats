import { adminDb } from '../src/config/firebaseAdmin.js';

const migrateLegacyRoles = async () => {
  const usersSnapshot = await adminDb().collection('users').get();
  let updatedCount = 0;

  for (const docSnapshot of usersSnapshot.docs) {
    const data = docSnapshot.data() || {};
    const role = String(data.role || '').trim().toLowerCase();

    if (role === 'manager' || role === 'superadmin' || role === 'super_admin') {
      await docSnapshot.ref.update({
        role: 'admin',
      });
      updatedCount += 1;
    }
  }

  console.log(`Legacy role migration complete. Updated ${updatedCount} user record(s).`);
};

migrateLegacyRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Legacy role migration failed:', error);
    process.exit(1);
  });
