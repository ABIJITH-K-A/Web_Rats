import { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { seedTemplates } from "../data/seedTemplates";

export function useTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Seed data if collection is empty
  const seedIfEmpty = useCallback(async () => {
    try {
      const templatesRef = collection(db, "templates");
      const snapshot = await getDocs(templatesRef);
      
      if (snapshot.empty) {
        console.log("Seeding templates collection...");
        const promises = seedTemplates.map((template) =>
          addDoc(templatesRef, {
            ...template,
            createdAt: serverTimestamp(),
          })
        );
        await Promise.all(promises);
        console.log("Templates seeded successfully");
      }
    } catch (err) {
      console.error("Error seeding templates:", err);
    }
  }, []);

  // Fetch all templates with optional filters
  const fetchTemplates = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const templatesRef = collection(db, "templates");
      let constraints = [];

      // Category filter
      if (filters.categories?.length > 0) {
        constraints.push(where("category", "in", filters.categories));
      }

      // Price filter
      if (filters.price === "free") {
        constraints.push(where("isFree", "==", true));
      } else if (filters.price === "paid") {
        constraints.push(where("isFree", "==", false));
      }

      // Sort
      if (filters.sort === "newest") {
        constraints.push(orderBy("createdAt", "desc"));
      } else if (filters.sort === "price-low") {
        constraints.push(orderBy("price", "asc"));
      } else {
        // Default: popular (by likes)
        constraints.push(orderBy("likes", "desc"));
      }

      const q = query(templatesRef, ...constraints);
      const snapshot = await getDocs(q);

      let results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Search filter (client-side)
      if (filters.search?.trim()) {
        const searchTerm = filters.search.toLowerCase();
        results = results.filter(
          (t) =>
            t.title.toLowerCase().includes(searchTerm) ||
            t.description.toLowerCase().includes(searchTerm)
        );
      }

      setTemplates(results);
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single template by ID
  const getTemplateById = useCallback(async (id) => {
    try {
      const docRef = doc(db, "templates", id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      console.error("Error fetching template:", err);
      throw err;
    }
  }, []);

  useEffect(() => {
    seedIfEmpty().then(() => fetchTemplates());
  }, [seedIfEmpty, fetchTemplates]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    getTemplateById,
    refetch: fetchTemplates,
  };
}
