import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const data = await api.get('/auth/me');
      setUser(data.user);
      setInstitution(data.institution);
      setStudentProfile(data.studentProfile);
    } catch {
      setUser(null);
      setInstitution(null);
      setStudentProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(
    () => ({ user, institution, studentProfile, loading, refresh, setUser, setInstitution, setStudentProfile }),
    [user, institution, studentProfile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
