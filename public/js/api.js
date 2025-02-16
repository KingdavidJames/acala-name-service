// api.js

// Base URL of your backend API
const API_BASE_URL = 'http://localhost:5002/api'; // Replace with your actual backend URL

/**
 * Registers a new name with the provided wallet address.
 * @param {string} name - The name to register.
 * @param {string} walletAddress - The associated wallet address.
 * @returns {Promise<Object>} - The response from the server.
 */
export async function registerName(name, walletAddress, yearsPaid, transactionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/register-name`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, walletAddress, yearsPaid, transactionId }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to register name.');
        }

        return data;
    } catch (error) {
        console.error('Error in registerName:', error);
        throw error;
    }
}

/**
 * Checks if a given name is already taken.
 * @param {string} name - The name to check.
 * @returns {Promise<Object>} - The response indicating if the name is taken.
 */
export async function checkName(name) {
    try {
        const params = new URLSearchParams({ name });
        const response = await fetch(`${API_BASE_URL}/check-name?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to check name.');
        }

        return data;
    } catch (error) {
        console.error('Error in checkName:', error);
        throw error;
    }
}

/**
 * Saves a new transaction.
 * @param {Object} transactionData - The transaction details.
 * @param {string} transactionData.transactionHash
 * @param {string} transactionData.transactionTime
 * @param {string} transactionData.payerAddress
 * @param {number} transactionData.yearsPaid
 * @param {string} transactionData.payeeName
 * @param {string} transactionData.payeeAddress
 * @returns {Promise<Object>} - The response from the server.
 */
export async function saveTransaction(transactionData) {
    try {
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transactionData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to save transaction.');
        }

        return data;
    } catch (error) {
        console.error('Error in saveTransaction:', error);
        throw error;
    }
}

/**
 * Retrieves a transaction by its hash.
 * @param {string} hash - The transaction hash.
 * @returns {Promise<Object>} - The transaction details.
 */
export async function getTransaction(hash) {
    try {
        const params = new URLSearchParams({ hash });
        const response = await fetch(`${API_BASE_URL}/transactions?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch transaction.');
        }

        return data;
    } catch (error) {
        console.error('Error in getTransaction:', error);
        throw error;
    }
}

/**
 * Fetches all registered names.
 * @returns {Promise<Array>} - An array of registered names.
 */
export async function getDecrypt(name) {
    try {
        const params = new URLSearchParams({ name });
        const response = await fetch(`${API_BASE_URL}/decrypt?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response) {
            throw new Error(data.message || `The name ${name} does not exist in the ANS registry.`);
        }

        return data;
    } catch (error) {
        console.error('Error in getRegisteredNames:', error);
        throw error;
    }
}
