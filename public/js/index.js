
/*************************************
 * MetaMask Payment Functionality
 *************************************/
// Select the MetaMask payment option
const metamaskPaymentButton = document.getElementById('metamask');

const modalTotalacaEl = document.getElementById('modalTotalaca');

const yearDisplay = document.getElementById("yearDisplay");
const nameChosenEl = document.getElementById("nameChosen");
const yearDetails = document.querySelector(".year-details span");

// aca Token Contract Details
// Recipient wallet address (Payee)
const RECIPIENT_ADDRESS = '0x1787b2190C575bAFb61d8582589E0eB4DFBA2C84'; // Replace with actual address

// Define the network chain ID for AirDAO Testnet
const MANDALA_TC9_CHAIN_ID = 595; // New chain ID for Mandala Testnet TC9

const aca_DECIMALS = 18; // Typically, ERC-20 tokens have 18 decimals

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
 * Initiate aca Token Transfer with Monitoring
 * @param {string} amount - Amount in aca to transfer (e.g., "10")
 */
async function transferaca(amount) {
    try {
        // Validate Addresses
        if (!isValidEthereumAddress(aca_CONTRACT_ADDRESS)) {
            alert('aca Contract Address is invalid. Please check and try again.');
            return;
        }

        if (!isValidEthereumAddress(RECIPIENT_ADDRESS)) {
            alert('Recipient Address is invalid. Please check and try again.');
            return;
        }

        // Convert aca amount to Wei based on decimals
        const amountInWei = ethers.utils.parseUnits(amount, aca_DECIMALS);

        // Get initial balance of recipient
        const initialBalance = await acaContract.balanceOf(RECIPIENT_ADDRESS);
        console.log(`Initial Balance of Recipient: ${ethers.utils.formatUnits(initialBalance, aca_DECIMALS)} aca`);

        // Initiate transfer
        const tx = await acaContract.transfer(RECIPIENT_ADDRESS, amountInWei);
        console.log('Transaction sent:', tx.hash);

        // Wait for the transaction to be mined
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt.transactionHash);

        // Get final balance of recipient
        const finalBalance = await acaContract.balanceOf(RECIPIENT_ADDRESS);
        console.log(`Final Balance of Recipient: ${ethers.utils.formatUnits(finalBalance, aca_DECIMALS)} aca`);

        // Calculate received amount
        const receivedAmount = ethers.utils.formatUnits(finalBalance.sub(initialBalance), aca_DECIMALS);
        console.log(`Recipient received: ${receivedAmount} aca`);

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
        const totalaca = parseInt(modalTotalacaEl.textContent); // Assuming this element contains the total aca

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
        console.error('Error during aca transfer:', error);
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
            alert("Redirecting to MetaMask...");
            window.location.href = "https://metamask.app.link/dapp/https://air-daonameservice.vercel.app/";
        } else {
            alert("Please install MetaMask to continue.");
        }
        return;
    }

    try {
        // Request account access
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const walletAddress = accounts[0];

        // Initialize Ethers.js
        await initializeEthers();

        // Check if user is on Mandala TC9
        const network = await provider.getNetwork();
        if (network.chainId !== MANDALA_TC9_CHAIN_ID) {
            // Prompt user to switch
            try {
                await ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: ethers.utils.hexValue(MANDALA_TC9_CHAIN_ID) }],
                });
            } catch (switchError) {
                // If the network is not added to MetaMask (error code 4902)
                if (switchError.code === 4902) {
                    try {
                        await ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [
                                {
                                    chainId: ethers.utils.hexValue(MANDALA_TC9_CHAIN_ID),
                                    chainName: 'Mandala TC9',
                                    rpcUrls: ['https://eth-rpc-tc9.aca-staging.network'],
                                    nativeCurrency: {
                                        name: 'mACA',
                                        symbol: 'mACA',
                                        decimals: 18,
                                    },
                                    blockExplorerUrls: ['https://blockscout.mandala.aca-staging.network'],
                                },
                            ],
                        });
                    } catch (addError) {
                        console.error('Error adding the chain:', addError);
                        alert('Failed to add Mandala TC9 to MetaMask. Please try again.');
                        return;
                    }
                } else {
                    console.error('Error switching network:', switchError);
                    alert('Failed to switch to Mandala TC9. Please try again.');
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
let tokenUsed // Token symbol (or adjust based on token paid in)
/**
 * Handle MetaMask Payment Click
 */
async function handleMetaMaskPayment() {
    // Check if wallet is connected
    const connectedWallet = localStorage.getItem('connectedWallet');
    tokenUsed = "mACA"; // Token symbol (or adjust based on token paid in)

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
        // Verify the user is on Mandala TC9
        const network = await provider.getNetwork();
        if (network.chainId !== MANDALA_TC9_CHAIN_ID) {
            alert('Please switch to the Mandala TC9 network in MetaMask.');
            return;
        }


        // Define the amount to transfer based on yearCount and pricing
        const totalaca = parseInt(modalTotalacaEl.textContent); // e.g., 10 aca

        // Convert aca to Wei (assuming aca has 18 decimals)
        const amountInWei = ethers.utils.parseUnits(totalaca.toString(), 18);

        localStorage.setItem('amount', totalaca);
        // Confirm with the user before initiating the transfer
        const userConfirmed = confirm(`Do you want to send ${totalaca} aca to the recipient?`);
        if (!userConfirmed) {
            return;
        }

        // Get the payer's wallet address
        const payerAddress = await signer.getAddress();

        // Check the account balance (in Wei)
        const balance = await provider.getBalance(payerAddress);
        console.log("Wallet Balance:", ethers.utils.formatEther(balance), "mACA");

        // Estimate gas (optional)
        const estimatedGas = await provider.estimateGas({
            to: RECIPIENT_ADDRESS,
            value: ethers.utils.parseUnits(modalTotalacaEl.textContent.toString(), 18)
        });
        console.log("Estimated Gas:", estimatedGas.toString());

        

        // Prepare the JSON object with your purchase details
        const purchaseDetails = {
            namePaidFor: nameChosenEl.textContent.toLowerCase(),
            payerAddress: payerAddress,
            amountPaid: `${totalaca} ${tokenUsed}`,              // The amount paid (e.g., in aca)
            yearsPaid: yearDetails.textContent  // Number of years paid for
        };

        // Convert the JSON object to a string, then to a hex string
        const jsonString = JSON.stringify(purchaseDetails);
        const dataHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(jsonString));


        // Initiate the transfer
        const tx = await signer.sendTransaction({
            to: RECIPIENT_ADDRESS,
            value: amountInWei,
            data: dataHex
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
        console.error('Error during aca transfer:', error);
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