import { Router } from 'express';
import { z } from 'zod';
import { adminDb } from '../config/firebaseAdmin.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { HttpError } from '../lib/httpError.js';
import { authGuard, optionalAuthGuard } from '../middleware/authGuard.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const unlockSchema = z.object({
  templateId: z.string().trim().min(1).max(128),
});

const normalizeTerm = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const normalizeStringArray = (value) =>
  Array.isArray(value)
    ? value
        .map((item) => normalizeTerm(item))
        .filter(Boolean)
    : [];

const mapTemplateDocument = (docSnapshot, unlockedIds = new Set()) => {
  const data = docSnapshot.data() || {};
  const images = Array.isArray(data.images) && data.images.length
    ? data.images
    : [data.imageUrl, data.image].filter(Boolean);
  const tags = normalizeStringArray(data.tags);
  const keywords = normalizeStringArray(
    Array.isArray(data.keywords) && data.keywords.length ? data.keywords : tags
  );
  const price = Number(data.price || 0);
  const isFree = Boolean(data.isFree || price <= 0);

  return {
    id: docSnapshot.id,
    title: data.title || 'Untitled Template',
    images,
    description: data.description || '',
    tags,
    keywords,
    price,
    isFree,
    fileUrl: data.fileUrl || data.downloadUrl || null,
    isUnlocked: isFree || unlockedIds.has(docSnapshot.id),
  };
};

const getUnlockedTemplateIds = async (userId) => {
  if (!userId) {
    return new Set();
  }

  const purchaseSnapshot = await adminDb()
    .collection('templatePurchases')
    .where('userId', '==', userId)
    .get();

  return new Set(
    purchaseSnapshot.docs
      .map((docSnapshot) => docSnapshot.data())
      .filter((purchase) => purchase.paid)
      .map((purchase) => String(purchase.templateId || '').trim())
      .filter(Boolean)
  );
};

router.get(
  '/',
  optionalAuthGuard,
  asyncHandler(async (req, res) => {
    const search = normalizeTerm(req.query.search);
    const tag = normalizeTerm(req.query.tag);
    const priceFilter = normalizeTerm(req.query.price);
    const sort = normalizeTerm(req.query.sort);

    let queryRef = adminDb().collection('templates');

    if (search) {
      queryRef = queryRef.where('keywords', 'array-contains', search);
    } else if (tag) {
      queryRef = queryRef.where('tags', 'array-contains', tag);
    }

    if (priceFilter === 'free') {
      queryRef = queryRef.where('isFree', '==', true);
    }

    if (priceFilter === 'paid') {
      queryRef = queryRef.where('isFree', '==', false);
    }

    const [templateSnapshot, unlockedIds] = await Promise.all([
      queryRef.get(),
      getUnlockedTemplateIds(req.currentUser?.uid),
    ]);

    let templates = templateSnapshot.docs.map((docSnapshot) =>
      mapTemplateDocument(docSnapshot, unlockedIds)
    );

    if (search) {
      templates = templates.filter((template) =>
        template.keywords.includes(search) ||
        template.title.toLowerCase().includes(search) ||
        template.description.toLowerCase().includes(search)
      );
    }

    if (tag) {
      templates = templates.filter((template) => template.tags.includes(tag));
    }

    if (sort === 'price-low') {
      templates.sort((left, right) => left.price - right.price);
    } else if (sort === 'price-high') {
      templates.sort((left, right) => right.price - left.price);
    } else {
      templates.sort((left, right) => left.title.localeCompare(right.title));
    }

    res.json({ templates });
  })
);

router.get(
  '/:id',
  optionalAuthGuard,
  asyncHandler(async (req, res) => {
    const [templateSnapshot, unlockedIds] = await Promise.all([
      adminDb().collection('templates').doc(req.params.id).get(),
      getUnlockedTemplateIds(req.currentUser?.uid),
    ]);

    if (!templateSnapshot.exists) {
      throw new HttpError(404, 'Template not found.');
    }

    res.json({
      template: mapTemplateDocument(templateSnapshot, unlockedIds),
    });
  })
);

router.get(
  '/:id/download',
  optionalAuthGuard,
  asyncHandler(async (req, res) => {
    const [templateSnapshot, unlockedIds] = await Promise.all([
      adminDb().collection('templates').doc(req.params.id).get(),
      getUnlockedTemplateIds(req.currentUser?.uid),
    ]);

    if (!templateSnapshot.exists) {
      throw new HttpError(404, 'Template not found.');
    }

    const template = mapTemplateDocument(templateSnapshot, unlockedIds);
    if (!template.fileUrl) {
      throw new HttpError(404, 'Download file is not available.');
    }

    if (!template.isUnlocked) {
      throw new HttpError(403, 'Purchase this template to unlock the download.');
    }

    res.json({
      templateId: template.id,
      fileUrl: template.fileUrl,
    });
  })
);

router.post(
  '/unlock',
  authGuard,
  validateBody(unlockSchema),
  asyncHandler(async (req, res) => {
    const { templateId } = req.validatedBody;
    const templateSnapshot = await adminDb().collection('templates').doc(templateId).get();

    if (!templateSnapshot.exists) {
      throw new HttpError(404, 'Template not found.');
    }

    const template = mapTemplateDocument(templateSnapshot);

    if (!template.isFree) {
      const existingPurchase = await adminDb()
        .collection('templatePurchases')
        .doc(`${req.currentUser.uid}_${templateId}`)
        .get();

      if (!existingPurchase.exists || !existingPurchase.data()?.paid) {
        throw new HttpError(402, 'Payment required before download unlock.');
      }
    }

    await adminDb()
      .collection('templatePurchases')
      .doc(`${req.currentUser.uid}_${templateId}`)
      .set(
        {
          userId: req.currentUser.uid,
          templateId,
          paid: true,
          price: template.isFree ? 0 : template.price,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true }
      );

    res.json({
      success: true,
      templateId,
      isFree: template.isFree,
    });
  })
);

export default router;
