// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from "firebase/auth";
import { auth } from "../firebase";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Updated to accept an optional name for registration
  const syncUserWithBackend = async (firebaseUser, displayName = null) => {
    try {
      await firebaseUser.getIdToken(true); 
      
      // We pass the name in the body so the backend can save it
      const res = await api.post('/users/register-or-login', {
        name: displayName || firebaseUser.displayName
      });
      
      setUser(res.data);
      return true;
    } catch (err) {
      console.error("Backend sync failed:", err);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // Normal login sync
        await syncUserWithBackend(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  
  // Signup now handles the registration and immediate sync with the name
  const signup = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await syncUserWithBackend(userCredential.user, name);
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);