import { createContext, useContext, useState, useCallback } from 'react';

const AuthModelContext = createContext(null);

export const useAuthModel = () => {
  const ctx = useContext(AuthModelContext);
  if (!ctx) throw new Error('useAuthModel must be used within AuthModelProvider');
  return ctx;
};

export const AuthModelProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('login');
  const [intent, setIntent] = useState(null);
  const [fromPath, setFromPath] = useState(null);

  const openModel = useCallback((viewType = 'login', options = {}) => {
    setView(viewType);
    setIntent(options.intent || null);
    setFromPath(options.fromPath || null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setIntent(null);
    setFromPath(null);
  }, []);

  const switchView = useCallback((newView) => {
    setView(newView);
  }, []);

  return (
    <AuthModelContext.Provider
      value={{ isOpen, view, intent, fromPath, openModel, closeModal, switchView }}
    >
      {children}
    </AuthModelContext.Provider>
  );
};

export default AuthModelProvider;
