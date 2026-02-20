import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('focustube-user');
        const token = localStorage.getItem('focustube-token');

        if (savedUser && token) {
          const parsedUser = JSON.parse(savedUser);
          parsedUser.createdAt = new Date(parsedUser.createdAt);
          setUser(parsedUser);
        }
      } catch (err) {
        console.error('Auth error:', err);
        localStorage.removeItem('focustube-user');
        localStorage.removeItem('focustube-token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);

    await new Promise((res) => setTimeout(res, 800));

    if (email && password.length >= 6) {
      const newUser = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: email.split('@')[0],
        email,
        avatar: '🎯',
        createdAt: new Date(),
      };

      const token = 'ft_' + Math.random().toString(36).substr(2, 16);

      localStorage.setItem('focustube-user', JSON.stringify(newUser));
      localStorage.setItem('focustube-token', token);

      setUser(newUser);
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  

  const signup = async (name, email, password) => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 1000));

    if (name && email && password.length >= 6) {
      const newUser = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        avatar: '🎯',
        createdAt: new Date(),
      };

      const token = 'ft_' + Math.random().toString(36).substr(2, 16);

      localStorage.setItem('focustube-user', JSON.stringify(newUser));
      localStorage.setItem('focustube-token', token);

      setUser(newUser);
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    localStorage.removeItem('focustube-user');
    localStorage.removeItem('focustube-token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
