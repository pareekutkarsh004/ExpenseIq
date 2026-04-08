import User from "../models/User.model.js";
import Expense from "../models/Expense.js";

export const registerOrLoginUser = async (req, res) => {
  try {
    const { firebaseUID, email } = req.user; 
    
    // ✅ Use optional chaining or an empty object fallback to prevent the crash
    const name = req.body?.name || req.user?.name || "New User"; 

    let user = await User.findOne({ firebaseUID });

    if (!user) {
      user = await User.create({
        firebaseUID,
        email,
        name: name
      });
      console.log("✅ Created new user with name:", user.name);
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("🔥 Error in registerOrLoginUser:", error);
    res.status(500).json({ message: error.message });
  }
};
// To display data on frontend we will use GetCurrentUser
export const getCurrentUser = async (req, res) => {
  try {
    const { firebaseUID } = req.user;

    const user = await User.findOne({ firebaseUID })
      .populate("friends.user", "name email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Programmer Filter: Ensure user is never their own friend in the UI
    const uniqueFriends = [];
    const friendIds = new Set();

    user.friends.forEach(f => {
      if (f.user && 
          f.user._id.toString() !== user._id.toString() && 
          !friendIds.has(f.user._id.toString())) {
        friendIds.add(f.user._id.toString());
        uniqueFriends.push(f);
      }
    });

    const userObj = user.toObject();
    userObj.friends = uniqueFriends;

    res.status(200).json(userObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const updateUser = async (req, res) => {
  try {
    const { firebaseUID } = req.user;

    const { name } = req.body;

const updatedUser = await User.findOneAndUpdate(
  { firebaseUID },
  { name },
  { returnDocument: "after" }
);

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { firebaseUID } = req.user;

    const user = await User.findOneAndDelete({ firebaseUID });

if (!user) {
  return res.status(404).json({ message: "User not found" });
}

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("name email");

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFriendLedger = async (req, res) => {
  try {
    const { firebaseUID } = req.user;
    const { friendId } = req.params;

    const currentUser = await User.findOne({ firebaseUID });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const friend = await User.findById(friendId).select("name email");
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    const expenses = await Expense.find({
      participants: { $all: [currentUser._id, friendId] }
    })
      .sort({ createdAt: -1 })
      .populate("paidBy", "name email")
      .populate("group", "name")
      .populate("participants", "name email")
      .populate("splits.user", "name email");

    const currentUserId = currentUser._id.toString();
    const friendUserId = friend._id.toString();

    let netBalance = 0;

    const ledgerExpenses = expenses.map((expense) => {
      const yourSplit = expense.splits.find(
        (split) => split.user?._id?.toString() === currentUserId || split.user?.toString() === currentUserId
      );
      const friendSplit = expense.splits.find(
        (split) => split.user?._id?.toString() === friendUserId || split.user?.toString() === friendUserId
      );

      const yourShare = Number((yourSplit?.amount || 0).toFixed(2));
      const friendShare = Number((friendSplit?.amount || 0).toFixed(2));

      let pairImpact = 0;

      if (expense.paidBy?._id?.toString() === currentUserId) {
        pairImpact = friendShare;
        netBalance += friendShare;
      } else if (expense.paidBy?._id?.toString() === friendUserId) {
        pairImpact = -yourShare;
        netBalance -= yourShare;
      }

      return {
        _id: expense._id,
        description: expense.description,
        amount: expense.amount,
        createdAt: expense.createdAt,
        group: expense.group,
        paidBy: expense.paidBy,
        participants: expense.participants,
        yourShare,
        friendShare,
        pairImpact: Number(pairImpact.toFixed(2))
      };
    });

    const roundedNetBalance = Number(netBalance.toFixed(2));

    return res.status(200).json({
      friend,
      netBalance: roundedNetBalance,
      summary: {
        youOwe: roundedNetBalance < 0 ? Math.abs(roundedNetBalance) : 0,
        youAreOwed: roundedNetBalance > 0 ? roundedNetBalance : 0,
        status: roundedNetBalance > 0 ? "owes_you" : roundedNetBalance < 0 ? "you_owe" : "settled"
      },
      expenses: ledgerExpenses
    });
  } catch (error) {
    console.error("🔥 Error in getFriendLedger:", error);
    res.status(500).json({ message: error.message });
  }
};
