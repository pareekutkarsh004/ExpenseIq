import mongoose,{Schema} from "mongoose";

const userSchema = new mongoose.Schema({
  firebaseUID: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  email: String
}, { timestamps: true });
const User = mongoose.model("User", userSchema);
export default User;