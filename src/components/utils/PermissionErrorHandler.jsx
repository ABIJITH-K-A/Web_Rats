import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../auth/LoginModal';

/**
 * PermissionErrorHandler - Handles Firebase permission errors
 * Must be rendered INSIDE AuthProvider to use useAuth hook
 */
const PermissionErrorHandler = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("Please log in to continue");

  useEffect(() => {
    const handlePermissionError = (event) => {
      const errorMessage = event.detail?.message || '';
      
      if (errorMessage.includes('permission-denied') || 
          errorMessage.includes('Missing or insufficient permissions') ||
          (errorMessage.includes('FirebaseError') && errorMessage.includes('permissions'))) {
        
        if (user) {
          console.warn('🔒 Firebase permission denied for logged-in user. Role may not have access.');
          setMessage("You don't have permission to access this feature");
        } else {
          console.warn('🔒 Firebase permission denied. Showing login modal.');
          setMessage("You need to log in to access this feature");
        }
        setShowModal(true);
      }
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
      onLogin={() => navigate(user ? '/profile' : '/join?login=1')}
      onSignup={() => navigate(user ? '/profile' : '/join?tab=register')}
    />
  );
};

export default PermissionErrorHandler;
