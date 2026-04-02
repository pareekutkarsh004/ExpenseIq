import mongoose, { Schema } from "mongoose";

const userSchema = new mongoose.Schema({
  firebaseUID: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  email: String,

  // ✅ ADD THIS
  friends: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User"
      },
      status: {
        type: String,
        enum: ["pending", "accepted"],
        default: "pending"
      }
    }
  ]

}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;