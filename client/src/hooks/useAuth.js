import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth() must be used inside an <AuthProvider>. ' +
      'Make sure your component tree is wrapped with <AuthProvider> in main.jsx.'
    );
  }

  return context;
}
