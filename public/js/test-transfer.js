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
 * MetaMask Connection for Test Transfer Page
 *************************************/
// Wallet connection state
let connectedWalletAddress = localStorage.getItem("connectedWalletAddress") || null;

// HTML Elements
const connectWalletButton = document.getElementById("connectWalletButton");
const transferCurrentAddress = document.getElementById("transferCurrentAddress");

/**
 * Update the UI based on the wallet connection state.
 */
function updateUI(walletAddress) {
    const walletAddresses = document.querySelectorAll('.wallet-address');
    const transferCurrentAddress = document.getElementById("transferCurrentAddress");
    if (walletAddress) {
        connectWalletButton.textContent = "Disconnect Wallet";
        connectWalletButton.onclick = disconnectWallet;
       // Update all wallet address elements
       walletAddresses.forEach(addr => {
        addr.textContent = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    });
    } else {
        connectWalletButton.textContent = "Connect Wallet";
        connectWalletButton.onclick = connectWallet;
        // Hide all wallet displays
        walletDisplays.forEach(display => display.classList.add('d-none'));

        // Clear all wallet address elements
        walletAddresses.forEach(addr => {
            addr.textContent = '';
        });
    }
}

/**
 * Connect to MetaMask and initialize the wallet connection.
 */
async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
        alert("MetaMask is not installed. Please install MetaMask and try again.");
        return;
    }

    try {
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        connectedWalletAddress = accounts[0];
        localStorage.setItem("connectedWalletAddress", connectedWalletAddress);
        updateUI(connectedWalletAddress);
    } catch (error) {
        console.error("Error connecting wallet:", error);
        alert("Failed to connect wallet. Please try again.");
    }
}

/**
 * Disconnect the wallet by clearing the state.
 */
function disconnectWallet() {
    connectedWalletAddress = null;
    localStorage.removeItem("connectedWalletAddress");
    updateUI(null);
}

/**
 * Initialize the connection state on page load.
 */
document.addEventListener("DOMContentLoaded", function () {
    updateUI(connectedWalletAddress);
});

// Listen for wallet or network changes
if (typeof window.ethereum !== "undefined") {
    ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
            disconnectWallet();
        } else {
            connectedWalletAddress = accounts[0];
            localStorage.setItem("connectedWalletAddress", connectedWalletAddress);
            updateUI(connectedWalletAddress);
        }
    });

    ethereum.on("chainChanged", () => {
        window.location.reload();
    });
}

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

/******************************************************
 * ./js/test-transfer.js
 ******************************************************/

document.addEventListener("DOMContentLoaded", function () {
  // HTML Elements
  const transferForm = document.getElementById("transferForm");
  const recipientInput = document.getElementById("recipient");
  const amountInput = document.getElementById("amount");
  const transferResultDiv = document.getElementById("transferResult");
  const transferFromEl = document.getElementById("transferFrom");
  const transferToEl = document.getElementById("transferTo");
  const transferAmountEl = document.getElementById("transferAmount");
  const transferTxHashEl = document.getElementById("transferTxHash");
  const transferDateEl = document.getElementById("transferDate");

  // Spinner (Optional)
  let transferSpinner = document.createElement("div");
  transferSpinner.className = "spinner-border spinner-border-sm text-primary ms-2 simp";
  transferSpinner.style.display = "none";
  transferForm.appendChild(transferSpinner);

  // Handle Transfer Form Submission
  transferForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      transferSpinner.style.display = "inline-block";

      const recipient = recipientInput.value.trim().toLowerCase();
      const amount = parseFloat(amountInput.value.trim());

      // Validate Inputs
      if (!recipient.endsWith(".amb") && !/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
          transferSpinner.style.display = "none";
          alert("Invalid recipient format. Must be a .amb name or a valid Ethereum address.");
          return;
      }

      if (isNaN(amount) || amount <= 0) {
          transferSpinner.style.display = "none";
          alert("Invalid amount. Must be a positive number.");
          return;
      }

      // Check if wallet is connected
      const connectedWalletAddress = window.connectedWalletAddress || localStorage.getItem("connectedWalletAddress");
      if (!connectedWalletAddress) {
          transferSpinner.style.display = "none";
          alert("Please connect your wallet first.");
          return;
      }

      // Determine recipient address
      let recipientAddress = recipient;
      if (recipient.endsWith(".amb")) {
          // Fetch the mapped wallet address from the backend
          try {
              const decryptResponse = await fetch(`/api/decrypt-name?name=${encodeURIComponent(recipient)}`, {
                  method: "GET",
                  headers: { "Content-Type": "application/json" },
              });

              const decryptData = await decryptResponse.json();

              if (decryptResponse.ok && decryptData.exists) {
                  recipientAddress = decryptData.walletAddress;
              } else {
                  transferSpinner.style.display = "none";
                  alert("The .amb name is not registered.");
                  return;
              }
          } catch (error) {
              transferSpinner.style.display = "none";
              console.error(error);
              alert("Error fetching recipient address. Please try again.");
              return;
          }
      }

      try {
          // Calculate AMB to send
          const amountWei = web3.utils.toWei(amount.toString(), "ether");

          // Initiate Transaction
          const txHash = await window.ethereum.request({
              method: "eth_sendTransaction",
              params: [{
                  from: connectedWalletAddress,
                  to: recipientAddress,
                  value: "0x" + BigInt(amountWei).toString(16),
              }]
          });

          // Display Transfer Details
          transferFromEl.textContent = connectedWalletAddress;
          transferToEl.textContent = recipientAddress;
          transferAmountEl.textContent = `${amount} AMB`;
          transferTxHashEl.textContent = shortenAddress(txHash);
          transferTxHashEl.href = `https://explorer.ambrosus-test.io/tx/${txHash}`;
          transferDateEl.textContent = new Date().toLocaleString();

          transferResultDiv.classList.remove("d-none");

          // Optionally, you can log the transfer to the backend
          const logResponse = await fetch(`/api/log-transfer`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  sender: connectedWalletAddress,
                  recipient: recipientAddress,
                  amountAMB: amount,
                  txnHash: txHash
              })
          });

          const logData = await logResponse.json();

          if (!logResponse.ok) {
              console.error(logData.error);
              // Optionally, notify the user
          }

          transferSpinner.style.display = "none";
          alert("Transfer successful!");

          // Reset the form
          transferForm.reset();
      } catch (error) {
          transferSpinner.style.display = "none";
          console.error(error);
          alert("Transaction failed or was rejected.");
      }
  });

  // Function to shorten transaction hash for display
  function shortenAddress(addr) {
      if (!addr) return "0x... (Invalid)";
      return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

});
