// // PATH: lib/hooks/useAuth.js
// 'use client';
// import { useState, useEffect, createContext, useContext } from 'react';
// import { apiClient } from '@/lib/api/client';

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadUser();
//   }, []);

//   const loadUser = async () => {
//     try {
//       const token = apiClient.getToken();
//       if (!token) { setLoading(false); return; }
//       const data = await apiClient.get(
//         '/users/me?populate[partnerProfile]=*&populate[country][populate][currency]=*'
//       );
//       setUser(data);
//     } catch {
//       apiClient.clearToken();
//     } finally {
//       setLoading(false);
//     }
//   };

//   const login = async (identifier, password) => {
//     const res = await apiClient.post('/auth/local', { identifier, password });
//     if (res?.jwt) apiClient.setToken(res.jwt);
//     setUser(res?.user);
//     return res;
//   };

//   const logout = () => {
//     apiClient.clearToken();
//     setUser(null);
//     if (typeof window !== 'undefined') {
//       localStorage.clear();
//       window.location.href = '/login';
//     }
//   };

//   const refreshUser = async () => {
//     const data = await apiClient.get(
//       '/users/me?populate[partnerProfile]=*&populate[country][populate][currency]=*'
//     );
//     setUser(data);
//     return data;
//   };

//   return (
//     <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be inside AuthProvider');
//   return ctx;
// };

'use client';
// PATH: lib/hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import { apiClient } from '@/lib/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = apiClient.getToken();
      if (!token) { setLoading(false); return; }
      const data = await apiClient.get(
        '/users/me?populate[partnerProfile]=*&populate[country][populate][currency]=*'
      );
      setUser(data);
    } catch {
      apiClient.clearToken();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login with identifier (email OR username — Strapi accepts both) + password.
   */
  const login = async (identifier, password) => {
    const res = await apiClient.post('/auth/local', { identifier, password });
    if (res?.jwt) apiClient.setToken(res.jwt);
    setUser(res?.user);
    return res;
  };

  /**
   * Register a new user.
   * Strapi's default register endpoint: POST /auth/local/register
   * Required fields: username, email, password
   * Extra fields (firstName, lastName, phoneNumber, country, referralCode)
   * must be whitelisted in your Strapi user-permissions config.
   */
  const register = async ({ username, email, password, firstName, lastName, phoneNumber, country, referralCode }) => {
    const payload = {
      username,
      email,
      password,
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phoneNumber && { phoneNumber }),
      ...(country?.id && { country: country.id }),
      ...(referralCode && { referralCode }),
    };
    const res = await apiClient.post('/auth/local/register', payload);
    if (res?.jwt) apiClient.setToken(res.jwt);
    setUser(res?.user);
    return res;
  };

  /** Returns true when a user is currently signed in. */
  const isAuthenticated = () => !!user;

  const logout = () => {
    apiClient.clearToken();
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const refreshUser = async () => {
    const data = await apiClient.get(
      '/users/me?populate[partnerProfile]=*&populate[country][populate][currency]=*'
    );
    setUser(data);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};