// Required Modules
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const Web3 = require('web3');
const sqlite3 = require('sqlite3').verbose();

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite Database
const db = new sqlite3.Database('./nameservice.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS name_service (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            wallet_address TEXT NOT NULL,
            telegram_user_id INTEGER NOT NULL
        )`);
    }
});

// Connect to AirDAO Testnet
const web3 = new Web3('https://network.ambrosus-test.io');
if (!web3.isConnected) {
    console.error('Failed to connect to AirDAO Testnet.');
    process.exit(1);
}
console.log('Connected to AirDAO Testnet.');

// API Endpoints

// Check Name Availability
app.get('/api/check-name/:name', (req, res) => {
    const name = req.params.name.toLowerCase();
    db.get(`SELECT wallet_address FROM name_service WHERE name = ?`, [name], (err, row) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
        } else if (row) {
            res.json({ available: false, walletAddress: row.wallet_address });
        } else {
            res.json({ available: true });
        }
    });
});

// Register Name
app.post('/api/register-name', async (req, res) => {
    const { name, walletAddress, telegramUserId } = req.body;

    if (!name || !walletAddress || !telegramUserId) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    try {
        db.run(
            `INSERT INTO name_service (name, wallet_address, telegram_user_id) VALUES (?, ?, ?)`,
            [name.toLowerCase(), walletAddress, telegramUserId],
            (err) => {
                if (err) {
                    res.status(400).json({ error: 'Name already exists' });
                } else {
                    res.json({ success: true, message: `Name ${name} registered successfully.` });
                }
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Payment Confirmation
app.post('/api/confirm-payment', async (req, res) => {
    const { transactionHash, name, walletAddress } = req.body;

    if (!transactionHash || !name || !walletAddress) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    try {
        const receipt = await web3.eth.getTransactionReceipt(transactionHash);
        if (receipt && receipt.status) {
            res.json({ success: true, message: `Payment for ${name} confirmed.` });
        } else {
            res.status(400).json({ error: 'Transaction not confirmed' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error confirming transaction' });
    }
});

// Serve Frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// New Updates