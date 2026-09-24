import { useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { AuthContext } from './AuthContext';

function getSavedUser(): User | null {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) return null;

  try {
    const user: unknown = JSON.parse(savedUser);
    if (
      typeof user === 'object' &&
      user !== null &&
      'role' in user &&
      ['EMPLOYE', 'TECHNICIAN', 'ADMIN'].includes(String(user.role))
    ) {
      return user as User;
    }
  } catch {
    // Les données invalides sont supprimées ci-dessous.
  }

  localStorage.removeItem('user');
  localStorage.removeItem('access_token');
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getSavedUser);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
