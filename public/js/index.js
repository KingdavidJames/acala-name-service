
/*************************************
 * MetaMask Payment Functionality
 *************************************/
// Select the MetaMask payment option
const metamaskPaymentButton = document.getElementById('metamask');

const modalTotalAMBEl = document.getElementById('modalTotalAMB');

const yearDisplay = document.getElementById("yearDisplay");
const nameChosenEl = document.getElementById("nameChosen");
const yearDetails = document.querySelector(".year-details span");

// AMB Token Contract Details
// Recipient wallet address (Payee)
const RECIPIENT_ADDRESS = '0x1787b2190C575bAFb61d8582589E0eB4DFBA2C84'; // Replace with actual address

// Define the network chain ID for AirDAO Testnet
const AIRDAO_TESTNET_CHAIN_ID = 22040; // Decimal

const AMB_DECIMALS = 18; // Typically, ERC-20 tokens have 18 decimals

// Initialize Ethers.js Provider and Signer
let provider;
let signer;

/**
 * Initialize Ethers.js and log network details for debugging
 */
async function initializeEthers() {
    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();

        try {
            const network = await provider.getNetwork();
            console.log('Connected Network:', network);
            // Expected Output:
            // Connected Network: { chainId: 22040, name: 'unknown' }
        } catch (error) {
            console.error('Error fetching network:', error);
            alert('Failed to fetch network details. Please try again.');
        }
    } else {
        alert('MetaMask is not installed. Please install MetaMask and try again.');
    }
}


/**
 * Validate Ethereum Address
 * @param {string} address - Ethereum address to validate
 * @returns {boolean} - True if valid, else false
 */
function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Initiate AMB Token Transfer with Monitoring
 * @param {string} amount - Amount in AMB to transfer (e.g., "10")
 */
async function transferAMB(amount) {
    try {
        // Validate Addresses
        if (!isValidEthereumAddress(AMB_CONTRACT_ADDRESS)) {
            alert('AMB Contract Address is invalid. Please check and try again.');
            return;
        }

        if (!isValidEthereumAddress(RECIPIENT_ADDRESS)) {
            alert('Recipient Address is invalid. Please check and try again.');
            return;
        }

        // Convert AMB amount to Wei based on decimals
        const amountInWei = ethers.utils.parseUnits(amount, AMB_DECIMALS);

        // Get initial balance of recipient
        const initialBalance = await ambContract.balanceOf(RECIPIENT_ADDRESS);
        console.log(`Initial Balance of Recipient: ${ethers.utils.formatUnits(initialBalance, AMB_DECIMALS)} AMB`);

        // Initiate transfer
        const tx = await ambContract.transfer(RECIPIENT_ADDRESS, amountInWei);
        console.log('Transaction sent:', tx.hash);

        // Wait for the transaction to be mined
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt.transactionHash);

        // Get final balance of recipient
        const finalBalance = await ambContract.balanceOf(RECIPIENT_ADDRESS);
        console.log(`Final Balance of Recipient: ${ethers.utils.formatUnits(finalBalance, AMB_DECIMALS)} AMB`);

        // Calculate received amount
        const receivedAmount = ethers.utils.formatUnits(finalBalance.sub(initialBalance), AMB_DECIMALS);
        console.log(`Recipient received: ${receivedAmount} AMB`);

        if (parseFloat(receivedAmount) !== parseFloat(amount)) {
            alert('The received amount does not match the transferred amount. Please contact support.');
            return;
        }

        // Gather transaction details
        const transactionHash = receipt.transactionHash;
        const block = await provider.getBlock(receipt.blockNumber);
        const timestamp = block.timestamp;
        const date = new Date(timestamp * 1000); // Convert UNIX timestamp to JS Date

        // Get the payer's wallet address
        const payerAddress = await signer.getAddress();

        // Get the number of years the user paid for
        const totalAMB = parseInt(modalTotalAMBEl.textContent); // Assuming this element contains the total AMB

        // Save transaction details to localStorage for the success page
        localStorage.setItem('transactionHash', transactionHash);
        localStorage.setItem('transactionTime', date.toLocaleString());
        localStorage.setItem('payerAddress', payerAddress);
        localStorage.setItem('yearsPaid', yearDetails.textContent.toString());
        localStorage.setItem('payeeName', nameChosenEl.textContent.toLowerCase());
        localStorage.setItem('payeeAddress', RECIPIENT_ADDRESS);


        // Redirect to order-success.html
        window.location.href = 'order-success.html';
    } catch (error) {
        console.error('Error during AMB transfer:', error);
        alert(`Transaction failed: ${error.message}`);
    }
}


/**
 * Connect to MetaMask and switch to AirDAO Testnet.
 */
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        // No window.ethereum => MetaMask not installed
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
            // Redirect mobile users to MetaMask link
            // (Adjust your domain below as needed)
            toast.info("Redirecting to MetaMask...");
            window.location.href = "https://metamask.app.link/dapp/https://air-daonameservice.vercel.app/";
        } else {
            alert("Please install MetaMask to continue.");
        }
        return; // Stop here since no MetaMask is available
    }

    // MetaMask is present
    try {
        // Request account access
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const walletAddress = accounts[0];

        // Initialize Ethers.js
        await initializeEthers();

        // Check if user is on AirDAO Testnet
        const network = await provider.getNetwork();
        if (network.chainId !== AIRDAO_TESTNET_CHAIN_ID) {
            // Prompt user to switch
            try {
                await ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: ethers.utils.hexlify(AIRDAO_TESTNET_CHAIN_ID) }],
                });
            } catch (switchError) {
                // 4902 => chain not added to MetaMask
                if (switchError.code === 4902) {
                    try {
                        await ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [
                                {
                                    chainId: ethers.utils.hexlify(AIRDAO_TESTNET_CHAIN_ID),
                                    chainName: 'AirDAO Testnet',
                                    rpcUrls: ['https://network.ambrosus-test.io'],
                                    nativeCurrency: {
                                        name: 'Amber Testnet',
                                        symbol: 'AMB',
                                        decimals: 18,
                                    },
                                    blockExplorerUrls: ['https://explorer.ambrosus-test.io'],
                                },
                            ],
                        });
                    } catch (addError) {
                        console.error('Error adding the chain:', addError);
                        alert('Failed to add AirDAO Testnet to MetaMask. Please try again.');
                        return;
                    }
                } else {
                    console.error('Error switching network:', switchError);
                    alert('Failed to switch to AirDAO Testnet. Please try again.');
                    return;
                }
            }
        }

        // Save connection state
        localStorage.setItem('connectedWallet', walletAddress);

        // Update UI
        updateUI(walletAddress);

    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
    }
}



/**
 * Listen for account or network changes in MetaMask
 */
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            // MetaMask is locked or the user has not connected any accounts
            disconnectWallet();
        } else {
            // Update the connected wallet address
            localStorage.setItem('connectedWallet', accounts[0]);
            updateUI(accounts[0]);
        }
    });

    window.ethereum.on('chainChanged', (chainId) => {
        // Reload the page to avoid any errors with chain change
        window.location.reload();
    });
}

/**
 * Disconnect the wallet by clearing localStorage.
 */
function disconnectWallet() {
    // Clear connection state
    localStorage.removeItem('connectedWallet');

    // Update UI
    updateUI(null);
}

/**
 * Update UI based on the connection state.
 * @param {string|null} walletAddress - The connected wallet address or null if disconnected.
 */
function updateUI(walletAddress) {
    const connectButton = document.querySelector('.con-bot');
    const walletDisplays = document.querySelectorAll('.walletshow');
    const walletAddresses = document.querySelectorAll('.wallet-address');

    if (walletAddress) {
        connectButton.textContent = 'Disconnect';
        connectButton.onclick = disconnectWallet;

        // Update all wallet displays
        walletDisplays.forEach(display => display.classList.remove('d-none'));

        // Update all wallet address elements
        walletAddresses.forEach(addr => {
            addr.textContent = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
        });
    } else {
        connectButton.textContent = 'Connect Wallet';
        connectButton.onclick = connectWallet;

        // Hide all wallet displays
        walletDisplays.forEach(display => display.classList.add('d-none'));

        // Clear all wallet address elements
        walletAddresses.forEach(addr => {
            addr.textContent = '';
        });
    }
}

/**
 * Check connection state on page load.
 */
function checkConnection() {
    const connectedWallet = localStorage.getItem('connectedWallet');
    if (connectedWallet) {
        updateUI(connectedWallet);
    } else {
        updateUI(null);
    }
}

/**
 * Handle MetaMask Payment Click
 */
async function handleMetaMaskPayment() {
    // Check if wallet is connected
    const connectedWallet = localStorage.getItem('connectedWallet');

    if (!connectedWallet) {
        alert('No wallet connected. Please connect your wallet and try again.');
        return;
    }

    // Initialize Ethers.js
    await initializeEthers();

    if (!provider || !signer) {
        alert('Failed to initialize MetaMask connection.');
        return;
    }

    try {
        // Verify if the user is on the correct network (AirDAO Testnet)
        const network = await provider.getNetwork();
        if (network.chainId !== AIRDAO_TESTNET_CHAIN_ID) {
            alert('Please switch to the AirDAO Testnet in MetaMask.');
            return;
        }

        // Define the amount to transfer based on yearCount and pricing
        const totalAMB = parseInt(modalTotalAMBEl.textContent); // e.g., 10 AMB

        // Convert AMB to Wei (assuming AMB has 18 decimals)
        const amountInWei = ethers.utils.parseUnits(totalAMB.toString(), 18);

        localStorage.setItem('amount', totalAMB);
        // Confirm with the user before initiating the transfer
        const userConfirmed = confirm(`Do you want to send ${totalAMB} AMB to the recipient?`);
        if (!userConfirmed) {
            return;
        }

        // Get the payer's wallet address
        const payerAddress = await signer.getAddress();

        // Initiate the transfer
        const tx = await signer.sendTransaction({
            to: RECIPIENT_ADDRESS,
            value: amountInWei,
        });

        console.log('Transaction sent:', tx.hash);

        // Optionally, show a spinner or loading indicator here

        // Wait for the transaction to be mined
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt.transactionHash);

        // Gather transaction details
        const transactionHash = receipt.transactionHash;
        const block = await provider.getBlock(receipt.blockNumber);
        const timestamp = block.timestamp;
        const date = new Date(timestamp * 1000); // Convert UNIX timestamp to JS Date

        // Get the number of years the user paid for
        // const yearsPaid = yearCount; // Assuming `yearCount` is defined globally

        // Save transaction details to localStorage for the success page
        localStorage.setItem('transactionHash', transactionHash);
        localStorage.setItem('transactionTime', date.toLocaleString());
        localStorage.setItem('payerAddress', payerAddress);
        localStorage.setItem('yearsPaid', yearDetails.textContent.toString());
        localStorage.setItem('payeeName', nameChosenEl.textContent.toLowerCase());
        localStorage.setItem('payeeAddress', RECIPIENT_ADDRESS);

        // Redirect to order-success.html
        window.location.href = 'order-success.html';
    } catch (error) {
        console.error('Error during AMB transfer:', error);
        alert(`Transaction failed: ${error.message}`);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', checkConnection);


// Initialize on page load
document.addEventListener('DOMContentLoaded', checkConnection);

/*************************************
 * Add event listener to MetaMask button
 *************************************/
if (metamaskPaymentButton) {
    metamaskPaymentButton.addEventListener('click', handleMetaMaskPayment);
}

/*************************************
 * Modal Buttons and Spinners (Existing Functionality)
 *************************************/

// Select all modal buttons
const modalButtons = document.querySelectorAll(".md-but");
const body = document.body;
const conBot = document.querySelector(".con-bot");
const walletShow = document.querySelector(".walletshow");

// Add click event listeners to modal buttons
modalButtons.forEach(button => {
    button.addEventListener("click", () => {
        // Close the modal
        const modalElement = document.querySelector("#staticBackdrop");
        if (modalElement) {
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }

        // Create a spinner element
        const spinnerOverlay = document.createElement("div");
        spinnerOverlay.className = "position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75";
        spinnerOverlay.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        body.appendChild(spinnerOverlay);

        // Simulate processing delay
        setTimeout(() => {
            // Remove the spinner
            body.removeChild(spinnerOverlay);

            // Hide the connect button and show the wallet display
            conBot.classList.add("d-none");
            walletShow.classList.remove("d-none");
        }, 2000); // Adjust delay as needed
    });
});