import { useState, useCallback } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for handling file uploads to Firebase Storage
 * @returns {Object} File upload methods and state
 */
export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadError, setUploadError] = useState(null);

  const { userProfile } = useAuth();
  const storage = getStorage(app);

  /**
   * Upload a file to Firebase Storage
   * @param {File} file - The file to upload
   * @param {string} folder - The folder path in storage
   * @returns {Promise<string>} - The download URL
   */
  const uploadFile = useCallback(async (file, folder = 'uploads') => {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!userProfile?.uid) {
      throw new Error('You must be logged in to upload files');
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Create a unique file name
      const fileExtension = file.name.split('.').pop();
      const fileName = `${userProfile.uid}/${folder}/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, fileName);

      // Upload the file
      const snapshot = await uploadBytes(fileRef, file);

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update uploaded files state
      setUploadedFiles(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          name: file.name,
          url: downloadURL,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        }
      ]);

      return downloadURL;
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message);
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [storage, userProfile?.uid]);

  /**
   * Upload multiple files
   * @param {File[]} files - Array of files to upload
   * @param {string} folder - The folder path in storage
   * @returns {Promise<string[]>} - Array of download URLs
   */
  const uploadMultipleFiles = useCallback(async (files, folder = 'uploads') => {
    if (!files || files.length === 0) {
      return [];
    }

    const urls = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadFile(files[i], folder);
        urls.push(url);
        setUploadProgress(((i + 1) / files.length) * 100);
      } catch (error) {
        errors.push({ file: files[i].name, error: error.message });
      }
    }

    if (errors.length > 0) {
      setUploadError(`Some files failed to upload: ${errors.map(e => e.error).join(', ')}`);
    }

    return urls;
  }, [uploadFile]);

  /**
   * Delete a file from Firebase Storage
   * @param {string} url - The download URL of the file to delete
   * @returns {Promise<void>}
   */
  const deleteFile = useCallback(async (url) => {
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);

      // Update uploaded files state
      setUploadedFiles(prev => prev.filter(f => f.url !== url));
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }, [storage]);

  /**
   * Clear uploaded files state
   */
  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  /**
   * Validate file size (max 10MB)
   * @param {File} file - The file to validate
   * @returns {boolean} - Whether file size is valid
   */
  const isValidFileSize = useCallback((file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return file.size <= maxSize;
  }, []);

  /**
   * Validate file type (images, documents)
   * @param {File} file - The file to validate
   * @returns {boolean} - Whether file type is valid
   */
  const isValidFileType = useCallback((file) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    return allowedTypes.includes(file.type);
  }, []);

  return {
    uploading,
    uploadProgress,
    uploadedFiles,
    uploadError,
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    clearFiles,
    formatFileSize,
    isValidFileSize,
    isValidFileType,
  };
};

export default useFileUpload;