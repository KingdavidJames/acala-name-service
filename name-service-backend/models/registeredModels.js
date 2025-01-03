import mongoose from 'mongoose';


// Schema for Registered Names
const registeredNameSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., "something.amb"
    walletAddress: { type: String, required: true },
    yearsPaid: {type: Number},      // User's wallet address
    registrationDate: { type: Date, default: Date.now },
    expirationDate: { type: Date, required: true },
    transactionId: { type: mongoose.Schema.ObjectId, ref: "Transaction", default: null },
});

const RegisteredName = mongoose.model('RegisteredName', registeredNameSchema);

export default RegisteredName;