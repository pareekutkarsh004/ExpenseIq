import mongoose, { Schema } from 'mongoose';

const expenseSchema = new Schema({
  description: {
    type: String,
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  paidBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  group: {
    type: Schema.Types.ObjectId,
    ref: "Group"
  },

  participants: [   // ✅ ADD THIS
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  splits: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User"
      },
      amount: Number
    }
  ]

}, { timestamps: true });

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;