// find-identity.js

/*************************************
 * Utility Functions
 *************************************/

/**
 * Validate Ethereum Address
 * @param {string} address - Ethereum address to validate
 * @returns {boolean} - True if valid, else false
 */
function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/*************************************
 * DOM Elements
 *************************************/

const searchInput = document.getElementById("dynamic_searchbar");
const availableDiv = document.getElementById("availableName");
const unavailableDiv = document.getElementById("unAvailableName");
const getNameLink = document.getElementById("getName");

// For spinner
let spinner = null;

// For registration:
const registerNameDiv = document.getElementById("registerName");
const findNameDiv = document.getElementById("findName");
const nameChosenEl = document.getElementById("nameChosen");

/*************************************
 * Hide the available/unavailable name
 * divs initially
 *************************************/
availableDiv.style.display = "none";
unavailableDiv.style.display = "none";

/*************************************
 * Add a spinner next to the input
 *************************************/
// Create spinner element (Bootstrap 5)
spinner = document.createElement("div");
spinner.className = "spinner-border spinner-border-sm text-primary ms-2 simp";
spinner.setAttribute("role", "status");
spinner.style.display = "none";
// Insert spinner after the input
searchInput.parentNode.appendChild(spinner);

/*************************************
 * Searching for a name
 *************************************/
searchInput.addEventListener("keydown", async function (e) {
    // If user presses Enter:
    if (e.key === "Enter") {
        e.preventDefault(); // Prevent form submission or page refresh

        // Show spinner
        spinner.style.display = "inline-block";

        const nameToCheck = this.value.trim();
        if (!nameToCheck) {
            // If empty, just hide everything
            availableDiv.style.display = "none";
            unavailableDiv.style.display = "none";
            spinner.style.display = "none";
            return;
        }

        // Format the name
        const formattedName = nameToCheck.toLowerCase().endsWith(".amb")
            ? nameToCheck.toLowerCase()
            : nameToCheck.toLowerCase() + ".amb";

        try {
            // Make API call to check if name is taken
            const response = await axios.get(`http://localhost:5000/api/check-name?name=${formattedName}`);
            const data = response.data;

            spinner.style.display = "none";

            if (data.taken) {
                // Unavailable
                availableDiv.style.display = "none";
                unavailableDiv.style.display = "flex";

                // Update the text with the name
                unavailableDiv.querySelector("p").innerHTML =
                    `${formattedName} is <span class="text-red fw-medium">Taken</span>`;
            } else {
                // Available
                unavailableDiv.style.display = "none";
                availableDiv.style.display = "flex";

                // Update the text with the name
                availableDiv.querySelector("p").innerHTML =
                    `${formattedName} is <span class="text-green fw-medium">Available</span>`;
            }
        } catch (error) {
            console.error('Error checking name:', error);
            spinner.style.display = "none";
            alert('An error occurred while checking the name. Please try again.');
        }
    }
});

/*************************************
 * Handle "Get Name" click
 *************************************/
getNameLink.addEventListener("click", async function (e) {
    e.preventDefault();

    // Ensure the name is available
    if (availableDiv.style.display !== "flex") {
        alert("The selected name is not available.");
        return;
    }

    // Grab the current displayed name from the availableDiv
    let text = availableDiv.querySelector("p").innerHTML;
    // Example text: "something.amb is Available"
    // We just want the name up to the " is "
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = text;
    let chosenName = tempDiv.textContent.split(" is ")[0];

    // Put that name in the #nameChosen element
    nameChosenEl.textContent = chosenName;

    // Show the registerName screen, hide the findName screen
    findNameDiv.style.display = "none";
    registerNameDiv.style.display = "block";

    // Reset years to 1
    setYearCount(1);
});

/*************************************
 * Year increment / decrement logic
 *************************************/
const minusBtn = document.getElementById("minusBtn");
const plusBtn = document.getElementById("plusBtn");
const yearDisplay = document.getElementById("yearDisplay");
const yearDetails = document.querySelector(".year-details span");

// Price references in the total-calc
const pYearEls = document.querySelectorAll(".p-year");
// The <span> in the modal where we show the total
const modalTotalAMBEl = document.getElementById("modalTotalAMB");

let yearCount = 1;
let basePrice = 8;      // 8 AMB per year
let networkFee = 2;     // 2 AMB per year

function setYearCount(value) {
    yearCount = value;
    yearDisplay.textContent = `${yearCount} Year${yearCount > 1 ? "s" : ""}`;

    // Also update the "x year registration" below the +/- control
    yearDetails.textContent = `${yearCount}`;

    // Calculate prices
    const totalNamePrice = basePrice * yearCount;
    const totalNetworkFee = networkFee * yearCount;
    const total = totalNamePrice + totalNetworkFee;

    // Update the text in the .total-calc
    // Assuming pYearEls are ordered correctly
    // Update the registration and fees
    pYearEls[0].textContent = `${yearCount} year registration`;
    pYearEls[1].textContent = `${totalNamePrice} AMB`;
    pYearEls[2].textContent = `Est. network fee`;
    pYearEls[3].textContent = `${totalNetworkFee} AMB`;
    pYearEls[4].textContent = `Total`;
    pYearEls[5].textContent = `${total} AMB`;

    // Update the modal’s total <span>
    if (modalTotalAMBEl) {
        modalTotalAMBEl.textContent = total;
    }

    // For minus button enable/disable
    if (yearCount <= 1) {
        minusBtn.classList.add("disabled");
        minusBtn.disabled = true;
    } else {
        minusBtn.classList.remove("disabled");
        minusBtn.disabled = false;
    }
}

// On load, set to 1 year
setYearCount(1);

minusBtn.addEventListener("click", function () {
    if (yearCount > 1) {
        setYearCount(yearCount - 1);
    }
});

plusBtn.addEventListener("click", function () {
    setYearCount(yearCount + 1);
});

/*************************************
 * MetaMask Payment Functionality
 *************************************/

// Select the MetaMask payment option
const metamaskPaymentButton = document.getElementById('metamask');

// Recipient wallet address
const RECIPIENT_ADDRESS = '0x1787b2190C575bAFb61d8582589E0eB4DFBA2C84'; // Recipient's wallet address

// Define the network chain ID for AirDAO Testnet
const AIRDAO_TESTNET_CHAIN_ID = 22040; // Decimal

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
        const yearsPaid = yearCount; // Assuming `yearCount` is defined globally

        // Prepare data to send to the backend
        const transactionData = {
            transactionHash,
            transactionTime: date.toLocaleString(),
            payerAddress,
            yearsPaid,
            payeeName: nameChosenEl.textContent.toLowerCase(),
            payeeAddress: RECIPIENT_ADDRESS,
        };

        // Send transaction data to the backend
        await axios.post('http://localhost:5000/api/transactions', transactionData)
            .then(response => {
                console.log(response.data.message);
            })
            .catch(error => {
                console.error('Error saving transaction:', error);
                alert('Failed to save transaction details.');
            });

        // Register the name with the backend
        await axios.post('http://localhost:5000/api/register-name', {
            name: nameChosenEl.textContent.toLowerCase(),
            walletAddress: connectedWallet.toLowerCase(),
        })
        .then(response => {
            console.log(response.data.message);
        })
        .catch(error => {
            console.error('Error registering name:', error);
            alert('Failed to register the name.');
        });

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
        alert('MetaMask is not installed. Please install MetaMask and try again.');
        return;
    }

    try {
        // Request account access if needed
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const walletAddress = accounts[0];

        // Initialize Ethers.js
        await initializeEthers();

        // Check if the user is on the correct network (AirDAO Testnet)
        const network = await provider.getNetwork();
        if (network.chainId !== AIRDAO_TESTNET_CHAIN_ID) {
            // Prompt user to switch to AirDAO Testnet
            try {
                await ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: ethers.utils.hexlify(AIRDAO_TESTNET_CHAIN_ID) }],
                });
            } catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask
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

/*************************************
 * Owl Carousel Initialization
 *************************************/
$(".signup-carousel").owlCarousel({
    loop: true,
    margin: 10,
    nav: true,
    dots: true,
    autoplay: true,
    autoplayTimeout: 3000,
    responsive: {
        0: {
            items: 1,
        },
    },
});

/*************************************
 * TOGGLE DISPLAY
 *************************************/

const getName = document.getElementById("getName");
const findName = document.getElementById("findName");
const registerName = document.getElementById("registerName");
const back = document.querySelector(".back");

// Toggle to show registerName and hide findName
getName.addEventListener("click", (event) => {
    event.preventDefault(); // Prevent default anchor behavior
    findName.style.display = "none";
    registerName.style.display = "block";
});

// Toggle back to show findName and hide registerName
back.addEventListener("click", () => {
    registerName.style.display = "none";
    findName.style.display = "block";
});

/*************************************
 * Countdown Timer
 *************************************/
const paymentModal = document.getElementById("staticBackdrop");
const timerElement = document.querySelector(".timer");

let countdownInterval;

// Function to start the countdown
function startCountdown(duration) {
    let time = duration;
    updateTimerDisplay(time);

    countdownInterval = setInterval(() => {
        time--;
        updateTimerDisplay(time);

        if (time <= 0) {
            clearInterval(countdownInterval);
            // Optionally, you can auto-close the modal or notify the user
            const modalInstance = bootstrap.Modal.getInstance(paymentModal);
            if (modalInstance) {
                modalInstance.hide();
            }
            alert('Payment time has expired.');
        }
    }, 1000);
}

// Function to format and display the timer
function updateTimerDisplay(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    timerElement.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Event listener for modal show
if (paymentModal) {
    paymentModal.addEventListener("show.bs.modal", () => {
        clearInterval(countdownInterval); // Clear any existing timer
        startCountdown(10 * 60); // Start a 10-minute countdown
    });

    // Event listener for modal hide
    paymentModal.addEventListener("hide.bs.modal", () => {
        clearInterval(countdownInterval); // Stop the timer when modal is hidden
    });
}

/*************************************
 * Copy to Clipboard Tooltip
 *************************************/

const copyIcon = document.querySelector(".copy-icon");
const tooltipText = document.querySelector(".tooltip-text");

// Show "Copy to Clipboard" on hover
copyIcon.addEventListener("mouseover", function () {
    tooltipText.textContent = "Copy to Clipboard";
    tooltipText.classList.remove("copied");
});

// Copy text to clipboard on click
copyIcon.addEventListener("click", function () {
    const walletAddress = "0x1787b2190C575bAFb61d8582589E0eB4DFBA2C84"; // Replace with dynamic content if needed
    navigator.clipboard.writeText(walletAddress).then(() => {
        // Change tooltip to "Copied!" on click
        tooltipText.textContent = "Copied!";
        tooltipText.classList.add("copied");

        // Revert to "Copy to Clipboard" after 2 seconds
        setTimeout(() => {
            tooltipText.textContent = "Copy to Clipboard";
            tooltipText.classList.remove("copied");
        }, 2000);
    }).catch(err => {
        console.error("Failed to copy text: ", err);
    });
});

/*************************************
 * Ethers.js Helper Functions (Optional Enhancements)
 *************************************/

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
