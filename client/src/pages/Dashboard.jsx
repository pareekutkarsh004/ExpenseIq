import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import axios from "axios";
import { 
  LayoutDashboard, Users, Receipt, Plus, LogOut, 
  ArrowUpRight, ArrowDownLeft, X, CreditCard, ChevronDown, 
  Trash2, UserPlus, Zap, Check, Edit2, User, Mail, Phone, Camera, Menu
} from "lucide-react";

const Dashboard = () => {
  const { user, logout, updateCurrentUser } = useAuth();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  
  const [balances, setBalances] = useState({
     balances: [],
     totalYouOwe: 0,
     totalYouAreOwed: 0,
     totalBalance: 0,
     personalTotal: 0   // ✅ added
     });
  const [groups, setGroups] = useState([]); 
  const [friends, setFriends] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedFriendLedger, setSelectedFriendLedger] = useState(null);
  const [simplifiedDebts, setSimplifiedDebts] = useState([]);
  
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isRemoveMembersOpen, setIsRemoveMembersOpen] = useState(false);
  const [isProfileView, setIsProfileView] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // New Toggle States for Expense History
  const [showAllGlobalExpenses, setShowAllGlobalExpenses] = useState(false);
  const [showAllGroupExpenses, setShowAllGroupExpenses] = useState(false);
  const [showSettledFriendExpenses, setShowSettledFriendExpenses] = useState(false);

  // Form States
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [isCustomSplit, setIsCustomSplit] = useState(false);
  const [customAmounts, setCustomAmounts] = useState({});
  const [memberEmail, setMemberEmail] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [selectedFriendsToInvite, setSelectedFriendsToInvite] = useState([]);
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [selectedMembersToRemove, setSelectedMembersToRemove] = useState([]);
  const [removeMembersAcknowledged, setRemoveMembersAcknowledged] = useState(false);

  const fetchData = async () => {
    try {
      const bRes = await api.get("/expenses/balances");
      setBalances(bRes.data);
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

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfilePhone(user.phoneNumber || "");
      setProfileAvatar(user.avatar || "");
    }
  }, [user, isProfileView]);

  const handleViewGroup = async (groupId) => {
    try {
      const res = await api.get(`/groups/${groupId}`);
      setSelectedGroup(res.data);
      setSelectedFriend(null);
      setSelectedFriendLedger(null);
      setIsProfileView(false);
      const simplifyRes = await api.get(`/groups/${groupId}/simplify`);
      setSimplifiedDebts(simplifyRes.data.transactions || []);
      setSelectedParticipants([user._id]);
      setShowAllGroupExpenses(false); // Reset toggle when switching groups
    } catch (err) {
      console.error("Error loading group details", err);
    }
  };

  const handleViewFriend = async (friend) => {
    try {
      const res = await api.get(`/users/friends/${friend.user._id}/ledger`);
      setSelectedGroup(null);
      setSelectedFriend(friend.user);
      setSelectedFriendLedger(res.data);
      setIsProfileView(false);
      setShowSettledFriendExpenses(false);
    } catch (err) {
      console.error("Error loading friend ledger", err);
    }
  };

  const refreshSelectedFriendLedger = async () => {
    if (!selectedFriend) return;

    try {
      const res = await api.get(`/users/friends/${selectedFriend._id}/ledger`);
      setSelectedFriendLedger(res.data);
    } catch (err) {
      console.error("Error refreshing friend ledger", err);
    }
  };

  const toggleParticipant = (userId) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  const toggleMemberForRemoval = (memberId) => {
    setSelectedMembersToRemove((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    );
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
      const participants =
  selectedParticipants.length > 0
    ? selectedParticipants
    : selectedGroup?.group?.members?.map(m => m._id) || [user._id];
      if (isCustomSplit) {
  finalSplits = participants.map(id => ({
    user: id,
    amount: Number((customAmounts[id] || 0))
  }));

  // ✅ Fix floating precision issue
  const sum = finalSplits.reduce((acc, curr) => acc + curr.amount, 0);

  if (Number(sum.toFixed(2)) !== Number(total.toFixed(2))) {
    return alert(`Sum must match ₹${total}`);
  }

} else {
  // ✅ Equal split with precision fix
  const baseSplit = Math.floor((total / participants.length) * 100) / 100;
  let remaining = Number((total - baseSplit * participants.length).toFixed(2));

  finalSplits = participants.map((id) => {
    let amount = baseSplit;

    if (remaining > 0) {
      amount = Number((amount + 0.01).toFixed(2));
      remaining = Number((remaining - 0.01).toFixed(2));
    }

    return { user: id, amount };
  });
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
      if (selectedFriend) refreshSelectedFriendLedger();
    } catch (err) { alert(err.response?.data?.message); }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm("Delete expense?")) {
      await api.delete(`/expenses/${id}`);
      fetchData();
      if (selectedGroup) handleViewGroup(selectedGroup.group._id);
      if (selectedFriend) refreshSelectedFriendLedger();
    }
  };



  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    try {
      const res = await api.put("/users/update-user", { 
        name: profileName.trim(), 
        phoneNumber: profilePhone.trim(),
        avatar: profileAvatar
      });
      updateCurrentUser(res.data);
      alert("Profile updated successfully!");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dydhsbpwt';
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'expenseiq_preset';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, formData);
      const imageUrl = res.data.secure_url;

      setProfileAvatar(imageUrl);
      alert("Image uploaded successfully! Click 'Save Changes' to save your profile.");
    } catch (err) {
      console.error("Cloudinary upload failed, falling back to local base64:", err);
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileAvatar(reader.result);
          alert("Image loaded locally! Click 'Save Changes' to save your profile.");
        };
        reader.readAsDataURL(file);
      } catch (fallbackErr) {
        console.error("Local file reader failed:", fallbackErr);
        alert("Failed to load image");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSelectFriend = (friendId) => {
    if (!friendId) return;
    const friend = friends.find(f => f.user._id === friendId);
    if (friend && !selectedFriendsToInvite.some(f => f._id === friendId)) {
      setSelectedFriendsToInvite([...selectedFriendsToInvite, { _id: friend.user._id, name: friend.user.name }]);
    }
    setSelectedFriendId("");
  };

  const handleAddEmail = (e) => {
    if (e) e.preventDefault();
    const email = memberEmail.trim();
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }
    if (!invitedEmails.includes(email)) {
      setInvitedEmails([...invitedEmails, email]);
    }
    setMemberEmail("");
  };

  const handleEmailKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail(e);
    }
  };

  const handleSubmitInvitation = async (e) => {
    e.preventDefault();

    let finalEmails = [...invitedEmails];
    if (memberEmail.trim()) {
      const email = memberEmail.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        if (!finalEmails.includes(email)) {
          finalEmails.push(email);
        }
      }
    }

    if (selectedFriendsToInvite.length === 0 && finalEmails.length === 0) {
      alert("Please select at least one friend or add an email address.");
      return;
    }

    try {
      const friendIds = selectedFriendsToInvite.map(sf => sf._id);
      let emailUserIds = [];

      if (finalEmails.length > 0) {
        const usersRes = await api.get("/users/all-users");
        const allUsers = usersRes.data || [];
        const unresolvedEmails = [];

        finalEmails.forEach(email => {
          const matchedUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (matchedUser) {
            emailUserIds.push(matchedUser._id);
          } else {
            unresolvedEmails.push(email);
          }
        });

        if (unresolvedEmails.length > 0) {
          alert(`The following emails are not registered users of ExpenseIQ:\n${unresolvedEmails.join("\n")}`);
          return;
        }
      }

      const mergedUserIds = [...new Set([...friendIds, ...emailUserIds])];
      if (mergedUserIds.length === 0) {
        alert("No valid new members selected.");
        return;
      }

      await api.post(`/groups/${selectedGroup.group._id}/add-member`, {
        userIds: mergedUserIds,
      });

      setIsAddMemberOpen(false);
      setSelectedFriendsToInvite([]);
      setInvitedEmails([]);
      setMemberEmail("");
      setSelectedFriendId("");
      handleViewGroup(selectedGroup.group._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add members to group");
    }
  };

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const handleRemoveMembers = async (e) => {
    e.preventDefault();

    if (!selectedGroup || selectedMembersToRemove.length === 0) {
      return;
    }

    const membersWithPendingBalances = selectedMembersToRemove.filter(
      (memberId) => groupSettlementMap[memberId]?.hasPending
    );

    if (membersWithPendingBalances.length > 0 && !removeMembersAcknowledged) {
      return alert("Please confirm the warning before removing members with unsettled balances.");
    }

    try {
      await api.put(`/groups/${selectedGroup.group._id}/remove-members`, {
        userIds: selectedMembersToRemove
      });
      setIsRemoveMembersOpen(false);
      setSelectedMembersToRemove([]);
      setRemoveMembersAcknowledged(false);
      handleViewGroup(selectedGroup.group._id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove members");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-emerald-600">Syncing...</div>;

  const totalOwed = balances.totalYouAreOwed;
  const totalOwe = balances.totalYouOwe;

  // ✅ include personal expenses in total balance
  const totalBalanceWithPersonal =
    balances.totalBalance + balances.personalTotal;

  const selectedFriendBalance = selectedFriendLedger?.summary || null;
  const sharedFriendExpenses = selectedFriendLedger?.expenses || [];
  const hasSharedExpenses = sharedFriendExpenses.length > 0;
  const isFriendSettled = selectedFriendBalance?.status === "settled";
  const isFriendOwed = selectedFriendBalance?.status === "owes_you";
  const visibleFriendExpenses =
    !isFriendSettled || showSettledFriendExpenses ? sharedFriendExpenses : [];
  const groupSettlementMap = selectedGroup
    ? buildGroupSettlementMap(selectedGroup.expenses)
    : {};
  const selectedMembersWithPendingBalances = selectedMembersToRemove
    .map((memberId) => {
      const member = selectedGroup?.group.members.find((groupMember) => groupMember._id === memberId);
      const settlement = groupSettlementMap[memberId];

      if (!member || !settlement?.hasPending) {
        return null;
      }

      return {
        member,
        ...settlement
      };
    })
    .filter(Boolean);

  const filteredGlobalExpenses = recentExpenses.filter(exp => {
    const mySplit = exp.splits?.find(s => (s.user?._id || s.user)?.toString() === user._id.toString());
    return mySplit && mySplit.amount > 0;
  });

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans relative">
      {/* Sidebar Backdrop Overlay on Mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r flex flex-col shadow-2xl transition-transform duration-300 transform lg:translate-x-0 lg:relative lg:shadow-sm ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div onClick={() => { setSelectedGroup(null); setSelectedFriend(null); setSelectedFriendLedger(null); navigate("/dashboard"); setIsProfileView(false); setIsSidebarOpen(false); }} className="p-8 cursor-pointer text-center flex justify-between items-center lg:justify-center">
          <h1 className="text-2xl font-black text-emerald-600 tracking-tighter">ExpenseIQ</h1>
          <button onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(false); }} className="lg:hidden p-2 text-gray-400 hover:text-gray-900 rounded-lg"><X size={20} /></button>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <div onClick={() => { setSelectedGroup(null); setSelectedFriend(null); setSelectedFriendLedger(null); setIsProfileView(false); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold cursor-pointer transition-all ${!selectedGroup && !selectedFriend && !isProfileView ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}>
            <LayoutDashboard size={20} /> <span>Dashboard</span>
          </div>

          <div onClick={() => { setSelectedGroup(null); setSelectedFriend(null); setSelectedFriendLedger(null); setIsProfileView(true); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold cursor-pointer transition-all ${isProfileView ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}>
            <User size={20} /> <span>Profile</span>
          </div>

          <div className="pt-6 pb-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between items-center">
            <span>Groups</span>
            <button onClick={() => setIsGroupModalOpen(true)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded-full"><Plus size={18}/></button>
          </div>
          {groups.map(g => (
            <div key={g._id} onClick={() => { handleViewGroup(g._id); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all text-sm font-bold ${selectedGroup?.group?._id === g._id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Users size={16} /> <span className="truncate">{g.name}</span>
            </div>
          ))}

          <div className="pt-6 pb-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Friends</div>
          {friends.map(f => (
            <div
              key={f.user._id}
              onClick={() => { handleViewFriend(f); setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-xl cursor-pointer transition-all ${
                selectedFriend?._id === f.user._id
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {renderAvatar(f.user, "w-6 h-6 text-[9px]")}
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

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-12">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-6 sm:mb-8 md:mb-12">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-3 hover:bg-gray-100 rounded-2xl text-gray-500 transition-colors"
              title="Open Sidebar"
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight flex flex-wrap items-center gap-2">
                {isProfileView
                  ? "Profile Settings"
                  : selectedGroup
                    ? selectedGroup.group.name
                    : selectedFriend
                      ? selectedFriend.name
                      : (
                        <>
                          <span>Hello, {user?.name || "Utkarsh Pareek"}</span>
                          <button 
                            onClick={() => {
                              setSelectedGroup(null);
                              setSelectedFriend(null);
                              setSelectedFriendLedger(null);
                              setIsProfileView(true);
                            }} 
                            className="p-1.5 hover:bg-emerald-50 rounded-full text-emerald-600 transition-colors"
                            title="Edit Profile"
                          >
                            <Edit2 size={20} />
                          </button>
                        </>
                      )}
              </h2>
              <p className="text-gray-400 font-bold mt-1 uppercase text-[10px] tracking-widest">
                {isProfileView
                  ? "Manage your account information"
                  : selectedGroup
                    ? "Group View"
                    : selectedFriend
                      ? selectedFriend.email || "Friend View"
                      : "Global Overview"} • ₹ Rupees
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={() => setIsExpenseModalOpen(true)} className="bg-emerald-600 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2 text-sm sm:text-base">
              <CreditCard size={18} className="sm:w-5 sm:h-5" /> Add Expense
            </button>
            <div className="relative" ref={profileRef}>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 bg-white border p-2 rounded-2xl shadow-sm hover:shadow-md transition-all">
                {renderAvatar(user, "w-8 h-8 rounded-lg text-sm")}
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white border rounded-2xl shadow-2xl z-50 p-2">
                   <div className="p-3 border-b mb-1">
                     <p className="text-[10px] font-black text-gray-400 uppercase">Account</p>
                     <p className="text-sm font-bold truncate">{user?.name || "Utkarsh Pareek"}</p>
                     <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                   </div>
                   <button 
                     onClick={() => {
                       setIsProfileOpen(false);
                       setSelectedGroup(null);
                       setSelectedFriend(null);
                       setSelectedFriendLedger(null);
                       setIsProfileView(true);
                     }} 
                     className="flex items-center gap-3 w-full px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm font-bold mt-1"
                   >
                     <User size={16}/> My Profile
                   </button>
                   <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-bold mt-1"><LogOut size={16}/> Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {isProfileView ? (
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-10">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl sm:rounded-[32px] lg:rounded-[40px] border border-gray-100 p-6 sm:p-8 shadow-sm flex flex-col items-center text-center justify-center space-y-6">
                <div className="relative group cursor-pointer w-24 h-24">
                  {renderAvatar({ name: user?.name, avatar: profileAvatar }, "w-24 h-24 text-4xl shadow-xl shadow-emerald-100/50")}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Camera size={20} />
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarUpload} 
                      className="hidden" 
                      disabled={uploading}
                    />
                  </label>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-gray-800">{user?.name || "Utkarsh Pareek"}</h4>
                  <span className="inline-block mt-2 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-100">
                    Active Account
                  </span>
                </div>

                {/* Choose Preset Avatar */}
                <div className="w-full pt-4 text-center border-t border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Choose Preset</p>
                  <div className="flex justify-center gap-2">
                    {["gradient-emerald", "gradient-indigo", "gradient-amber", "gradient-rose", "gradient-sky", "gradient-purple"].map(preset => {
                      let bg = "bg-gradient-to-tr from-emerald-400 to-emerald-600";
                      if (preset === "gradient-indigo") bg = "bg-gradient-to-tr from-indigo-400 to-indigo-600";
                      else if (preset === "gradient-amber") bg = "bg-gradient-to-tr from-amber-400 to-amber-600";
                      else if (preset === "gradient-rose") bg = "bg-gradient-to-tr from-rose-400 to-rose-600";
                      else if (preset === "gradient-sky") bg = "bg-gradient-to-tr from-sky-400 to-sky-600";
                      else if (preset === "gradient-purple") bg = "bg-gradient-to-tr from-purple-400 to-purple-600";
                      
                      const isSelected = profileAvatar === preset || (!profileAvatar && preset === "gradient-emerald");
                      
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setProfileAvatar(preset)}
                          className={`w-6 h-6 rounded-full ${bg} transition-transform ${isSelected ? 'scale-125 ring-2 ring-emerald-500 ring-offset-2' : 'hover:scale-110'}`}
                          title={preset.replace("gradient-", "")}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="w-full pt-4 border-t border-gray-100 space-y-4 text-left">
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                    <Mail size={18} className="text-emerald-600 flex-shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                    <Phone size={18} className="text-emerald-600 flex-shrink-0" />
                    <span className="truncate">{user?.phoneNumber || "No phone number added"}</span>
                  </div>
                </div>
              </div>

              {/* Edit Details Form */}
              <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-[32px] lg:rounded-[40px] border border-gray-100 p-6 sm:p-8 lg:p-10 shadow-sm">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Personal Details</h4>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Full Name</label>
                    <input 
                      type="text" 
                      value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)} 
                      placeholder="Your Full Name" 
                      className="w-full p-4 sm:p-5 bg-gray-50 border border-transparent focus:border-emerald-500 focus:bg-white rounded-xl sm:rounded-2xl outline-none font-bold transition-all placeholder:text-gray-300"
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email Address</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        value={user?.email || ""} 
                        disabled 
                        placeholder="Email Address" 
                        className="w-full p-4 sm:p-5 bg-gray-100 text-gray-400 border border-transparent rounded-xl sm:rounded-2xl outline-none font-bold cursor-not-allowed"
                      />
                      <span className="absolute right-5 top-4 sm:top-5 text-[9px] font-black text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-md border border-gray-200">read only</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Phone Number (Optional)</label>
                    <input 
                      type="tel" 
                      value={profilePhone} 
                      onChange={(e) => setProfilePhone(e.target.value)} 
                      placeholder="e.g. +91 98765 43210" 
                      className="w-full p-4 sm:p-5 bg-gray-50 border border-transparent focus:border-emerald-500 focus:bg-white rounded-xl sm:rounded-2xl outline-none font-bold transition-all placeholder:text-gray-300"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={!profileName.trim() || (profileName.trim() === (user?.name || "") && profilePhone.trim() === (user?.phoneNumber || "") && profileAvatar === (user?.avatar || ""))}
                    className="w-full bg-emerald-600 text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : !selectedGroup && !selectedFriend ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 text-center">
              <StatCard 
                title="Total Balance" 
                amount={totalBalanceWithPersonal}   // ✅ FIXED
                color="text-gray-900" 
                icon={<Receipt size={24}/>} 
              />

              <StatCard 
                title="You owe" 
                amount={totalOwe} 
                color="text-orange-600" 
                icon={<ArrowDownLeft size={24}/>} 
              />

              <StatCard 
                title="You are owed" 
                amount={totalOwed} 
                color="text-emerald-600" 
                icon={<ArrowUpRight size={24}/>} 
              />
            </div>
            <div className="bg-white rounded-2xl sm:rounded-[32px] lg:rounded-[40px] border border-gray-100 p-6 sm:p-8 lg:p-10 shadow-sm">
                <div className="flex justify-between items-center mb-6 sm:mb-8">
                  <h3 className="text-lg sm:text-xl font-black flex items-center gap-2">Recent Global Activity</h3>
                  {filteredGlobalExpenses.length > 5 && (
                    <button 
                      onClick={() => setShowAllGlobalExpenses(!showAllGlobalExpenses)}
                      className="text-emerald-600 font-black text-xs uppercase tracking-widest hover:underline"
                    >
                      {showAllGlobalExpenses ? "Show Less" : "See All"}
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                    {filteredGlobalExpenses.length > 0 ? (
                      (showAllGlobalExpenses ? filteredGlobalExpenses : filteredGlobalExpenses.slice(0, 5)).map(exp => {
                        const mySplit = exp.splits?.find(s => (s.user?._id || s.user)?.toString() === user._id.toString());
                        const myShare = mySplit ? mySplit.amount : 0;
                        const isPaidByMe = exp.paidBy?._id?.toString() === user._id.toString();

                        return (
                          <div key={exp._id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-[32px] border border-transparent hover:border-emerald-100 transition-all">
                              <div className="flex items-center gap-4">
                                  <div className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl shadow-sm text-emerald-600 flex-shrink-0"><Receipt size={20}/></div>
                                  <div>
                                    <p className="font-bold text-sm sm:text-base">{exp.description}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">
                                      {exp.group ? `Group: ${exp.group.name}` : "Personal"} • Paid by {isPaidByMe ? "you" : exp.paidBy.name}
                                    </p>
                                  </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t border-gray-200/50 sm:border-t-0 pt-3 sm:pt-0">
                                  <div className="text-left sm:text-right font-sans">
                                    <p className="font-black text-lg sm:text-xl">₹{myShare.toFixed(2)}</p>
                                    {!isPaidByMe && <p className="text-[9px] font-black text-orange-500 uppercase tracking-wider">you owe</p>}
                                    {isPaidByMe && exp.participants.length > 1 && <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">you lent</p>}
                                  </div>
                                  <button onClick={() => handleDeleteExpense(exp._id)} className="text-gray-300 hover:text-red-500 transition-colors p-2 hover:bg-gray-100 rounded-lg"><Trash2 size={18}/></button>
                              </div>
                          </div>
                        );
                      })
                    ) : <p className="text-center text-gray-400 font-bold py-10 italic">No expenses yet.</p>}
                </div>
            </div>
          </>
        ) : selectedFriend ? (
          <div className="space-y-6 sm:space-y-8">
            {!isFriendSettled ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <StatCard
                  title={isFriendOwed ? `${selectedFriend.name} owes you` : "You owe"}
                  amount={isFriendOwed ? selectedFriendBalance.youAreOwed : selectedFriendBalance.youOwe}
                  color={isFriendOwed ? "text-emerald-600" : "text-orange-600"}
                  icon={isFriendOwed ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                />
                <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[32px] lg:rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-between">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">Status</p>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-gray-900">
                      {isFriendOwed ? "You are owed" : "You owe"} {formatCurrency(isFriendOwed ? selectedFriendBalance.youAreOwed : selectedFriendBalance.youOwe)}
                    </p>
                    <p className="mt-2 text-xs sm:text-sm font-bold text-gray-400">
                      {isFriendOwed
                        ? `${selectedFriend.name} needs to settle up with you.`
                        : `You still need to settle up with ${selectedFriend.name}.`}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl sm:rounded-[32px] lg:rounded-[40px] border border-gray-100 p-6 sm:p-10 lg:p-12 shadow-sm flex flex-col items-center text-center">
                <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full bg-gray-100 flex items-center justify-center mb-6 sm:mb-8 flex-shrink-0">
                  <Check className="text-emerald-500 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20" />
                </div>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-3">{selectedFriend.name}</p>
                <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-400 mb-4">
                  {hasSharedExpenses
                    ? `You and ${selectedFriend.name} are all settled up.`
                    : `You do not have any shared expenses with ${selectedFriend.name} yet.`}
                </p>
                {hasSharedExpenses && (
                  <button
                    onClick={() => setShowSettledFriendExpenses(!showSettledFriendExpenses)}
                    className="text-emerald-600 font-black text-sm hover:underline"
                  >
                    {showSettledFriendExpenses ? "Hide settled expenses" : "Show settled expenses"}
                  </button>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl sm:rounded-[32px] lg:rounded-[40px] border border-gray-100 p-6 sm:p-8 lg:p-10 shadow-sm">
              <div className="flex justify-between items-center mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-black">
                  {isFriendSettled ? "Shared History" : "Open & Shared Expenses"}
                </h3>
                {visibleFriendExpenses.length > 0 && (
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {visibleFriendExpenses.length} expense{visibleFriendExpenses.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {visibleFriendExpenses.length > 0 ? (
                  visibleFriendExpenses.map(exp => (
                    <div key={exp._id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-[32px] border border-transparent hover:border-emerald-100 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl shadow-sm text-emerald-600 flex-shrink-0"><Receipt size={20}/></div>
                            <div>
                              <p className="font-bold text-sm sm:text-base">{exp.description}</p>
                              <p className="text-[10px] font-black text-gray-400 uppercase">
                                {exp.group ? `Group: ${exp.group.name}` : "Direct/Personal"} • Paid by {exp.paidBy.name}
                              </p>
                              <p className="text-xs font-bold text-gray-500 mt-1">
                                {exp.pairImpact > 0
                                  ? `${selectedFriend.name} owes you ${formatCurrency(exp.pairImpact)}`
                                  : exp.pairImpact < 0
                                    ? `You owe ${selectedFriend.name} ${formatCurrency(Math.abs(exp.pairImpact))}`
                                    : `No direct balance change`}
                              </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t border-gray-200/50 sm:border-t-0 pt-3 sm:pt-0">
                          <div className="text-left sm:text-right font-sans">
                            <p className="font-black text-lg sm:text-xl">₹{exp.amount.toFixed(2)}</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase">
                              Your share {formatCurrency(exp.yourShare)}
                            </p>
                          </div>
                        </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 font-bold py-10 italic">
                    {hasSharedExpenses
                      ? "Settled expenses are hidden right now."
                      : `No shared activity with ${selectedFriend.name} yet.`}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              <div className="bg-white rounded-2xl sm:rounded-[32px] lg:rounded-[40px] p-6 sm:p-8 lg:p-10 border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <h3 className="text-lg sm:text-xl font-black flex items-center gap-2"><Zap size={24} className="text-orange-500"/> Settle Up IQ</h3>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <button onClick={() => { setSelectedMembersToRemove([]); setRemoveMembersAcknowledged(false); setIsRemoveMembersOpen(true); }} className="flex items-center gap-1.5 text-red-500 font-black text-[10px] sm:text-xs bg-red-50 px-3 sm:px-4 py-2 rounded-full uppercase tracking-widest hover:bg-red-100 transition-colors">
                        <Trash2 size={14}/> Remove
                      </button>
                      <button onClick={() => { setSelectedFriendsToInvite([]); setInvitedEmails([]); setMemberEmail(""); setSelectedFriendId(""); setIsAddMemberOpen(true); }} className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] sm:text-xs bg-emerald-50 px-3 sm:px-4 py-2 rounded-full uppercase tracking-widest hover:bg-emerald-100 transition-colors"><UserPlus size={14}/> Invite</button>
                    </div>
                </div>
                <div className="space-y-4">
                    {simplifiedDebts.length > 0 ? simplifiedDebts.map((t, i) => (
                        <div key={i} className="p-4 sm:p-6 bg-orange-50/50 rounded-2xl sm:rounded-3xl border border-orange-100 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <p className="font-bold text-sm sm:text-base text-gray-700">{t.from.name} owes {t.to.name}</p>
                            <p className="font-black text-orange-600 text-lg sm:text-xl">₹{t.amount}</p>
                        </div>
                    )) : <p className="text-center text-gray-400 font-bold py-10 italic">Group is settled!</p>}
                </div>
              </div>
              <div className="bg-white rounded-2xl sm:rounded-[32px] lg:rounded-[40px] p-6 sm:p-8 lg:p-10 border border-gray-100 shadow-sm">
                 <div className="flex justify-between items-center mb-6 sm:mb-8">
                    <h3 className="text-lg sm:text-xl font-black">Group History</h3>
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
                        <div key={e._id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 sm:p-5 bg-gray-50 rounded-2xl sm:rounded-3xl border border-transparent hover:border-emerald-100 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-gray-400 flex-shrink-0"><Receipt size={18}/></div>
                                <div>
                                  <p className="font-bold text-sm">{e.description}</p>
                                  <p className="text-[10px] font-black text-gray-400 uppercase">
                                    Paid by {e.paidBy.name} • Splitted with {e.participants.length} members
                                  </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t border-gray-200/50 sm:border-t-0 pt-3 sm:pt-0">
                              <p className="font-black text-lg">₹{e.amount}</p>
                              <button onClick={() => handleDeleteExpense(e._id)} className="text-gray-300 hover:text-red-500 transition-colors p-2 hover:bg-gray-100 rounded-lg"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl sm:rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-sm h-fit text-center">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Members</h4>
                <div className="flex flex-wrap justify-center gap-3">
                    {selectedGroup.group.members.map(m => (
                      <div key={m._id} title={m.name}>
                        {renderAvatar(m, "w-10 h-10 text-xs shadow-sm")}
                      </div>
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
            <input type="text" placeholder="Description" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="w-full p-4 sm:p-5 bg-gray-50 rounded-xl sm:rounded-2xl outline-none font-bold" required />
            <div className="relative">
              <span className="absolute left-4 sm:left-5 top-4 sm:top-5 font-black text-gray-400">₹</span>
              <input type="number" placeholder="0.00" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="w-full p-4 sm:p-5 pl-10 bg-gray-50 rounded-xl sm:rounded-2xl outline-none font-bold" required />
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
            <button type="submit" className="w-full bg-emerald-600 text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-lg shadow-lg">
              {selectedGroup ? 'Split with Group' : 'Log Personal'}
            </button>
          </form>
        </Modal>
      )}

      {isGroupModalOpen && (
        <Modal title="New Group" close={() => setIsGroupModalOpen(false)}>
          <form onSubmit={(e) => { e.preventDefault(); api.post("/groups", { name: newGroupName, description: newGroupDesc }).then(() => { setIsGroupModalOpen(false); fetchData(); }); }} className="space-y-4">
            <input type="text" placeholder="Group Name" onChange={(e) => setNewGroupName(e.target.value)} className="w-full p-4 sm:p-5 bg-gray-50 rounded-xl sm:rounded-2xl outline-none font-bold" required />
            <input type="text" placeholder="Description" onChange={(e) => setNewGroupDesc(e.target.value)} className="w-full p-4 sm:p-5 bg-gray-50 rounded-xl sm:rounded-2xl outline-none font-bold" />
            <button type="submit" className="w-full bg-emerald-600 text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-lg shadow-lg">Create Group</button>
          </form>
        </Modal>
      )}

      {isAddMemberOpen && (
        <Modal title="Invite Members" close={() => setIsAddMemberOpen(false)}>
          <form onSubmit={handleSubmitInvitation} className="space-y-6">
            
            {/* 🔽 FRIEND DROPDOWN */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Add From Friends</label>
              <select
                value={selectedFriendId}
                onChange={(e) => handleSelectFriend(e.target.value)}
                className="w-full p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl font-bold outline-none border border-transparent focus:border-emerald-500 focus:bg-white transition-all"
              >
                <option value="">Select Friend</option>
                {friends.map((f) => {
                  const isAlreadyMember = selectedGroup.group.members.some(
                    (m) => m._id.toString() === f.user._id.toString()
                  );
                  const isAlreadySelected = selectedFriendsToInvite.some(
                    (sf) => sf._id.toString() === f.user._id.toString()
                  );
                  if (isAlreadyMember || isAlreadySelected) return null;

                  return (
                    <option key={f.user._id} value={f.user._id}>
                      {f.user.name}
                    </option>
                  );
                })}
              </select>

              {/* Selected Friends Chips */}
              {selectedFriendsToInvite.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 px-2">
                  {selectedFriendsToInvite.map(sf => (
                    <span key={sf._id} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-100">
                      <span>{sf.name}</span>
                      <button type="button" onClick={() => setSelectedFriendsToInvite(selectedFriendsToInvite.filter(f => f._id !== sf._id))} className="hover:text-emerald-950 font-black focus:outline-none"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink mx-4 text-xs font-black text-gray-300 uppercase tracking-widest">Or Invite By Email</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            {/* 📧 EMAIL INPUT */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Add Emails</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  onKeyDown={handleEmailKeyDown}
                  className="flex-1 p-4 sm:p-5 bg-gray-50 border border-transparent rounded-xl sm:rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold placeholder:text-gray-300"
                />
                <button 
                  type="button" 
                  onClick={handleAddEmail} 
                  className="bg-emerald-50 text-emerald-700 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-black border border-emerald-100 hover:bg-emerald-100 transition-all text-sm"
                >
                  Add
                </button>
              </div>

              {/* Invited Emails Chips */}
              {invitedEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 px-2">
                  {invitedEmails.map(email => (
                    <span key={email} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">
                      <span className="truncate max-w-[150px]">{email}</span>
                      <button type="button" onClick={() => setInvitedEmails(invitedEmails.filter(e => e !== email))} className="hover:text-blue-950 font-black focus:outline-none"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={selectedFriendsToInvite.length === 0 && invitedEmails.length === 0 && !memberEmail.trim()}
              className="w-full bg-emerald-600 text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition-all mt-4"
            >
              Invite & Sync
            </button>
          </form>
        </Modal>
      )}

      {isRemoveMembersOpen && selectedGroup && (
        <Modal title="Remove Members" close={() => { setIsRemoveMembersOpen(false); setRemoveMembersAcknowledged(false); }}>
          <form onSubmit={handleRemoveMembers} className="space-y-5">
            <p className="text-sm font-bold text-gray-400">
              Select one or more members to remove from {selectedGroup.group.name}.
            </p>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {selectedGroup.group.members
                .filter((member) => member._id !== user._id)
                .map((member) => {
                  const isSelected = selectedMembersToRemove.includes(member._id);

                  return (
                    <button
                      key={member._id}
                      type="button"
                      onClick={() => toggleMemberForRemoval(member._id)}
                      className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "bg-red-50 border-red-300 text-red-700"
                          : "bg-gray-50 border-gray-100 text-gray-600"
                      }`}
                    >
                      <div>
                        <p className="font-black">{member.name}</p>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-60">
                          {member.email}
                        </p>
                      </div>
                      {isSelected && <Check size={18} />}
                    </button>
                  );
                })}
            </div>

            {selectedGroup.group.members.filter((member) => member._id !== user._id).length === 0 && (
              <p className="text-center text-sm font-bold text-gray-400 py-6">
                No removable members found in this group.
              </p>
            )}

            {selectedMembersWithPendingBalances.length > 0 && (
              <div className="rounded-xl sm:rounded-[28px] border border-amber-200 bg-amber-50 p-4 sm:p-5 space-y-3">
                <p className="text-sm font-black text-amber-700 uppercase tracking-widest">
                  Warning: unsettled balances found
                </p>
                {selectedMembersWithPendingBalances.map(({ member, totalOwes, totalOwed }) => (
                  <div key={member._id} className="text-sm font-bold text-amber-900">
                    <p>{member.name} still has pending balances in this group.</p>
                    <p className="text-amber-700">
                      Owes: {formatCurrency(totalOwes)} • Is owed: {formatCurrency(totalOwed)}
                    </p>
                  </div>
                ))}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeMembersAcknowledged}
                    onChange={(e) => setRemoveMembersAcknowledged(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm font-bold text-amber-800">
                    I understand that these members still have unsettled balances and I want to remove them anyway.
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={
                selectedMembersToRemove.length === 0 ||
                (selectedMembersWithPendingBalances.length > 0 && !removeMembersAcknowledged)
              }
              className="w-full bg-red-500 text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove {selectedMembersToRemove.length || ""} {selectedMembersToRemove.length === 1 ? "Member" : "Members"}
            </button>
          </form>
        </Modal>
      )}


    </div>
  );
};

const Modal = ({ title, children, close }) => (
  <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6 overflow-y-auto">
    <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-[32px] lg:rounded-[40px] p-6 sm:p-10 shadow-2xl animate-in zoom-in duration-200 my-8 max-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center mb-6 sm:mb-8 flex-shrink-0">
        <h3 className="text-2xl sm:text-3xl font-black text-gray-800">{title}</h3>
        <button onClick={close} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><X size={24} className="text-gray-400 hover:text-gray-900"/></button>
      </div>
      <div className="overflow-y-auto flex-1 pr-1 -mr-1">
        {children}
      </div>
    </div>
  </div>
);

const formatCurrency = (amount) =>
  `₹${Math.abs(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const buildGroupSettlementMap = (expenses = []) => {
  const settlementMap = {};

  expenses.forEach((expense) => {
    const paidById = expense.paidBy?._id;

    if (!paidById) return;

    if (!settlementMap[paidById]) {
      settlementMap[paidById] = { totalOwes: 0, totalOwed: 0, hasPending: false };
    }

    expense.splits?.forEach((split) => {
      const splitUserId = split.user?._id;
      if (!splitUserId || splitUserId === paidById) return;

      if (!settlementMap[splitUserId]) {
        settlementMap[splitUserId] = { totalOwes: 0, totalOwed: 0, hasPending: false };
      }

      settlementMap[splitUserId].totalOwes += split.amount || 0;
      settlementMap[paidById].totalOwed += split.amount || 0;
    });
  });

  Object.keys(settlementMap).forEach((memberId) => {
    settlementMap[memberId].totalOwes = Number(settlementMap[memberId].totalOwes.toFixed(2));
    settlementMap[memberId].totalOwed = Number(settlementMap[memberId].totalOwed.toFixed(2));
    settlementMap[memberId].hasPending =
      settlementMap[memberId].totalOwes > 0 || settlementMap[memberId].totalOwed > 0;
  });

  return settlementMap;
};

const StatCard = ({ title, amount, color, icon }) => (
  <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[32px] lg:rounded-[40px] shadow-sm border border-gray-100 flex items-start justify-between">
    <div>
      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 sm:mb-4">{title}</p>
      <p className={`text-2xl sm:text-3xl lg:text-4xl font-black ${color}`}>{formatCurrency(amount)}</p>
    </div>
    <div className="p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl text-gray-200 flex-shrink-0">{icon}</div>
  </div>
);

const renderAvatar = (userObj, size = "w-8 h-8", extraClasses = "") => {
  const avatar = userObj?.avatar;
  const initial = userObj?.name?.charAt(0) || "U";
  
  if (avatar && (avatar.startsWith("http") || avatar.startsWith("data:"))) {
    return <img src={avatar} alt={userObj.name} className={`${size} rounded-full object-cover ${extraClasses}`} />;
  }
  
  let gradientClass = "bg-gradient-to-tr from-emerald-400 to-emerald-600 text-white";
  if (avatar === "gradient-indigo") {
    gradientClass = "bg-gradient-to-tr from-indigo-400 to-indigo-600 text-white";
  } else if (avatar === "gradient-amber") {
    gradientClass = "bg-gradient-to-tr from-amber-400 to-amber-600 text-white";
  } else if (avatar === "gradient-rose") {
    gradientClass = "bg-gradient-to-tr from-rose-400 to-rose-600 text-white";
  } else if (avatar === "gradient-sky") {
    gradientClass = "bg-gradient-to-tr from-sky-400 to-sky-600 text-white";
  } else if (avatar === "gradient-purple") {
    gradientClass = "bg-gradient-to-tr from-purple-400 to-purple-600 text-white";
  }
  
  return (
    <div className={`${size} rounded-full flex items-center justify-center font-black ${gradientClass} ${extraClasses}`}>
      {initial}
    </div>
  );
};

export default Dashboard;
