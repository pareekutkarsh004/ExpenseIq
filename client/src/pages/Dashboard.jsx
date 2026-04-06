import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  LayoutDashboard, Users, Receipt, Plus, LogOut, 
  ArrowUpRight, ArrowDownLeft, X, CreditCard, ChevronDown, 
  Trash2, UserPlus, Zap, Settings, Check
} from "lucide-react";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  
  const [balances, setBalances] = useState({ balances: [] });
  const [groups, setGroups] = useState([]); 
  const [friends, setFriends] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [simplifiedDebts, setSimplifiedDebts] = useState([]);
  
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // New Toggle States for Expense History
  const [showAllGlobalExpenses, setShowAllGlobalExpenses] = useState(false);
  const [showAllGroupExpenses, setShowAllGroupExpenses] = useState(false);

  // Form States
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [isCustomSplit, setIsCustomSplit] = useState(false);
  const [customAmounts, setCustomAmounts] = useState({});
  const [memberEmail, setMemberEmail] = useState("");

  const fetchData = async () => {
    try {
      const bRes = await api.get("/expenses/balances");
      setBalances(bRes.data || { balances: [] });
      const gRes = await api.get("/groups");
      setGroups(gRes.data.groups || []);
      const eRes = await api.get("/expenses");
      setRecentExpenses(eRes.data || []);
      const uRes = await api.get("/users/current-user");
      setFriends(uRes.data.friends || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [user]);

  const handleViewGroup = async (groupId) => {
    try {
      const res = await api.get(`/groups/${groupId}`);
      setSelectedGroup(res.data);
      const simplifyRes = await api.get(`/groups/${groupId}/simplify`);
      setSimplifiedDebts(simplifyRes.data.transactions || []);
      setSelectedParticipants([user._id]);
      setShowAllGroupExpenses(false); // Reset toggle when switching groups
    } catch (err) {
      console.error("Error loading group details", err);
    }
  };

  const toggleParticipant = (userId) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const total = Number(expenseAmount);
    let finalSplits = [];
    let payload = {};

    if (!selectedGroup) {
      finalSplits = [{ user: user._id, amount: total }];
      payload = {
        description: expenseDesc,
        amount: total,
        group: null,
        participants: [user._id],
        splits: finalSplits
      };
    } else {
      const participants = selectedParticipants.length > 0 ? selectedParticipants : [user._id];
      if (isCustomSplit) {
        finalSplits = participants.map(id => ({ user: id, amount: Number(customAmounts[id] || 0) }));
        const sum = finalSplits.reduce((acc, curr) => acc + curr.amount, 0);
        if (sum !== total) return alert(`Sum must match ₹${total}`);
      } else {
        const split = Number((total / participants.length).toFixed(2));
        finalSplits = participants.map(id => ({ user: id, amount: split }));
      }
      payload = {
        description: expenseDesc,
        amount: total,
        group: selectedGroup.group._id,
        participants: participants,
        splits: finalSplits
      };
    }

    try {
      await api.post("/expenses", payload);
      setIsExpenseModalOpen(false);
      setExpenseDesc("");
      setExpenseAmount("");
      setIsCustomSplit(false);
      setCustomAmounts({});
      fetchData();
      if (selectedGroup) handleViewGroup(selectedGroup.group._id);
    } catch (err) { alert(err.response?.data?.message); }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm("Delete expense?")) {
      await api.delete(`/expenses/${id}`);
      fetchData();
      if (selectedGroup) handleViewGroup(selectedGroup.group._id);
    }
  };

  const handleLogout = async () => { await logout(); navigate("/login"); };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-emerald-600">Syncing...</div>;

  const totalOwed = balances.balances?.filter(b => b.type === "owes_you").reduce((s, b) => s + b.amount, 0) || 0;
  const totalOwe = balances.balances?.filter(b => b.type === "you_owe").reduce((s, b) => s + b.amount, 0) || 0;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
      <aside className="w-64 bg-white border-r flex flex-col shadow-sm">
        <div onClick={() => { setSelectedGroup(null); navigate("/dashboard"); }} className="p-8 cursor-pointer text-center">
          <h1 className="text-2xl font-black text-emerald-600 tracking-tighter">ExpenseIQ</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <div onClick={() => setSelectedGroup(null)} className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold cursor-pointer transition-all ${!selectedGroup ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}>
            <LayoutDashboard size={20} /> <span>Dashboard</span>
          </div>

          <div className="pt-6 pb-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between items-center">
            <span>Groups</span>
            <button onClick={() => setIsGroupModalOpen(true)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded-full"><Plus size={18}/></button>
          </div>
          {groups.map(g => (
            <div key={g._id} onClick={() => handleViewGroup(g._id)} className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all text-sm font-bold ${selectedGroup?.group?._id === g._id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Users size={16} /> <span className="truncate">{g.name}</span>
            </div>
          ))}

          <div className="pt-6 pb-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Friends</div>
          {friends.map(f => (
            <div key={f.user._id} className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl cursor-pointer">
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px]">{f.user.name.charAt(0)}</div>
              <span className="truncate">{f.user.name}</span>
            </div>
          ))}
        </nav>
        <div className="p-6 border-t">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-500 font-bold text-sm hover:bg-red-50 rounded-2xl transition-all">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tight">Hello, {user?.name || "Utkarsh Pareek"}</h2>
            <p className="text-gray-400 font-bold mt-1 uppercase text-[10px] tracking-widest">{selectedGroup ? "Group View" : "Global Overview"} • ₹ Rupees</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsExpenseModalOpen(true)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2">
              <CreditCard size={20} /> Add Expense
            </button>
            <div className="relative" ref={profileRef}>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 bg-white border p-2 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-black">{user?.name?.charAt(0) || "U"}</div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white border rounded-2xl shadow-2xl z-50 p-2">
                   <div className="p-3 border-b mb-1"><p className="text-[10px] font-black text-gray-400 uppercase">Account</p><p className="text-sm font-bold truncate">{user?.email}</p></div>
                   <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-bold mt-1"><LogOut size={16}/> Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {!selectedGroup ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 text-center">
              <StatCard title="Total Balance" amount={totalOwed - totalOwe} color="text-gray-900" icon={<Receipt size={24}/>} />
              <StatCard title="You owe" amount={totalOwe} color="text-orange-600" icon={<ArrowDownLeft size={24}/>} />
              <StatCard title="You are owed" amount={totalOwed} color="text-emerald-600" icon={<ArrowUpRight size={24}/>} />
            </div>
            <div className="bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black flex items-center gap-2">Recent Global Activity</h3>
                  {recentExpenses.length > 5 && (
                    <button 
                      onClick={() => setShowAllGlobalExpenses(!showAllGlobalExpenses)}
                      className="text-emerald-600 font-black text-xs uppercase tracking-widest hover:underline"
                    >
                      {showAllGlobalExpenses ? "Show Less" : "See All"}
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                    {recentExpenses.length > 0 ? (
                      (showAllGlobalExpenses ? recentExpenses : recentExpenses.slice(0, 5)).map(exp => (
                        <div key={exp._id} className="flex justify-between items-center p-6 bg-gray-50 rounded-[32px] border border-transparent hover:border-emerald-100 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-white rounded-2xl shadow-sm text-emerald-600"><Receipt size={20}/></div>
                                <div>
                                  <p className="font-bold">{exp.description}</p>
                                  <p className="text-[10px] font-black text-gray-400 uppercase">
                                    {exp.group ? `Group: ${exp.group.name}` : "Personal"} • Paid by {exp.paidBy.name}
                                  </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <p className="font-black text-xl">₹{exp.amount.toFixed(2)}</p>
                                <button onClick={() => handleDeleteExpense(exp._id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))) : <p className="text-center text-gray-400 font-bold py-10 italic">No expenses yet.</p>}
                </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black flex items-center gap-2"><Zap size={24} className="text-orange-500"/> Settle Up IQ</h3>
                    <button onClick={() => setIsAddMemberOpen(true)} className="flex items-center gap-2 text-emerald-600 font-black text-xs bg-emerald-50 px-4 py-2 rounded-full uppercase tracking-widest"><UserPlus size={16}/> Invite Member</button>
                </div>
                <div className="space-y-4">
                    {simplifiedDebts.length > 0 ? simplifiedDebts.map((t, i) => (
                        <div key={i} className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100 flex justify-between items-center">
                            <p className="font-bold text-gray-700">{t.from.name} owes {t.to.name}</p>
                            <p className="font-black text-orange-600 text-xl">₹{t.amount}</p>
                        </div>
                    )) : <p className="text-center text-gray-400 font-bold py-10 italic">Group is settled!</p>}
                </div>
              </div>
              <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm">
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black">Group History</h3>
                    {selectedGroup.expenses.length > 5 && (
                      <button 
                        onClick={() => setShowAllGroupExpenses(!showAllGroupExpenses)}
                        className="text-emerald-600 font-black text-xs uppercase tracking-widest hover:underline"
                      >
                        {showAllGroupExpenses ? "Show Less" : "See All"}
                      </button>
                    )}
                 </div>
                 <div className="space-y-4">
                    {(showAllGroupExpenses ? selectedGroup.expenses : selectedGroup.expenses.slice(0, 5)).map(e => (
                        <div key={e._id} className="flex justify-between items-center p-5 bg-gray-50 rounded-3xl border border-transparent hover:border-emerald-100 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-gray-400"><Receipt size={18}/></div>
                                <div>
                                  <p className="font-bold text-sm">{e.description}</p>
                                  <p className="text-[10px] font-black text-gray-400 uppercase">
                                    Paid by {e.paidBy.name} • Splitted with {e.participants.length} members
                                  </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="font-black text-lg">₹{e.amount}</p>
                              <button onClick={() => handleDeleteExpense(e._id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>
            </div>
            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm h-fit text-center">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Members</h4>
                <div className="flex flex-wrap justify-center gap-3">
                    {selectedGroup.group.members.map(m => (
                        <div key={m._id} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-500 text-xs shadow-sm" title={m.name}>{m.name.charAt(0)}</div>
                    ))}
                </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ADD EXPENSE */}
      {isExpenseModalOpen && (
        <Modal title="Add Expense" close={() => setIsExpenseModalOpen(false)}>
          <form onSubmit={handleAddExpense} className="space-y-6">
            <div className="bg-emerald-50 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                {selectedGroup ? `Target: ${selectedGroup.group.name}` : "Mode: Personal Tracking"}
              </p>
            </div>
            <input type="text" placeholder="Description" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold" required />
            <div className="relative">
              <span className="absolute left-5 top-5 font-black text-gray-400">₹</span>
              <input type="number" placeholder="0.00" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="w-full p-5 pl-10 bg-gray-50 rounded-2xl outline-none font-bold" required />
            </div>

            {selectedGroup && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Participants</p>
                  <button type="button" onClick={() => setIsCustomSplit(!isCustomSplit)} className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border transition-all ${isCustomSplit ? 'bg-emerald-600 text-white' : 'text-gray-400'}`}>
                    Custom Split
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedGroup.group.members.map(m => {
                    const isSelected = selectedParticipants.includes(m._id);
                    return (
                      <div key={m._id} className="space-y-2">
                        <button type="button" onClick={() => toggleParticipant(m._id)} className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${isSelected ? 'bg-emerald-50 text-emerald-700 border-emerald-600' : 'text-gray-400 border-gray-100'}`}>
                          <span className="truncate">{m.name}</span>
                          {isSelected && <Check size={14}/>}
                        </button>
                        {isCustomSplit && isSelected && (
                          <div className="relative">
                            <span className="absolute left-2 top-2 text-[10px] text-gray-400">₹</span>
                            <input type="number" placeholder="0.00" value={customAmounts[m._id] || ""} onChange={(e) => setCustomAmounts({...customAmounts, [m._id]: e.target.value})} className="w-full p-2 pl-5 bg-white border rounded-lg text-xs font-bold outline-none border-emerald-100" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-lg">
              {selectedGroup ? 'Split with Group' : 'Log Personal'}
            </button>
          </form>
        </Modal>
      )}

      {isGroupModalOpen && (
        <Modal title="New Group" close={() => setIsGroupModalOpen(false)}>
          <form onSubmit={(e) => { e.preventDefault(); api.post("/groups", { name: newGroupName, description: newGroupDesc }).then(() => { setIsGroupModalOpen(false); fetchData(); }); }} className="space-y-4">
            <input type="text" placeholder="Group Name" onChange={(e) => setNewGroupName(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold" required />
            <input type="text" placeholder="Description" onChange={(e) => setNewGroupDesc(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold" />
            <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-lg">Create Group</button>
          </form>
        </Modal>
      )}

      {isAddMemberOpen && (
        <Modal title="Invite Member" close={() => setIsAddMemberOpen(false)}>
          <form onSubmit={(e) => { e.preventDefault(); api.get('/users/all-users').then(res => { const target = res.data.find(u => u.email === memberEmail); api.post(`/groups/${selectedGroup.group._id}/add-member`, { userId: target._id }).then(() => { setIsAddMemberOpen(false); handleViewGroup(selectedGroup.group._id); }); }); }} className="space-y-4">
            <input type="email" placeholder="Email Address" onChange={(e) => setMemberEmail(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold" required />
            <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-lg">Invite & Sync</button>
          </form>
        </Modal>
      )}
    </div>
  );
};

const Modal = ({ title, children, close }) => (
  <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-6">
    <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in duration-200">
      <div className="flex justify-between items-center mb-8"><h3 className="text-3xl font-black text-gray-800">{title}</h3><button onClick={close}><X size={24} className="text-gray-400 hover:text-gray-900"/></button></div>
      {children}
    </div>
  </div>
);

const StatCard = ({ title, amount, color, icon }) => (
  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 flex items-start justify-between">
    <div><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">{title}</p><p className={`text-4xl font-black ${color}`}>₹{Math.abs(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p></div>
    <div className="p-4 bg-gray-50 rounded-2xl text-gray-200">{icon}</div>
  </div>
);

export default Dashboard;