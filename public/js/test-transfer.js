import { getDecrypt } from "./api.js";

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

// Select all dropdown items
const dropdownItems = document.querySelectorAll('.dropdown-item');

// Listen for clicks on each item
  dropdownItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault(); // Prevent default link behavior

      // Retrieve the data attributes from the clicked item
      const imgSrc = this.getAttribute('data-img');
      const title = this.getAttribute('data-title');
      const details = this.getAttribute('data-details');

      // Update the content of the dropdown toggle button
      const dropdownToggle = document.getElementById('dropdownMenuButton');
      dropdownToggle.innerHTML = `
        <img src="${imgSrc}" class="w-50px" alt="">
        <div class="ms-3 me-5">
          <h1 class="modal-title fs-5 coin-header">${title}</h1>
          <p class="coin-details mb-0">${details}</p>
        </div>
      `;
    });
  });


/*************************************
 * Global Variables
 *************************************/
let connectedWalletAddress = localStorage.getItem("connectedWallet") || null;
let finalRecipientAddress = "";     // Actual 0x address to transfer to (after .aca check)
let originalRecipientInput = "";    // Used to track .aca name if user typed that
let transferAmount = 0;            // aca amount
let provider, signer;

/*************************************
 * HTML Elements
 *************************************/
const transferButton = document.getElementById("transferButton");
const recipientInput = document.getElementById("recipientInput");
const amountInput = document.getElementById("amountInput");
const transferStatus = document.getElementById("transferStatus");

// Payment Method Modal and its triggers
const paymentMethodModalEl = document.getElementById("staticBackdrop2");
let paymentMethodModal = null;

const MANDALA_TC9_CHAIN_ID = 595; // Mandala TC9 Chain ID

// Manual Transfer Modal
const manualTransferModalEl = document.getElementById("staticBackdrop");
let manualTransferModal = null;

// Payment Method Options
const manualTransferButton = document.getElementById("manualTransfer");
const metamaskButton = document.getElementById("metamask");

// Connect/Disconnect Buttons (similar to find-identity flow)
const connectButton = document.querySelector(".con-bot");
const walletShows = document.querySelectorAll(".walletshow");
const walletAddresses = document.querySelectorAll(".wallet-address");

/*************************************
 * Connect/Disconnect UI Logic
 *************************************/
function updateUI(walletAddress) {
    if (walletAddress) {
        connectButton.textContent = "Disconnect";
        connectButton.onclick = disconnectWallet;

        // Show the wallet display
        walletShows.forEach(show => show.classList.remove("d-none"));

        // Update the wallet addresses
        walletAddresses.forEach(addr => {
            addr.textContent = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
        });
    } else {
        connectButton.textContent = "Connect Wallet";
        connectButton.onclick = connectWallet;

        // Hide the wallet displays
        walletShows.forEach(show => show.classList.add("d-none"));

        // Clear wallet address text
        walletAddresses.forEach(addr => {
            addr.textContent = "";
        });
    }
}

/**
 * Connect to MetaMask and initialize Ethers
 */
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
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
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const walletAddress = accounts[0];
        await initializeEthers();

        const network = await provider.getNetwork();
        if (network.chainId !== MANDALA_TC9_CHAIN_ID) {
            try {
                await ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: ethers.utils.hexValue(MANDALA_TC9_CHAIN_ID) }],
                });
            } catch (switchError) {
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

        localStorage.setItem('connectedWallet', walletAddress);
        updateUI(walletAddress);

    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
    }
}
/**
 * Disconnect Wallet
 */
function disconnectWallet() {
    connectedWalletAddress = null;
    localStorage.removeItem("connectedWallet");
    updateUI(null);
}

/**
 * Initialize Ethers
 */
async function initializeEthers() {
    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
    } else {
        alert('MetaMask is not installed. Please install MetaMask and try again.');
    }
}

/*************************************
 * Transfer Flow
 *************************************/
transferButton.addEventListener("click", async () => {
    transferStatus.textContent = ""; // Clear status

    // 1) Get recipient and amount
    originalRecipientInput = recipientInput.value.trim().toLowerCase();
    const amountString = amountInput.value.trim();
    transferAmount = parseFloat(amountString);

    // 2) Validate amount
    if (isNaN(transferAmount) || transferAmount <= 0) {
        alert("Invalid amount. Must be a positive number.");
        return;
    }

    // 3) Determine if input is .aca or 0x address
    if (originalRecipientInput.endsWith(".aca")) {
        // .aca name => check DB
        try {
            const result = await getDecrypt(originalRecipientInput);
            // If success, result should contain the walletAddress from DB
            if (result.payeeName && result.payerAddress) {
                finalRecipientAddress = result.payerAddress;
            } else {
                // If for some reason the user object doesn't have a walletAddress
                alert(`The name "${originalRecipientInput}" does not exist in the ANS registry.`);
                return;
            }
        } catch (error) {
            // 404 or any server error
            alert(`The name "${originalRecipientInput}" does not exist in the ANS registry.`);
            console.error(error);
            return;
        }
    } else {
        // Must be a 0x address
        if (!/^0x[a-fA-F0-9]{40}$/.test(originalRecipientInput)) {
            alert("Invalid recipient format. Must be a .aca name or a valid Ethereum address.");
            return;
        }
        finalRecipientAddress = originalRecipientInput;
    }

    // 4) If valid, load Payment Method Modal
    paymentMethodModal = new bootstrap.Modal(paymentMethodModalEl, { keyboard: false });
    paymentMethodModal.show();
});

/*************************************
 * Payment Method Options
 *************************************/

//  -- Manual Transfer
manualTransferButton.addEventListener("click", () => {
    // Hide Payment Method Modal
    paymentMethodModal?.hide();

    // Show the manual transfer modal
    manualTransferModal = new bootstrap.Modal(manualTransferModalEl, { keyboard: false });
    manualTransferModal.show();

    // Update the manual transfer modal details
    document.getElementById("amountSend").textContent = transferAmount.toString();
    // If you want to change the "Wallet Address" in the modal, do so as well
    // E.g., if there's an element for the payee wallet or name, update it here.
});

//  -- MetaMask Transfer
metamaskButton.addEventListener("click", async () => {
    paymentMethodModal?.hide(); // Hide Payment Method Modal

    // Check if wallet is connected
    if (!connectedWalletAddress) {
        alert("Please connect your wallet first.");
        return;
    }

    // Initialize Ethers
    await initializeEthers();
    if (!provider || !signer) {
        alert("Unable to initialize Ethers.js. Please ensure MetaMask is connected.");
        return;
    }

    try {
        // 1) Convert aca to Wei
        const amountInWei = ethers.utils.parseUnits(transferAmount.toString(), 18);
        const amountInEther = ethers.utils.formatEther(amountInWei);
        console.log("Amount in Wei:", amountInWei.toString());
        console.log("Amount in Ether:", amountInEther);
        // 2) Send transaction
        const tx = await signer.sendTransaction({
            to: finalRecipientAddress,
            value: amountInWei,
        });
        const userConfirmed = confirm(`Do you want to send ${amountInEther} aca to the recipient?`);
        if (!userConfirmed) {
            return;
        }

        console.log("Transaction sent:", tx.hash);
        transferStatus.textContent = "Waiting for transaction confirmation...";

        // 3) Wait for confirmation
        const receipt = await provider.waitForTransaction(tx.hash);
        console.log("Transaction confirmed:", receipt.transactionHash);

        // 4) Display success info
        const date = new Date().toLocaleString();
        const usedRecipient = originalRecipientInput.endsWith(".aca")
            ? originalRecipientInput // show .aca if user typed that
            : finalRecipientAddress; // otherwise show the 0x address

        transferStatus.innerHTML = `
      <div class="text-success mt-3">
        <p><strong>Transaction Successful!</strong></p>
        <p>Transaction Hash: <span>${receipt.transactionHash}</span></p>
        <p>Amount: <span>${transferAmount} aca</span></p>
        <p>Recipient: <span>${usedRecipient}</span></p>
        <p>Time: <span>${date}</span></p>
      </div>
    `;
    } catch (error) {
        console.error("Error during MetaMask transfer:", error);
        alert("Transaction failed or was rejected. Check console for details.");
    }
});

/*************************************
 * On Page Load
 *************************************/
document.addEventListener("DOMContentLoaded", () => {
    // Initialize the connection UI
    updateUI(connectedWalletAddress);
});

// Listen for wallet or network changes
if (typeof window.ethereum !== "undefined") {
    ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
            disconnectWallet();
        } else {
            connectedWalletAddress = accounts[0];
            localStorage.setItem("connectedWallet", connectedWalletAddress);
            updateUI(connectedWalletAddress);
        }
    });

    ethereum.on("chainChanged", () => {
        window.location.reload();
    });
}
