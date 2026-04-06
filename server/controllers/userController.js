import User from "../models/User.model.js";

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