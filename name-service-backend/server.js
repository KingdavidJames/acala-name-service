// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Define Schemas and Models

// Schema for Registered Names
const registeredNameSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., "something.amb"
    walletAddress: { type: String, required: true },      // User's wallet address
    registrationDate: { type: Date, default: Date.now },
});

const RegisteredName = mongoose.model('RegisteredName', registeredNameSchema);

// Schema for Transactions
const transactionSchema = new mongoose.Schema({
    transactionHash: { type: String, required: true, unique: true },
    transactionTime: { type: String, required: true },
    payerAddress: { type: String, required: true },
    yearsPaid: { type: Number, required: true },
    payeeName: { type: String, required: true },
    payeeAddress: { type: String, required: true },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// API Endpoints

// Register a Name
app.post('/api/register-name', async (req, res) => {
    const { name, walletAddress } = req.body;

    // Input validation
    if (!name || !walletAddress) {
        return res.status(400).json({ message: 'Name and wallet address are required.' });
    }

    // Ensure name ends with '.amb'
    const formattedName = name.toLowerCase().endsWith('.amb') ? name.toLowerCase() : `${name.toLowerCase()}.amb`;

    try {
        // Check if name is already taken
        const existingName = await RegisteredName.findOne({ name: formattedName });
        if (existingName) {
            return res.status(400).json({ message: 'Name is already taken.' });
        }

        // Create new registered name
        const newRegisteredName = new RegisteredName({
            name: formattedName,
            walletAddress: walletAddress.toLowerCase(),
        });

        await newRegisteredName.save();
        res.status(201).json({ message: 'Name registered successfully.', name: formattedName });
    } catch (error) {
        console.error('Error registering name:', error);
        res.status(500).json({ message: 'Server error while registering name.' });
    }
});

// Check if Name is Taken
app.get('/api/check-name', async (req, res) => {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ message: 'Name query parameter is required.' });
    }

    const formattedName = name.toLowerCase().endsWith('.amb') ? name.toLowerCase() : `${name.toLowerCase()}.amb`;

    try {
        const existingName = await RegisteredName.findOne({ name: formattedName });
        if (existingName) {
            res.status(200).json({ taken: true, message: 'Name is already taken.' });
        } else {
            res.status(200).json({ taken: false, message: 'Name is available.' });
        }
    } catch (error) {
        console.error('Error checking name:', error);
        res.status(500).json({ message: 'Server error while checking name.' });
    }
});

// Save Transaction
app.post('/api/transactions', async (req, res) => {
    const { transactionHash, transactionTime, payerAddress, yearsPaid, payeeName, payeeAddress } = req.body;

    // Input validation
    if (!transactionHash || !transactionTime || !payerAddress || !yearsPaid || !payeeName || !payeeAddress) {
        return res.status(400).json({ message: 'All transaction details are required.' });
    }

    try {
        // Check if transaction already exists
        const existingTx = await Transaction.findOne({ transactionHash });
        if (existingTx) {
            return res.status(400).json({ message: 'Transaction already recorded.' });
        }

        // Create new transaction
        const newTransaction = new Transaction({
            transactionHash,
            transactionTime,
            payerAddress: payerAddress.toLowerCase(),
            yearsPaid,
            payeeName: payeeName.toLowerCase(),
            payeeAddress: payeeAddress.toLowerCase(),
        });

        await newTransaction.save();
        res.status(201).json({ message: 'Transaction saved successfully.' });
    } catch (error) {
        console.error('Error saving transaction:', error);
        res.status(500).json({ message: 'Server error while saving transaction.' });
    }
});

// Get Transaction by Hash
app.get('/api/transactions', async (req, res) => {
    const { hash } = req.query;

    if (!hash) {
        return res.status(400).json({ message: 'Transaction hash query parameter is required.' });
    }

    try {
        const transaction = await Transaction.findOne({ transactionHash: hash });
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found.' });
        }
        res.status(200).json(transaction);
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ message: 'Server error while fetching transaction.' });
    }
});

// Get Registered Names
app.get('/api/registered-names', async (req, res) => {
    try {
        const names = await RegisteredName.find();
        res.status(200).json(names);
    } catch (error) {
        console.error('Error fetching registered names:', error);
        res.status(500).json({ message: 'Server error while fetching registered names.' });
    }
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
