// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import configDB from './config/database.js';
import Transaction from './models/paymentModel.js';
import RegisteredName from './models/registeredModels.js';

dotenv.config();
configDB();

const app = express();

// Middleware
app.use(cors({
    origin: 'http://127.0.0.1:5501',
}));
app.use(express.json());


// API Endpoints

// Register a Name
app.post('/api/register-name', async (req, res) => {
    const { name, walletAddress, yearsPaid, amount } = req.body;
    // const name = 'hamza';
    // const walletAddress = '0x1234567890123456789012345678901234567890';

    // Input validation
    if (!name || !walletAddress) {
        return res.status(400).json({ message: 'Name and wallet address are required.' });
    }

    // Ensure name ends with '.aca'
    const formattedName = name.toLowerCase().endsWith('.aca') ? name.toLowerCase() : `${name.toLowerCase()}.aca`;

    try {
        // Check if name is already taken
        const existingName = await Transaction.findOne({ name: formattedName });
        if (existingName) {
            return res.status(400).json({ message: 'Name is already taken.' });
        }

        // Create new registered name
        const newRegisteredName = new Transaction({
            name: formattedName,
            walletAddress: walletAddress.toLowerCase(),
            yearsPaid,
            amount,
            // expirationDate: new Date(Date.now() + yearsPaid * 365 * 24 * 60 * 60 * 1000),
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

    const formattedName = name.toLowerCase().endsWith('.aca') ? name.toLowerCase() : `${name.toLowerCase()}.aca`;

    try {
        const existingName = await Transaction.findOne({ payeeName: formattedName });
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
    const { transactionHash, transactionTime, payerAddress, yearsPaid, payeeName, payeeAddress, amount } = req.body;

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
            amount,
        });

        await newTransaction.save();
        res.status(201).json({ message: 'Transaction saved successfully.', transactionId: newTransaction._id });
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
app.get('/api/decrypt', async (req, res) => {
    const { name } = req.query;
    try {
        const user = await Transaction.findOne({ payeeName: name });
        if (user) {
            console.log(user);
            res.status(200).json(user);
        }
        else {
            console.log('User not found');
            res.status(404).json({ message: `${name} does not exist in the ANS registry` });
        }
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
