// src/pages/Home.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  CheckCircle,
  Zap,
  Shield,
  ArrowRight,
  Users,
  Coins,
  MessageSquare,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  Star,
  Sparkles,
  Lock,
  Smartphone,
  Info,
  DollarSign
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mobile navbar toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState(null);

  // Interactive Calculator state
  const [calcAmount, setCalcAmount] = useState("1200");
  const [calcPeople, setCalcPeople] = useState(3);
  const [calcPaidBy, setCalcPaidBy] = useState("You");

  // Simulated Dashboard State for Hero mockup
  const [mockExpenses, setMockExpenses] = useState([
    { id: 1, title: "Pizza Night 🍕", amount: 1500, paidBy: "You", time: "Just now" },
    { id: 2, title: "Cab to Airport 🚕", amount: 900, paidBy: "Rohan", time: "2 hrs ago" },
    { id: 3, title: "Netflix Shared 🎬", amount: 650, paidBy: "Priya", time: "Yesterday" },
  ]);
  const [newMockTitle, setNewMockTitle] = useState("");
  const [newMockAmount, setNewMockAmount] = useState("");
  const [newMockPaidBy, setNewMockPaidBy] = useState("You");

  const addMockExpense = (e) => {
    e.preventDefault();
    if (!newMockTitle || !newMockAmount) return;
    const expense = {
      id: Date.now(),
      title: newMockTitle,
      amount: parseFloat(newMockAmount),
      paidBy: newMockPaidBy,
      time: "Just now",
    };
    setMockExpenses([expense, ...mockExpenses.slice(0, 2)]);
    setNewMockTitle("");
    setNewMockAmount("");
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Calculator logic
  const parseAmount = parseFloat(calcAmount) || 0;
  const perPersonAmount = (parseAmount / calcPeople).toFixed(2);
  const friends = ["You", "Amit", "Sneha", "Rohit", "Priya"].slice(0, calcPeople);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased scroll-smooth">
      {/* Background decoration elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-30 -z-10 animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-teal-100 rounded-full blur-3xl opacity-30 -z-10"></div>

      {/* Sticky Glassmorphism Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/75 border-b border-slate-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <div className="bg-emerald-600 text-white p-2 rounded-2xl shadow-lg shadow-emerald-200">
                <Coins size={24} className="animate-spin-slow" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                Expense<span className="text-emerald-600">IQ</span>
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8 font-semibold text-slate-600 text-sm">
              <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How It Works</a>
              <a href="#calculator" className="hover:text-emerald-600 transition-colors">Try Calculator</a>
              <a href="#testimonials" className="hover:text-emerald-600 transition-colors">Reviews</a>
              <a href="#faq" className="hover:text-emerald-600 transition-colors">FAQ</a>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-slate-950 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-100 transition-all duration-300 active:scale-95 text-sm"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    className="text-slate-600 font-bold hover:text-slate-900 transition-colors text-sm px-4 py-2"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:shadow-emerald-200 transition-all duration-300 active:scale-95 text-sm"
                  >
                    Start Exploring
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-700 p-2 hover:bg-slate-100 rounded-xl transition-all"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 border-b border-slate-100 animate-slide-in">
            <div className="px-4 pt-2 pb-6 space-y-3 font-semibold text-slate-700">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-emerald-600 transition-all"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-emerald-600 transition-all"
              >
                How It Works
              </a>
              <a
                href="#calculator"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-emerald-600 transition-all"
              >
                Try Calculator
              </a>
              <a
                href="#testimonials"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-emerald-600 transition-all"
              >
                Reviews
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-emerald-600 transition-all"
              >
                FAQ
              </a>
              <hr className="border-slate-100 my-2" />
              {user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/dashboard");
                  }}
                  className="w-full text-center bg-slate-900 text-white py-3 rounded-xl font-bold shadow-md hover:bg-emerald-600 transition-all"
                >
                  Go to Dashboard
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/login");
                    }}
                    className="w-full text-center border border-slate-200 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/login");
                    }}
                    className="w-full text-center bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                  >
                    Start Exploring
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Hero Content (Left) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Promo badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs sm:text-sm tracking-wide shadow-sm border border-emerald-100 animate-bounce">
              <Sparkles size={16} />
              <span>Smart Debt Simplification Included</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
              Share expenses, <br className="hidden sm:inline" />
              Not the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">stress.</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              ExpenseIQ is the easiest way to split bills, settle debts, and manage group expenses with friends, family, and roommates in <span className="text-slate-950 font-bold">₹ Rupees</span>. Zero ads. Free forever.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <button
                onClick={() => navigate("/login")}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-100 transition-all duration-300 active:scale-[0.98]"
              >
                Start Exploring <ArrowRight size={20} />
              </button>
              <a
                href="#calculator"
                className="flex items-center justify-center gap-2 bg-white text-slate-700 border-2 border-slate-200 px-8 py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-slate-50 hover:border-slate-350 transition-all duration-300"
              >
                Try Quick Split
              </a>
            </div>

            {/* Quick Micro Social Proof */}
            <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={18} className="text-emerald-500" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">No Credit Card Needed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={18} className="text-emerald-500" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">10,000+ Active Users</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Mockup (Right) */}
          <div className="lg:col-span-5 relative w-full max-w-md sm:max-w-lg mx-auto">
            {/* Visual background glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-200 to-emerald-400 rounded-[40px] blur-2xl opacity-20 -rotate-6"></div>

            {/* Simulated Live App Card */}
            <div className="relative bg-white rounded-3xl shadow-[0_25px_50px_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-8 space-y-6">
              {/* Card Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg">Trip to Himachal 🏔️</h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Group Balance Sheet</p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-100">
                  3 Members
                </div>
              </div>

              {/* Balances list */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                      Y
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">You</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Group Creator</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-600 font-extrabold text-sm">+₹1,450</span>
                    <p className="text-[10px] text-slate-400 font-semibold">get back</p>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-sm">
                      R
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">Rohan</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Member</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-rose-500 font-extrabold text-sm">-₹900</span>
                    <p className="text-[10px] text-slate-400 font-semibold">owes</p>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-sm">
                      P
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">Priya</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Member</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-rose-500 font-extrabold text-sm">-₹550</span>
                    <p className="text-[10px] text-slate-400 font-semibold">owes</p>
                  </div>
                </div>
              </div>

              {/* Debt Simplified Badge */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl flex items-center gap-3">
                <div className="bg-emerald-500 text-white p-1 rounded-lg">
                  <Zap size={14} />
                </div>
                <div className="text-xs text-emerald-800 font-bold">
                  IQ Simplification: <span className="underline decoration-wavy">Priya owes You ₹550, Rohan owes You ₹900</span>.
                </div>
              </div>

              {/* Interactive Demo Mini Log */}
              <form onSubmit={addMockExpense} className="pt-2 space-y-3">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider ml-1">Simulate adding an expense</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Dinner"
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs font-semibold placeholder:text-slate-300"
                    value={newMockTitle}
                    onChange={(e) => setNewMockTitle(e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Amount (₹)"
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs font-semibold placeholder:text-slate-300"
                    value={newMockAmount}
                    onChange={(e) => setNewMockAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    className="w-1/2 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-emerald-500"
                    value={newMockPaidBy}
                    onChange={(e) => setNewMockPaidBy(e.target.value)}
                  >
                    <option value="You">Paid by You</option>
                    <option value="Rohan">Paid by Rohan</option>
                    <option value="Priya">Paid by Priya</option>
                  </select>
                  <button
                    type="submit"
                    className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-colors active:scale-95"
                  >
                    + Add Expense
                  </button>
                </div>
              </form>

              {/* Recent Activity List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Recent Activity (Live Feed)</p>
                <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
                  {mockExpenses.map((exp) => (
                    <div key={exp.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="font-extrabold text-slate-800">{exp.title}</span>
                        <span className="text-slate-400 text-[10px] ml-1">({exp.paidBy} paid)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-700">₹{exp.amount}</span>
                        <span className="block text-[8px] text-slate-400 font-semibold">{exp.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Authenticity / Trust Badges Section */}
      <section className="bg-slate-900 text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-850 via-slate-900 to-slate-950 -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          {/* Heading */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-extrabold tracking-[0.25em] text-emerald-400">Authentic & Verified</h3>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">The preferred ledger app for smarter groups</h2>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 max-w-5xl mx-auto divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <div className="pt-6 md:pt-0 space-y-2">
              <p className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">₹1.5Cr+</p>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">Total Expenses Split</p>
            </div>
            <div className="pt-6 md:pt-0 space-y-2">
              <p className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">25,000+</p>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">Active Groups Created</p>
            </div>
            <div className="pt-6 md:pt-0 space-y-2">
              <p className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">4.9 ★</p>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">Average App Rating</p>
            </div>
            <div className="pt-6 md:pt-0 space-y-2">
              <p className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">99.99%</p>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">Server Uptime Uptime</p>
            </div>
          </div>

          {/* Authenticity Badges list */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 pt-4">
            <div className="flex items-center gap-3 bg-slate-850 px-5 py-3 rounded-2xl border border-slate-800 shadow-lg">
              <Lock className="text-emerald-400" size={20} />
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-wider">SSL Security</p>
                <p className="text-[10px] text-slate-400">Firebase Encrypted</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-850 px-5 py-3 rounded-2xl border border-slate-800 shadow-lg">
              <CheckCircle className="text-emerald-400" size={20} />
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-wider">100% Free</p>
                <p className="text-[10px] text-slate-400">No Hidden Costs</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-850 px-5 py-3 rounded-2xl border border-slate-800 shadow-lg">
              <Smartphone className="text-emerald-400" size={20} />
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-wider">Mobile First</p>
                <p className="text-[10px] text-slate-400">PWA Desktop/Mobile</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-block bg-emerald-50 text-emerald-700 font-extrabold text-xs px-4 py-2 rounded-full uppercase tracking-widest border border-emerald-100">
            Simplification Process
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How ExpenseIQ settles bills in 3 steps
          </h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Our app sits between roommates or trip friends so no one feels awkward talking about balances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 max-w-5xl mx-auto relative">
          {/* Connector Line (hidden on mobile) */}
          <div className="hidden md:block absolute top-1/2 left-12 right-12 h-1 bg-slate-100 -z-10"></div>

          {/* Step 1 */}
          <div className="flex flex-col items-center text-center space-y-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 font-extrabold flex items-center justify-center text-2xl shadow-sm border border-emerald-100">
              1
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">Create a Group</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Create a group for your flatmates, holiday trip, or dinner party and invite them in a single tap.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center space-y-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 font-extrabold flex items-center justify-center text-2xl shadow-sm border border-emerald-100">
              2
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">Add Expenses</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Log bills, groceries, tickets, or rent on the go. Choose who paid and how the expense is split.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center space-y-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 font-extrabold flex items-center justify-center text-2xl shadow-sm border border-emerald-100">
              3
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">Auto-Settle Debts</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Our IQ logic simplifies debts, letting group members pay each other back in the absolute fewest steps.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Quick-Split Calculator Section */}
      <section id="calculator" className="py-20 bg-emerald-600 text-white relative overflow-hidden">
        {/* Decorative Blur Spheres */}
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-emerald-500 rounded-full blur-3xl opacity-50 -z-10"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500 rounded-full blur-3xl opacity-55 -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-block bg-white/10 backdrop-blur-md text-white font-extrabold text-xs px-4 py-2 rounded-full uppercase tracking-wider border border-white/20">
              Try It Live
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Test drive the ExpenseIQ Splitter
            </h2>
            <p className="text-emerald-100 font-medium text-lg leading-relaxed max-w-xl">
              Type in a bill amount, select how many roommates are splitting, and choose who paid. See how instantly we break it down.
            </p>
            <div className="space-y-4 pt-4 text-emerald-100 text-sm font-semibold max-w-md mx-auto lg:mx-0">
              <div className="flex items-center gap-3">
                <CheckCircle size={18} className="text-white" />
                <span>Splits down to the decimal point instantly</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle size={18} className="text-white" />
                <span>Calculates clear, individual settle-up ratios</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle size={18} className="text-white" />
                <span>Allows manual customizations in-app</span>
              </div>
            </div>
          </div>

          {/* Right Widget */}
          <div className="lg:col-span-6">
            <div className="bg-white text-slate-800 rounded-[32px] shadow-2xl p-6 sm:p-8 max-w-md mx-auto border border-white/10 space-y-6">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl mb-1">Quick Splitter</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Test Sandbox</p>
              </div>

              {/* Bill Amount Input */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">Total Bill Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">₹</span>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-black text-lg text-slate-800 placeholder:text-slate-350"
                  />
                </div>
              </div>

              {/* Number of People */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">Number of Friends</label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCalcPeople(num)}
                      className={`py-3 rounded-xl font-bold transition-all text-sm border-2 ${
                        calcPeople === num
                          ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                          : "bg-slate-50 border-transparent hover:bg-slate-100 text-slate-650"
                      }`}
                    >
                      {num} People
                    </button>
                  ))}
                </div>
              </div>

              {/* Paid By Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">Paid By</label>
                <div className="grid grid-cols-3 gap-2">
                  {friends.map((friend) => (
                    <button
                      key={friend}
                      type="button"
                      onClick={() => setCalcPaidBy(friend)}
                      className={`py-3 px-2 rounded-xl font-bold transition-all text-xs border ${
                        calcPaidBy === friend
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                          : "bg-slate-50 border-slate-150 hover:bg-slate-100 text-slate-500"
                      }`}
                    >
                      {friend} Paid
                    </button>
                  ))}
                </div>
              </div>

              {/* Settle Up Result Display */}
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                  <span className="text-xs text-slate-550 font-bold uppercase tracking-wider">Per Person Split</span>
                  <span className="text-base font-black text-emerald-700">₹{perPersonAmount}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Calculated balances:</p>
                  {friends.map((friend) => {
                    const isPayer = friend === calcPaidBy;
                    if (isPayer) {
                      const shareBack = parseAmount - parseFloat(perPersonAmount);
                      return (
                        <div key={friend} className="flex justify-between items-center text-slate-700">
                          <span className="font-bold">{friend} ({isPayer ? "Payer" : "Member"})</span>
                          <span className="font-black text-emerald-600">Gets back ₹{shareBack.toFixed(2)}</span>
                        </div>
                      );
                    } else {
                      return (
                        <div key={friend} className="flex justify-between items-center text-slate-700">
                          <span className="font-bold">{friend}</span>
                          <span className="font-black text-rose-500">Owes {calcPaidBy} ₹{perPersonAmount}</span>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>

              {/* Ready CTA inside Sandbox */}
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-slate-900 hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-100 text-white font-extrabold text-base py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
              >
                Log this live on ExpenseIQ <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Matrix Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-block bg-emerald-50 text-emerald-700 font-extrabold text-xs px-4 py-2 rounded-full uppercase tracking-widest border border-emerald-100">
            Robust Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Packed with smart features you'll actually use
          </h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            We built ExpenseIQ because simple group splits shouldn't require complex spreadsheet formulas or multiple balance apps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Zap className="text-emerald-600" size={24} />}
            title="Debt Simplification"
            desc="Our IQ algorithm auto-combines transactions to clear debts with the absolute minimum number of payment handovers."
          />
          <FeatureCard
            icon={<CheckCircle className="text-emerald-600" size={24} />}
            title="Real-Time Sync"
            desc="Add an expense on your phone and watch balances update instantly on your friends' devices. Built with cloud-synced listeners."
          />
          <FeatureCard
            icon={<Shield className="text-emerald-600" size={24} />}
            title="Secure Data Backups"
            desc="Keep your transaction log safe. Secure authentication handles authorization so your personal finances remain completely private."
          />
          <FeatureCard
            icon={<Sparkles className="text-emerald-600" size={24} />}
            title="Zero Ads, Pure Speed"
            desc="No annoying popup banners, no paywalls. A clean, responsive interface optimized for absolute speed on the move."
          />
          <FeatureCard
            icon={<Smartphone className="text-emerald-600" size={24} />}
            title="Optimized for Rupee"
            desc="Designed specifically for domestic needs. Record payments in Indian Rupees (₹) and trace transaction histories smoothly."
          />
          <FeatureCard
            icon={<Lock className="text-emerald-600" size={24} />}
            title="Settle up via UPI"
            desc="Provides a visual ledger of settlement transactions. Tap to confirm you paid via cash or any UPI app like GPay/PhonePe."
          />
        </div>
      </section>

      {/* Testimonials (Authenticity Verification) */}
      <section id="testimonials" className="bg-slate-100 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-block bg-white text-emerald-700 font-extrabold text-xs px-4 py-2 rounded-full uppercase tracking-widest shadow-sm border border-slate-200">
              User Testimonials
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Loved by thousands of friends & flatmates
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              Read real-world reviews from people who upgraded their spreadsheet splits to ExpenseIQ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Review 1 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                </div>
                <p className="text-slate-600 font-medium text-sm leading-relaxed italic">
                  "We split rent, Wi-Fi, and groceries across 4 roommates. ExpenseIQ saved us hours of calculation and prevented so many arguments! Truly smart calculations."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  RM
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Rohan Mehta</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Flatmate, Bangalore</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                </div>
                <p className="text-slate-600 font-medium text-sm leading-relaxed italic">
                  "Perfect for travel. We tracked a 7-day roadtrip to Manali with 8 friends, and the final settle-up calculations took literally 10 seconds. The debt simplifier is magic."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  SK
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Shruti Kapoor</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Travel Blogger, Delhi</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                </div>
                <p className="text-slate-600 font-medium text-sm leading-relaxed italic">
                  "Simple, clean, and blazing fast. I love the minimalist design and how easily it simplifies group debts. Best of all, no advertisements to distract you."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  YP
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Yash Patel</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Software Engineer, Mumbai</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-block bg-emerald-50 text-emerald-700 font-extrabold text-xs px-4 py-2 rounded-full uppercase tracking-widest border border-emerald-100">
            Got Questions?
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Quick answers to help you get started with splitting your first bill.
          </p>
        </div>

        {/* FAQ Accordion container */}
        <div className="space-y-4">
          <FaqItem
            question="Is ExpenseIQ really free to use?"
            answer="Yes, ExpenseIQ is 100% free with no hidden charges, premium paywalls, or features hidden behind credit cards. We plan to keep the core expense splitting logic completely free."
            isOpen={openFaq === 0}
            onClick={() => toggleFaq(0)}
          />
          <FaqItem
            question="How does the Debt Simplification algorithm work?"
            answer="If Member A owes Member B ₹500, and Member B owes Member C ₹500, ExpenseIQ automatically simplifies it so A pays C ₹500 directly, cutting out the middle transaction. This reduces transaction volume and keeps settle-ups clean."
            isOpen={openFaq === 1}
            onClick={() => toggleFaq(1)}
          />
          <FaqItem
            question="Can I record cash settlements?"
            answer="Yes, absolutely! When you pay someone back via cash, GPay, PhonePe, Paytm, or net banking, you simply record a settlement in ExpenseIQ, and balances adjust immediately."
            isOpen={openFaq === 2}
            onClick={() => toggleFaq(2)}
          />
          <FaqItem
            question="Is my personal financial data secure?"
            answer="Yes. We rely on Firebase Authentication to restrict access to authorized group members. Only users added to a specific group can view its balance sheets or expense logs."
            isOpen={openFaq === 3}
            onClick={() => toggleFaq(3)}
          />
          <FaqItem
            question="Can I use ExpenseIQ on my phone?"
            answer="Yes! ExpenseIQ is built as a responsive web app. You can load it in any mobile browser, log in, and even add it to your home screen as a Progressive Web App for instant access on the go."
            isOpen={openFaq === 4}
            onClick={() => toggleFaq(4)}
          />
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="bg-slate-900 text-white py-20 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-500/20 -z-10"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
            Ready to split bills the smart way?
          </h2>
          <p className="text-slate-400 font-medium text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Create an account in 30 seconds and start tracking expenses with your flatmates or travel group today.
          </p>
          <div className="pt-4">
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white font-extrabold text-base sm:text-lg px-8 py-4 rounded-2xl shadow-xl shadow-emerald-900/30 hover:bg-emerald-700 transition-all duration-300 active:scale-95"
            >
              Start Exploring <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Premium Footer Section */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white p-1.5 rounded-xl">
              <Coins size={18} />
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              Expense<span className="text-emerald-600">IQ</span>
            </span>
            <span className="text-xs text-slate-650 ml-2">
              © {new Date().getFullYear()} ExpenseIQ. All rights reserved.
            </span>
          </div>

          {/* Social / Info Links */}
          <div className="flex gap-6 text-sm font-semibold">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#calculator" className="hover:text-white transition-colors">Calculator</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <span className="text-slate-800">|</span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Shield size={14} className="text-emerald-500" /> Secure SSL Ledger
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Reusable components
const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
    <div className="mb-4 bg-slate-50 w-12 h-12 flex items-center justify-center rounded-2xl group-hover:bg-emerald-50 transition-colors duration-300">
      {icon}
    </div>
    <h4 className="text-lg font-extrabold mb-2 text-slate-800 group-hover:text-emerald-600 transition-colors duration-300">
      {title}
    </h4>
    <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
  </div>
);

const FaqItem = ({ question, answer, isOpen, onClick }) => (
  <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden transition-all shadow-sm">
    <button
      onClick={onClick}
      className="w-full flex justify-between items-center p-6 text-left font-extrabold text-slate-800 hover:text-emerald-600 transition-colors duration-300"
    >
      <span className="text-sm sm:text-base pr-4">{question}</span>
      <ChevronDown
        size={18}
        className={`text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-emerald-500" : ""}`}
      />
    </button>
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? "max-h-48 border-t border-slate-100" : "max-h-0"
      }`}
    >
      <div className="p-6 text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
        {answer}
      </div>
    </div>
  </div>
);

export default Home;