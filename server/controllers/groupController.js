import Group from "../models/Group.model.js";
import User from "../models/User.model.js";
import Expense from "../models/Expense.js";

export const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;

    // ❌ req.user does NOT have _id
    // ✅ So fetch current user from DB using firebaseUID
    const currentUser = await User.findOne({
      firebaseUID: req.user.firebaseUID
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Create group with creator as first member
    const group = new Group({
      name,
      description,
      members: [currentUser._id], // creator added automatically
      createdBy: currentUser._id
    });
    group.populate("createdBy", "name email"); // 🔥 populate creator info
    group.populate("members", "name email"); // 🔥 populate for better response
    await group.save();

    return res.status(201).json({
      message: "Group created successfully",
      group
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getGroups = async (req, res) => {
  try {
    // get the current user first because we have to show 
    // only those groups on dashboard which this user is part of 

    const currentUser = await User.findOne({
      firebaseUID: req.user.firebaseUID
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const groups = await Group.find({
      members: currentUser._id
    })
      .populate("members", "name email")   // 🔥 show member details
      .populate("createdBy", "name email") // 🔥 show creator info
      .sort({ createdAt: -1 });            // 🔥 newest first

    return res.status(200).json({ groups });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get group details by ID, including expenses
export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate("members", "name email")
      .populate("createdBy", "name email");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // ✅ Get current user
    const currentUser = await User.findOne({
      firebaseUID: req.user.firebaseUID
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ❗ IMPORTANT: Authorization check
    const isMember = group.members.some(
      member => member._id.toString() === currentUser._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get all expenses for this group
    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "name email")        // who paid
      .populate("splits.user", "name email")   // who owes
      .sort({ createdAt: -1 });

    return res.status(200).json({ group, expenses });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateGroup = async (req, res) => {
  try {
    // TODO: Implement group update logic (e.g., change name/description, add/remove members)

    const { groupId } = req.params;
    const { name, description } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // ✅ Get current user
    const currentUser = await User.findOne({
      firebaseUID: req.user.firebaseUID
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ❗ IMPORTANT: Authorization check (only creator can update)
    if (group.createdBy.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // ✅ Update fields if provided
    if (name) group.name = name;
    if (description) group.description = description;

    await group.save();

    // ✅ Optional: populate for better frontend response
    await group.populate("members", "name email");
    await group.populate("createdBy", "name email");

    return res.status(200).json({
      message: "Group updated successfully",
      group
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
// Delete group by ID (only creator can delete, and it should also delete all related expenses)
export const deleteGroup = async (req, res) => {
  try {
    // Get group ID from params 
    const { groupId } = req.params;

    // Find the group by ID
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Get current user
    const currentUser = await User.findOne({
      firebaseUID: req.user.firebaseUID
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Authorization check (only creator can delete)
    if (group.createdBy.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // ✅ Delete all expenses related to this group (IMPORTANT)
    await Expense.deleteMany({ group: groupId });

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    return res.status(200).json({ message: "Group deleted successfully" });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Now here we will do the group balancing logic, which is the most important 
// part of the app and also the most complex one.
// We will calculate how much each member owes or is owed based on the expenses in the group, and return a summary of balances for each member. This will be used in the frontend to show who owes whom and how much.

// We will be using graph type thing to show the relationships between users and their debts.

export const calculateGroupBalances = async (groupId) => {
  const expenses = await Expense.find({ group: groupId })
    .populate("paidBy", "name email")
    .populate("splits.user", "name email");

  const balances = {}; // { from: { to: amount } }

  expenses.forEach(expense => {
    const paidBy = expense.paidBy._id.toString();

    expense.splits.forEach(split => {
      const owedBy = split.user._id.toString();
      const owedAmount = split.amount;

      // ❗ skip self
      if (owedBy === paidBy) return;

      // initialize structure
      if (!balances[owedBy]) balances[owedBy] = {};
      if (!balances[owedBy][paidBy]) balances[owedBy][paidBy] = 0;

      // 🔥 core logic
      balances[owedBy][paidBy] += owedAmount;
    });
  });

  return balances;
};

// Simplify expenses feature to minmize transactions 
 
export const simplifyExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;

    // ✅ Get current user
    const currentUser = await User.findOne({
      firebaseUID: req.user.firebaseUID
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Get group
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // ✅ Check membership
    const isMember = group.members.some(
      m => m.toString() === currentUser._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    // 🔥 STEP 1: Get graph
    const graph = await calculateGroupBalances(groupId);

    // 🔥 STEP 2: Convert to net balances
    const net = {};

    for (let from in graph) {
      for (let to in graph[from]) {
        const amount = graph[from][to];

        net[from] = (net[from] || 0) - amount;
        net[to] = (net[to] || 0) + amount;
      }
    }

    // 🔥 STEP 3: Separate users
    const creditors = [];
    const debtors = [];

    for (let user in net) {
      if (net[user] > 0) {
        creditors.push({ user, amount: net[user] });
      } else if (net[user] < 0) {
        debtors.push({ user, amount: -net[user] });
      }
    }

    // 🔥 STEP 4: Simplify (greedy)
    const transactions = [];

    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const amount = Math.min(debtor.amount, creditor.amount);

      transactions.push({
        from: debtor.user,
        to: creditor.user,
        amount
      });

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount === 0) i++;
      if (creditor.amount === 0) j++;
    }

    return res.status(200).json({ transactions });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;

    // 🔥 call service
    const balances = await calculateGroupBalances(groupId);

    // Add user details to balances for better frontend display
    const detailedBalances = {};

    for (let owedBy in balances) {
      detailedBalances[owedBy] = {};

      for (let owedTo in balances[owedBy]) {
        const amount = balances[owedBy][owedTo];

        // 🔥 populate BOTH users (important)
        const owedByUser = await User.findById(owedBy).select("name email");
        const owedToUser = await User.findById(owedTo).select("name email");

        detailedBalances[owedBy][owedTo] = {
          amount,
          owedByUser,   // 👈 added
          owedToUser    // 👈 already there conceptually
        };
      }
    }

    // ✅ send response (FIXED)
    return res.status(200).json({ balances: detailedBalances });

  } catch (error) {
    console.error("🔥 ERROR in getGroupBalances:", error); // 🔥 helpful log
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add member to group (only existing members can add, and no duplicates allowed)
export const addMemberToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Get current user
    const currentUser = await User.findOne({
      firebaseUID: req.user.firebaseUID
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ NEW: any member can add others
    if (!group.members.includes(currentUser._id)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    // ✅ Prevent duplicates
    if (group.members.includes(userId)) {
      return res.status(400).json({ message: "User already in group" });
    }

    // Add member
    group.members.push(userId);
    await group.save();

    return res.status(200).json({
      message: "Member added successfully",
      group
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};