import Expense from "../models/Expense.js";
import User from "../models/User.model.js";

export const createExpense = async (req, res) => {
  try {
    const { description, amount, group, participants = [], splits = [] } = req.body;

    // ❌ We cannot use req.user._id because middleware only gives firebaseUID
    // ✅ So first find user from DB
    const currentUser = await User.findOne({ firebaseUID: req.user.firebaseUID });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ paidBy should always be current logged-in user (secure)
    const paidBy = currentUser._id;

    // ❌ If splits is empty or undefined, reduce will crash
    // ✅ So we ensure splits exist
    if (splits.length === 0) {
      return res.status(400).json({ message: "Splits are required" });
    }

    // ✅ Validate: sum of splits must equal total amount
    const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);

    if (totalSplitAmount !== amount) {
      return res.status(400).json({ message: "Split amounts do not add up to total amount" });
    }

    // ✅ Ensure payer is included in participants
    // (important so later queries like find({ participants }) work correctly)
    const participantIds = participants.map(id => id.toString());

    if (!participantIds.includes(paidBy.toString())) {
      participants.push(paidBy);
    }

    // ⚠️ (Optional but good practice)
    // Ensure all split users are part of participants
    for (let split of splits) {
      if (!participantIds.includes(split.user.toString()) && split.user.toString() !== paidBy.toString()) {
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

    return res.status(201).json(expense.populate("paidBy", "name email").populate("participants", "name email").populate("splits.user", "name email"));

  } catch (error) {
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

    return res.status(200).json(expenses);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// update expense controller
export const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params; // expense id from URL
    const { description, amount, group, participants = [], splits = [] } = req.body;

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
    await updatedExpense
      .populate("paidBy", "name email")
      .populate("participants", "name email")
      .populate("splits.user", "name email");

    return res.status(200).json(updatedExpense);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete expense controller

export const deleteExpense = async (req, res) => {
    try {
        const { expenseId } = req.params; // expense id from URL

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
        return res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });  
    }
};