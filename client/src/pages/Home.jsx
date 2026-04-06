// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CheckCircle, Zap, Shield, ArrowRight } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-black text-emerald-600">ExpenseIQ</h1>
        <div className="space-x-4">
          {user ? (
            <button onClick={() => navigate("/dashboard")} className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold">Go to Dashboard</button>
          ) : (
            <>
              <button onClick={() => navigate("/login")} className="text-gray-600 font-semibold">Login</button>
              <button onClick={() => navigate("/login")} className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-emerald-100">Sign Up</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto text-center pt-20 pb-16 px-4">
        <h2 className="text-6xl font-black text-gray-900 leading-tight mb-6">
          Smart splitting for <span className="text-emerald-600">smart people.</span>
        </h2>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          The easiest way to share expenses with friends and family. Track bills, settle debts, and manage group finances in ₹ Rupees.
        </p>
        <button 
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 mx-auto bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all active:scale-95"
        >
          Get Started for Free <ArrowRight size={20} />
        </button>
      </header>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <FeatureCard 
            icon={<Zap className="text-emerald-500" />} 
            title="Instant Sync" 
            desc="Add expenses on the go and see real-time balances across all your devices." 
          />
          <FeatureCard 
            icon={<CheckCircle className="text-blue-500" />} 
            title="Debt Simplification" 
            desc="Our IQ algorithm calculates the easiest way to settle up group debts." 
          />
          <FeatureCard 
            icon={<Shield className="text-purple-500" />} 
            title="Secure & Private" 
            desc="Your data is protected by Firebase-grade security and encryption." 
          />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
    <div className="mb-4 bg-gray-50 w-12 h-12 flex items-center justify-center rounded-xl">{icon}</div>
    <h4 className="text-xl font-bold mb-2 text-gray-800">{title}</h4>
    <p className="text-gray-500 leading-relaxed">{desc}</p>
  </div>
);

export default Home;