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

    if (Math.abs(totalSplitAmount - amount) > 0.01) {
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
      { path: "group", select: "name", match: group ? { _id: group } : null },
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
    const firebaseUID = req.user.firebaseUID;
    const user = await User.findOne({ firebaseUID });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const expenses = await Expense.find({
      participants: user._id,
    })
      .sort({ createdAt: -1 })
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
    const { expenseId } = req.params;
    const { description, amount, group, participants = [], splits = [] } = req.body;

    console.log("📌 Update Expense:", expenseId); // 🔥

    const currentUser = await User.findOne({ firebaseUID: req.user.firebaseUID });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (expense.paidBy.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: "You are not allowed to update this expense" });
    }

    if (splits.length > 0) {
      const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
      console.log("📊 Update Split Total:", totalSplitAmount); // 🔥
      if (totalSplitAmount !== amount) {
        return res.status(400).json({ message: "Split amounts do not add up to total amount" });
      }
    }

    const participantIds = participants.map(id => id.toString());
    if (!participantIds.includes(expense.paidBy.toString())) {
      participants.push(expense.paidBy);
    }

    for (let split of splits) {
      if (!participantIds.includes(split.user.toString()) && split.user.toString() !== expense.paidBy.toString()) {
        console.log("❌ Invalid split in update:", split.user); // 🔥
        return res.status(400).json({ message: "Split user must be in participants" });
      }
    }

    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (group) expense.group = group;
    if (participants.length > 0) expense.participants = participants;
    if (splits.length > 0) expense.splits = splits;

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
    const { expenseId } = req.params;

    console.log("📌 Delete Expense:", expenseId); // 🔥

    const currentUser = await User.findOne({ firebaseUID: req.user.firebaseUID });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

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
    const firebaseUID = req.user.firebaseUID;

    const currentUser = await User.findOne({ firebaseUID });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const expenses = await Expense.find({
      participants: currentUser._id
    });

    console.log("📊 Balance Expenses Count:", expenses.length); // 🔥

    if (expenses.length === 0) {
      return res.status(200).json({
        balances: [],
        totalYouOwe: 0,
        totalYouAreOwed: 0,
        totalBalance: 0,
        personalTotal: 0
      });
    }

    const balances = {};
    let personalTotal = 0; // ✅ FIX: moved outside loop

    for (let expense of expenses) {
      const paidBy = expense.paidBy.toString();
      const currentUserId = currentUser._id.toString();

      const userSplit = expense.splits.find(
        split => split.user.toString() === currentUserId
      );

      // 🔥 FIX: do NOT skip expense
      const amountOwed = userSplit ? userSplit.amount : 0;

      // ✅ NEW: handle personal expense separately
      if (expense.participants.length === 1) {
        personalTotal += expense.amount;
        continue;
      }

      if (paidBy === currentUserId) {
        for (let split of expense.splits) {
          if (split.user.toString() !== currentUserId) {
            const otherUserId = split.user.toString();

            balances[otherUserId] =
              (balances[otherUserId] || 0) + split.amount;
          }
        }
      } else {
        if (amountOwed > 0) {
          balances[paidBy] =
            (balances[paidBy] || 0) - amountOwed;
        }
      }
    }

    console.log("📊 Raw Balances:", balances); // 🔥
    console.log("💰 Personal Total:", personalTotal); // 🔥

    const result = [];

    for (let userId in balances) {
      const amount = balances[userId];

      const user = await User.findById(userId).select("name email");

      if (!user) continue;

      result.push({
        user,
        amount: Math.abs(amount),
        type: amount > 0 ? "owes_you" : "you_owe"
      });
    }

    let totalYouOwe = 0;
    let totalYouAreOwed = 0;

    for (let userId in balances) {
      const amount = balances[userId];

      if (amount > 0) {
        totalYouAreOwed += amount;
      } else {
        totalYouOwe += Math.abs(amount);
      }
    }

    console.log(`Total You Owe: ${totalYouOwe}, Total You Are Owed: ${totalYouAreOwed}`); // 🔥

    return res.status(200).json({
      balances: result,
      totalYouOwe,
      totalYouAreOwed,
      totalBalance: totalYouAreOwed - totalYouOwe,
      personalTotal // ✅ FIX: added properly
    });

  } catch (error) {
    console.error("🔥 ERROR in getBalances:", error);
    return res.status(500).json({ message: error.message });
  }
};
