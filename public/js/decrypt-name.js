/*******************************************************
 * decrypt-name.js
 * - No localStorage
 * - Real call to /api/decrypt-name?name=...
 * - Show wallet address + txn details from Mongo
 *******************************************************/
document.addEventListener("DOMContentLoaded", async () => {
  const decryptInput = document.getElementById("decryptInput");
  const decryptButton = document.getElementById("decryptButton");
  const decryptResult = document.getElementById("decryptResult");
  const decryptCurrentAddress = document.getElementById("decryptCurrentAddress");

  let userAddress = null;

  // 1) Check if user is connected
  if (typeof window.ethereum !== "undefined") {
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts && accounts.length > 0) {
        userAddress = accounts[0];
        decryptCurrentAddress.textContent = userAddress;
      } else {
        decryptCurrentAddress.textContent = "Not Connected";
      }
    } catch (err) {
      console.error(err);
      decryptCurrentAddress.textContent = "Error checking wallet";
    }
  } else {
    decryptCurrentAddress.textContent = "No MetaMask found";
  }

  // 2) On "Decrypt"
  decryptButton.addEventListener("click", async () => {
    const nameToCheck = (decryptInput.value || "").trim().toLowerCase();
    if (!nameToCheck.endsWith(".amb") || nameToCheck === ".amb") {
      decryptResult.innerHTML = `<p class="text-danger">Invalid .amb name (e.g. alice.amb)</p>`;
      return;
    }

    try {
      decryptResult.textContent = "Checking name from server...";
      const resp = await fetch(`http://localhost:3000/api/decrypt-name?name=${encodeURIComponent(nameToCheck)}`);
      const data = await resp.json();
      if (!data.exists) {
        decryptResult.innerHTML = `
          <p class="text-danger">
            The name <strong>${nameToCheck}</strong> was not found in the registry.
          </p>
        `;
      } else {
        // found => show wallet, txn details
        const dateString = new Date(data.createdAt).toLocaleString();
        decryptResult.innerHTML = `
          <h5>ANS Name: ${data.name}</h5>
          <p><strong>Wallet Address:</strong> ${data.walletAddress}</p>
          <p><strong>Tx Hash:</strong>
            <a href="https://explorer.ambrosus-test.io/tx/${data.txnHash}" target="_blank">
              ${data.txnHash}
            </a>
          </p>
          <p><strong>Date of Registration:</strong> ${dateString}</p>
          ${
            data.yearCount
              ? `<p><strong>Years Paid:</strong> ${data.yearCount}</p>`
              : ""
          }
        `;
      }
    } catch (err) {
      console.error(err);
      decryptResult.textContent = "Server error or network issue.";
    }
  });
});
