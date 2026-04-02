import User from "../models/User.model.js";

export const registerOrLoginUser = async (req, res) => {
  try {
    const { firebaseUID, name, email } = req.user; // coming from middleware

    let user = await User.findOne({ firebaseUID });

    // if not exists → create
    if (!user) {
      user = await User.create({
        firebaseUID,
        name,
        email
      });
    }

    res.status(200).json(user);
  } catch (error) {
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

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { firebaseUID } = req.user;

    const updatedUser = await User.findOneAndUpdate(
  { firebaseUID },
  req.body,
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

    await User.findOneAndDelete({ firebaseUID });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};