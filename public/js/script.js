// Select elements from the DOM
const connectButton = document.querySelector('.con-bot');
const walletDisplay = document.querySelector('.walletshow');

// AirDAO Testnet chain ID
const AIRDAO_TESTNET_CHAIN_ID = '22040'; // AirDAO Testnet

/**
 * Connect to MetaMask and switch to AirDAO Testnet.
 */
async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert('MetaMask is not installed. Please install MetaMask and try again.');
    return;
  }

  const chainId = '22040'; // AirDAO Testnet

  try {
    // Request accounts
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    const walletAddress = accounts[0];

    // Try adding the chain to MetaMask
    try {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: chainId,
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
    } catch (addChainError) {
      console.error('Error adding the chain:', addChainError);
      alert('Failed to add AirDAO Testnet to MetaMask. Please try again.');
      return;
    }

    // Switch to AirDAO Testnet
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainId }],
    });

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
  if (walletAddress) {
    connectButton.classList.add('d-none');
    walletDisplay.classList.remove('d-none');
    walletDisplay.querySelector('div').textContent = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    connectButton.textContent = 'Disconnect';
    connectButton.onclick = disconnectWallet;
  } else {
    connectButton.classList.remove('d-none');
    walletDisplay.classList.add('d-none');
    connectButton.textContent = 'Connect Wallet';
    connectButton.onclick = connectWallet;
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