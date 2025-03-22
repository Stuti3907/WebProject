import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase'; 

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  // Add state to handle errors

  const signup = (email, password) => {
    return auth.createUserWithEmailAndPassword(email, password)
      .catch(setError); // Handle errors during signup
  };

  const login = (email, password) => {
    return auth.signInWithEmailAndPassword(email, password)
      .catch(setError); // Handle errors during login
  };

  const logout = () => {
    return auth.signOut();
  };

  const resetPassword = (email) => {
    return auth.sendPasswordResetEmail(email)
      .catch(setError); // Handle errors during password reset
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setLoading(false);
      setError(null); // Reset error on auth state change
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};