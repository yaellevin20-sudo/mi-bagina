import { useState, useEffect } from "react";

const STORAGE_KEY = "mi_bagina_user";

export function useLocalUser() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      setUser(null); // null = not registered
    }
  }, []);

  const saveUser = (name, phone) => {
    const u = { full_name: name.trim(), phone: phone.trim(), email: phone.trim() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
    return u;
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  const clearUser = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return { user, saveUser, updateUser, clearUser };
}