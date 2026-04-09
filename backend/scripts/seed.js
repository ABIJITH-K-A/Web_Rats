import 'dotenv/config';
import { adminAuth, adminDb } from '../src/config/firebaseAdmin.js';

const DEMO_USERS = [
  {
    uid: 'demo-client-1',
    email: 'client@demo.com',
    password: 'password123',
    displayName: 'Demo Client',
    role: 'client'
  },
  {
    uid: 'demo-worker-1',
    email: 'worker@demo.com',
    password: 'password123',
    displayName: 'Demo Worker',
    role: 'worker'
  },
  {
    uid: 'demo-admin-1',
    email: 'admin@demo.com',
    password: 'password123',
    displayName: 'Demo Admin',
    role: 'admin'
  },
  {
    uid: 'demo-owner-1',
    email: 'owner@demo.com',
    password: 'password123',
    displayName: 'Demo Owner',
    role: 'owner'
  }
];

const DEMO_ORDERS = [
  {
    id: 'DEMO-ORD-01',
    userId: 'demo-client-1',
    customerId: 'demo-client-1',
    name: 'Demo Client',
    email: 'client@demo.com',
    phone: '+1 234 567 890',
    category: 'Presentation & Design',
    categoryId: 'presentation-design',
    service: 'PPT Creation',
    serviceId: 'ppt-creation',
    plan: 'Premium',
    planId: 'premium',
    package: 'Premium',
    price: 499,
    basePrice: 499,
    priorityFee: 0,
    totalPrice: 499,
    advancePayment: 349,
    advancePaid: 349,
    remainingPayment: 150,
    remainingAmount: 150,
    totalPaid: 349,
    advanceRate: 0.7,
    customerType: 'new',
    isPriority: false,
    priorityLabel: 'Normal',
    isReorder: false,
    projectDescription: 'This is a demo project seeded for testing.',
    features: 'Demo slides',
    deadline: '2026-12-31',
    paymentStatus: 'Advance Paid',
    status: 'In Progress',
    orderStatus: 'In Progress',
    statusKey: 'in_progress',
    assignmentStatus: 'assigned',
    assignedWorkers: ['demo-worker-1'],
    workerAssigned: 'demo-worker-1',
    assignedTo: 'demo-worker-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'DEMO-ORD-02',
    userId: 'demo-client-1',
    customerId: 'demo-client-1',
    name: 'Demo Client',
    email: 'client@demo.com',
    phone: '+1 234 567 890',
    category: 'Web Development',
    categoryId: 'web-development',
    service: 'Landing Pages',
    serviceId: 'landing-pages',
    plan: 'Basic',
    planId: 'basic',
    package: 'Basic',
    price: 999,
    basePrice: 999,
    priorityFee: 0,
    totalPrice: 999,
    advancePayment: 699,
    advancePaid: 0,
    remainingPayment: 300,
    remainingAmount: 300,
    totalPaid: 0,
    advanceRate: 0.7,
    customerType: 'new',
    isPriority: false,
    priorityLabel: 'Normal',
    isReorder: false,
    projectDescription: 'Pending order demo. Has not been picked up.',
    features: 'Single page layout',
    deadline: '2026-11-30',
    paymentStatus: 'Pending',
    status: 'Pending Assignment',
    orderStatus: 'Pending Assignment',
    statusKey: 'pending_assignment',
    assignmentStatus: 'unassigned',
    assignedWorkers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function seed() {
  console.log('Starting seed process...');
  
  // Create / Update Users
  for (const u of DEMO_USERS) {
    try {
      try {
        await adminAuth().getUserByEmail(u.email);
        // Exists, update password just in case
        const userRec = await adminAuth().getUserByEmail(u.email);
        await adminAuth().updateUser(userRec.uid, { password: u.password });
        console.log(`User ${u.email} exists, updated password.`);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          // Create
          await adminAuth().createUser({
            uid: u.uid,
            email: u.email,
            password: u.password,
            displayName: u.displayName
          });
          console.log(`Created user: ${u.email}`);
        } else {
          throw err;
        }
      }
      
      // Update custom claims for role
      const userRec = await adminAuth().getUserByEmail(u.email);
      await adminAuth().setCustomUserClaims(userRec.uid, { role: u.role });
      
      // Upsert profile in Firestore
      await adminDb().collection('users').doc(userRec.uid).set({
        name: u.displayName,
        email: u.email,
        role: u.role,
        status: 'active',
        createdAt: new Date().toISOString()
      }, { merge: true });
      
      console.log(`Updated Firestore profile & claims for ${u.email}`);
    } catch (e) {
      console.error(`Error processing user ${u.email}:`, e);
    }
  }

  // Create Orders
  for (const order of DEMO_ORDERS) {
    try {
      await adminDb().collection('orders').doc(order.id).set(order, { merge: true });
      console.log(`Upserted order ${order.id}`);
    } catch (e) {
      console.error(`Error processing order ${order.id}:`, e);
    }
  }

  console.log('Seeding finished.');
  process.exit(0);
}

seed().catch(console.error);
