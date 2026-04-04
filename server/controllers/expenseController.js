import Expense from "../models/Expense.js";
import User from "../models/User.model.js";
import Group from "../models/Group.model.js"; // 🔥 added


export const createExpense = async (req, res) => {
  try {
    const { description, amount, group, participants = [], splits = [] } = req.body;

    console.log("📌 Incoming Body:", req.body); // 🔥

    // ❌ We cannot use req.user._id because middleware only gives firebaseUID
    // ✅ So first find user from DB
    const currentUser = await User.findOne({ firebaseUID: req.user.firebaseUID });

    if (!currentUser) {
      console.log("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ Current User:", currentUser._id); // 🔥

    // ✅ paidBy should always be current logged-in user (secure)
    const paidBy = currentUser._id;

    // ❌ If splits is empty or undefined, reduce will crash
    // ✅ So we ensure splits exist
    if (splits.length === 0) {
      console.log("❌ Splits missing");
      return res.status(400).json({ message: "Splits are required" });
    }

   // if current user is not part of group then return error 
    if(group){
      console.log("📌 Checking group:", group); // 🔥
      const isMember = await Group.findOne({ _id: group, members: currentUser._id });
      console.log("📌 isMember result:", isMember); // 🔥
      if (!isMember) {
        console.log("❌ User not part of group");
        return res.status(403).json({ message: "You are not a member of this group" });
      } 
    }

    // ✅ Validate: sum of splits must equal total amount
    const totalSplitAmount = splits.reduce((sum, split) => {
      console.log("➡️ Split:", split); // 🔥
      return sum + split.amount;
    }, 0);

    console.log("📊 Total Split:", totalSplitAmount, "Amount:", amount); // 🔥

    if (totalSplitAmount !== amount) {
      console.log("❌ Split mismatch");
      return res.status(400).json({ message: "Split amounts do not add up to total amount" });
    }

    // ✅ Ensure payer is included in participants
    // (important so later queries like find({ participants }) work correctly)
    const participantIds = participants.map(id => id.toString());

    console.log("📌 Participants:", participantIds); // 🔥

    if (!participantIds.includes(paidBy.toString())) {
      participants.push(paidBy);
      participantIds.push(paidBy.toString()); // 🔥 small fix
      console.log("➕ Added payer to participants");
    }

    // ⚠️ (Optional but good practice)
    // Ensure all split users are part of participants
    for (let split of splits) {
      if (!participantIds.includes(split.user.toString()) && split.user.toString() !== paidBy.toString()) {
        console.log("❌ Invalid split user:", split.user); // 🔥
        return res.status(400).json({ message: "Split user must be in participants" });
      }
    }

    // ✅ Create expense with clean validated data
    const expense = await Expense.create({
      description,
      amount,
      paidBy,
      group,
      participants,
      splits
    });

    console.log("✅ Expense created:", expense._id); // 🔥

    const populatedExpense = await expense.populate([
  { path: "paidBy", select: "name email" },
  // only add group info if group is provided (avoid unnecessary population)
  {path: "group", select: "name", match: group ? { _id: group } : null},
  { path: "participants", select: "name email" },
  { path: "splits.user", select: "name email" }
]);
    return res.status(201).json(populatedExpense);

  } catch (error) {
    console.error("🔥 ERROR in createExpense:", error); // 🔥
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const getExpenses = async (req, res) => {
  try {
    // First we will get the current User from DB using firebaseUID from req.user
    const firebaseUID = req.user.firebaseUID;
    const user = await User.findOne({ firebaseUID });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all expenses where current user is a participant, sorted by newest first
    const expenses = await Expense.find({
      participants: user._id,
    })
      .sort({ createdAt: -1 }) // newest first
      .populate("paidBy", "name email")
      .populate("participants", "name email")
      .populate("splits.user", "name email");

    console.log("📊 Fetched Expenses:", expenses.length); // 🔥

    return res.status(200).json(expenses);
  } catch (error) {
    console.error("🔥 ERROR in getExpenses:", error); // 🔥
    return res.status(500).json({ message: "Internal server error" });
  }
};


// update expense controller
export const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params; // expense id from URL
    const { description, amount, group, participants = [], splits = [] } = req.body;

    console.log("📌 Update Expense:", expenseId); // 🔥

    // Find current user
    const currentUser = await User.findOne({ firebaseUID: req.user.firebaseUID });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find expense
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Optional: Only the payer can update
    if (expense.paidBy.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: "You are not allowed to update this expense" });
    }

    // Validate splits
    if (splits.length > 0) {
      const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
      console.log("📊 Update Split Total:", totalSplitAmount); // 🔥
      if (totalSplitAmount !== amount) {
        return res.status(400).json({ message: "Split amounts do not add up to total amount" });
      }
    }

    // Ensure payer is in participants
    const participantIds = participants.map(id => id.toString());
    if (!participantIds.includes(expense.paidBy.toString())) {
      participants.push(expense.paidBy);
    }

    // Optional: Validate splits users are in participants
    for (let split of splits) {
      if (!participantIds.includes(split.user.toString()) && split.user.toString() !== expense.paidBy.toString()) {
        console.log("❌ Invalid split in update:", split.user); // 🔥
        return res.status(400).json({ message: "Split user must be in participants" });
      }
    }

    // Update fields
    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (group) expense.group = group;
    if (participants.length > 0) expense.participants = participants;
    if (splits.length > 0) expense.splits = splits;

    // Save and populate before sending
    const updatedExpense = await expense.save();

    console.log("✅ Expense updated:", updatedExpense._id); // 🔥

    await updatedExpense
      .populate("paidBy", "name email")
      .populate("participants", "name email")
      .populate("splits.user", "name email");

    return res.status(200).json(updatedExpense);
  } catch (error) {
    console.error("🔥 ERROR in updateExpense:", error); // 🔥
    return res.status(500).json({ message: "Internal server error" });
  }
};


// Delete expense controller

export const deleteExpense = async (req, res) => {
    try {
        const { expenseId } = req.params; // expense id from URL

        console.log("📌 Delete Expense:", expenseId); // 🔥

        // Find current user
        const currentUser = await User.findOne({ firebaseUID: req.user.firebaseUID });
        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find expense
        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }
        // Optional: Only the payer can delete
        if (expense.paidBy.toString() !== currentUser._id.toString()) {
            return res.status(403).json({ message: "You are not allowed to delete this expense" });
        }

        await Expense.findByIdAndDelete(expenseId);

        console.log("✅ Expense deleted"); // 🔥

        return res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
        console.error("🔥 ERROR in deleteExpense:", error); // 🔥
        return res.status(500).json({ message: "Internal server error" });  
    }
};


export const getBalances = async (req, res) => {
  try {
    // Get current user and for this user we will make graph type structure in which 
    // it would be informed this user owes this much to other user and this user is owed 
    // this much by other user. So we will loop through all expenses of this user and calculate these values.

    const firebaseUID = req.user.firebaseUID;

    // get the current user from DB
    const currentUser = await User.findOne({
      firebaseUID
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all expenses where current user is a participant
    const expenses = await Expense.find({
      participants: currentUser._id
    });

    console.log("📊 Balance Expenses Count:", expenses.length); // 🔥

    if (expenses.length === 0) {
      return res.status(200).json({ balances: [] });
    }

    // { userId: netAmount }
    // positive → that user owes current user
    // negative → current user owes that user
    const balances = {};

    for (let expense of expenses) {
      const paidBy = expense.paidBy.toString(); // ObjectId → string
      const currentUserId = currentUser._id.toString();

      // Find the split for current user
      const userSplit = expense.splits.find(
        split => split.user.toString() === currentUserId
      );

      if (!userSplit) continue;

      const amountOwed = userSplit.amount;

      if (paidBy === currentUserId) {
        // Current user paid, so others owe current user
        for (let split of expense.splits) {
          if (split.user.toString() !== currentUserId) {
            const otherUserId = split.user.toString();

            balances[otherUserId] =
              (balances[otherUserId] || 0) + split.amount;
          }
        }
      } else {
        // Current user owes the payer
        balances[paidBy] =
          (balances[paidBy] || 0) - amountOwed;
      }
    }

    console.log("📊 Raw Balances:", balances); // 🔥

    // 🔥 Convert balances object → UI friendly array
    const result = [];

    // Loop over each userId in balances
    for (let userId in balances) {
      const amount = balances[userId];

      // Fetch user details (only required fields)
      const user = await User.findById(userId).select("name email");

      if (!user) continue;

      result.push({
        user, // { name, email }
        amount: Math.abs(amount), // always positive for UI
        type: amount > 0 ? "owes_you" : "you_owe" // decide relation
      });
    }

    // ✅ Final response for frontend
    return res.status(200).json({ balances: result });

  } catch (error) {
    console.error("🔥 ERROR in getBalances:", error); // 🔥
    return res.status(500).json({ message: error.message });
  }
};