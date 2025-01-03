import mongoose from "mongoose";

// Schema for Transactions
const transactionSchema = new mongoose.Schema({
    transactionHash: { type: String, unique: true },
    transactionTime: { type: String },
    payerAddress: { type: String },
    amount: { type: String },
    yearsPaid: { type: Number },
    payeeName: { type: String, required: true },
    payeeAddress: { type: String },
    expirationDate: { type: Date },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
