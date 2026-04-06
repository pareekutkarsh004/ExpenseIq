import Group from "../models/Group.model.js";
import User from "../models/User.model.js";
import Expense from "../models/Expense.js";

export const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const currentUser = await User.findOne({ firebaseUID: req.user.firebaseUID });
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const group = new Group({
      name,
      description,
      members: [currentUser._id], 
      createdBy: currentUser._id
    });
    
    await group.save();
    await group.populate("createdBy", "name email");
    await group.populate("members", "name email");

    return res.status(201).json({ message: "Group created successfully", group });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getGroups = async (req, res) => {
  try {
    const currentUser = await User.findOne({ firebaseUID: req.user.firebaseUID });
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const groups = await Group.find({ members: currentUser._id })
      .populate("members", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ groups });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate("members", "name email").populate("createdBy", "name email");
    if (!group) return res.status(404).json({ message: "Group not found" });

    const currentUser = await User.findOne({ firebaseUID: req.user.firebaseUID });
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const isMember = group.members.some(m => m._id.toString() === currentUser._id.toString());
    if (!isMember) return res.status(403).json({ message: "Access denied" });

    const expenses = await Expense.find({ group: groupId }).populate("paidBy", "name email").populate("splits.user", "name email").sort({ createdAt: -1 });
    return res.status(200).json({ group, expenses });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const currentUser = await User.findOne({ firebaseUID: req.user.firebaseUID });
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    if (group.createdBy.toString() !== currentUser._id.toString()) return res.status(403).json({ message: "Access denied" });

    if (name) group.name = name;
    if (description) group.description = description;

    await group.save();
    await group.populate("members", "name email");
    await group.populate("createdBy", "name email");
    return res.status(200).json({ message: "Group updated successfully", group });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const currentUser = await User.findOne({ firebaseUID: req.user.firebaseUID });
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    if (group.createdBy.toString() !== currentUser._id.toString()) return res.status(403).json({ message: "Access denied" });

    await Expense.deleteMany({ group: groupId });
    await Group.findByIdAndDelete(groupId);
    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const calculateGroupBalances = async (groupId) => {
  const expenses = await Expense.find({ group: groupId }).populate("paidBy", "name email").populate("splits.user", "name email");
  const balances = {};
  expenses.forEach(expense => {
    const paidBy = expense.paidBy._id.toString();
    expense.splits.forEach(split => {
      const owedBy = split.user._id.toString();
      if (owedBy === paidBy) return;
      if (!balances[owedBy]) balances[owedBy] = {};
      if (!balances[owedBy][paidBy]) balances[owedBy][paidBy] = 0;
      balances[owedBy][paidBy] += split.amount;
    });
  });
  return balances;
};

export const simplifyExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    const currentUser = await User.findOne({ firebaseUID: req.user.firebaseUID });
    const group = await Group.findById(groupId);
    if (!group || !currentUser) return res.status(404).json({ message: "Not found" });

    const isMember = group.members.some(m => m.toString() === currentUser._id.toString());
    if (!isMember) return res.status(403).json({ message: "Access denied" });

    const graph = await calculateGroupBalances(groupId);
    const net = {};
    for (let from in graph) {
      for (let to in graph[from]) {
        const amount = graph[from][to];
        net[from] = (net[from] || 0) - amount;
        net[to] = (net[to] || 0) + amount;
      }
    }
    const creditors = [], debtors = [];
    for (let user in net) {
      if (net[user] > 0) creditors.push({ user, amount: net[user] });
      else if (net[user] < 0) debtors.push({ user, amount: -net[user] });
    }
    const rawTransactions = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(debtors[i].amount, creditors[j].amount);
      rawTransactions.push({ from: debtors[i].user, to: creditors[j].user, amount: Number(amount.toFixed(2)) });
      debtors[i].amount -= amount;
      creditors[j].amount -= amount;
      if (debtors[i].amount === 0) i++;
      if (creditors[j].amount === 0) j++;
    }
    const userIds = [...new Set(rawTransactions.flatMap(t => [t.from, t.to]))];
    const usersInfo = await User.find({ _id: { $in: userIds } }).select("name email");
    const userMap = {};
    usersInfo.forEach(u => { userMap[u._id.toString()] = { name: u.name, email: u.email }; });
    const transactions = rawTransactions.map(t => ({ from: userMap[t.from] || { id: t.from, name: "Unknown" }, to: userMap[t.to] || { id: t.to, name: "Unknown" }, amount: t.amount }));
    return res.status(200).json({ transactions });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;
    const balances = await calculateGroupBalances(groupId);
    const detailedBalances = {};
    for (let owedBy in balances) {
      detailedBalances[owedBy] = {};
      for (let owedTo in balances[owedBy]) {
        const amount = balances[owedBy][owedTo];
        const owedByUser = await User.findById(owedBy).select("name email");
        const owedToUser = await User.findById(owedTo).select("name email");
        detailedBalances[owedBy][owedTo] = { amount, owedByUser, owedToUser };
      }
    }
    return res.status(200).json({ balances: detailedBalances });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addMemberToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const currentUser = await User.findOne({ firebaseUID: req.user.firebaseUID });
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    if (!group.members.includes(currentUser._id)) return res.status(403).json({ message: "Access denied" });
    if (group.members.includes(userId)) return res.status(400).json({ message: "User already in group" });

    group.members.push(userId);
    await group.save();

    // ✅ FIXED UNIQUE FRIENDSHIP: Sync friends for all members but exclude self
    // 1. Add the new user to everyone else's unique friends list
    await User.updateMany(
      { _id: { $in: group.members, $ne: userId } },
      { $addToSet: { friends: { user: userId } } }
    );
    
    // 2. Add everyone else to the new user's unique friends list
    const otherMembers = group.members.filter(id => id.toString() !== userId.toString());
    await User.findByIdAndUpdate(userId, {
      $addToSet: { friends: { $each: otherMembers.map(id => ({ user: id })) } }
    });

    await group.populate("members", "name email");
    return res.status(200).json({ message: "Member added and unique friends synced", group });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const removeMembersFromGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) return res.status(400).json({ message: "userIds must be an array" });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const currentUser = await User.findOne({ firebaseUID: req.user.firebaseUID });
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    if (!group.members.includes(currentUser._id)) return res.status(403).json({ message: "Access denied" });

    const updatedGroup = await Group.findByIdAndUpdate(groupId, { $pull: { members: { $in: userIds } } }, { new: true }).populate("members", "name email");
    return res.status(200).json({ message: "Members removed successfully", group: updatedGroup });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const currentUser = await User.findOne({ firebaseUID: req.user.firebaseUID });
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const isMember = group.members.some(id => id?.toString() === currentUser._id.toString());
    if (!isMember) return res.status(400).json({ message: "Access denied" });

    group.members = group.members.filter(id => id?.toString() !== currentUser._id.toString());
    await group.save();
    await group.populate("members", "name email");
    return res.status(200).json({ message: "Left group successfully", group });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};