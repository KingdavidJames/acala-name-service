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
