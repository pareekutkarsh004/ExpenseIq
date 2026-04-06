// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); 
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
    } catch (err) {
      const message = err.code ? err.code.split('/')[1].replace(/-/g, ' ') : err.message;
      setError(message.charAt(0).toUpperCase() + message.slice(1));
      setLoading(false); 
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 font-sans text-gray-900">
      <div className="w-full max-w-md p-10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[40px] border border-gray-100">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-emerald-600 tracking-tighter mb-2">ExpenseIQ</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">{isLogin ? "Welcome Back" : "Create Account"}</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs mb-8 border border-red-100 text-center font-black uppercase tracking-wider">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Full Name</label>
              <input type="text" className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold placeholder:text-gray-300" placeholder="Utkarsh Pareek" value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} />
            </div>
          )}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Email Address</label>
            <input type="email" className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold placeholder:text-gray-300" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Password</label>
            <input type="password" placeholder="••••••••" className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold placeholder:text-gray-300" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-lg shadow-2xl hover:bg-emerald-600 transition-all active:scale-[0.98] disabled:opacity-50">
            {loading ? "Syncing..." : isLogin ? "Sign In" : "Get Started"}
          </button>
        </form>
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-400 font-bold">{isLogin ? "New to ExpenseIQ?" : "Already have an account?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-emerald-600 font-black hover:underline underline-offset-8 transition-all">{isLogin ? "Create Account" : "Log In"}</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;