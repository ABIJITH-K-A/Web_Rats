import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../auth/LoginModal';

/**
 * PermissionErrorHandler - Handles Firebase permission errors globally.
 * Must be rendered INSIDE AuthProvider.
 *
 * IMPORTANT: For logged-in users (including all staff roles), a Firestore
 * permission-denied error means their role simply can't access that data —
 * that is EXPECTED behaviour (e.g. a rule that restricts a collection). We
 * should NEVER show a login popup to a user who is already signed in.
 * We only show the modal when the visitor is NOT logged in at all.
 */
const PermissionErrorHandler = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('Please log in to continue');

  useEffect(() => {
    const handlePermissionError = (event) => {
      const errorMessage = event.detail?.message || '';

      const isPermissionError =
        errorMessage.includes('permission-denied') ||
        errorMessage.includes('Missing or insufficient permissions') ||
        (errorMessage.includes('FirebaseError') && errorMessage.includes('permissions'));

      if (!isPermissionError) return;

      if (user) {
        // Staff / clients who are already signed in — just log it silently.
        // Showing a modal here caused the "Access Denied" loop on the dashboard.
        console.warn(
          '🔒 Firestore permission denied for signed-in user. ' +
          'Role does not have read access to this data — this is expected.'
        );
        return; // <-- Do NOT show modal
      }

      // Visitor not logged in at all — prompt them to sign in.
      setMessage('You need to log in to access this feature');
      setShowModal(true);
    };

    window.addEventListener('firebase-permission-error', handlePermissionError);
    return () => window.removeEventListener('firebase-permission-error', handlePermissionError);
  }, [user]);

  return (
    <LoginModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      message={message}
      isLoggedIn={!!user}
      onLogin={() => navigate('/join?login=1')}
      onSignup={() => navigate('/join?tab=register')}
    />
  );
};

export default PermissionErrorHandler;
