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

  // 2) On "Decrypt"
  decryptButton.addEventListener("click", async () => {
    const nameToCheck = (decryptInput.value || "").trim().toLowerCase();
    if (!nameToCheck.endsWith(".amb") || nameToCheck === ".amb") {
      decryptResult.innerHTML = `<p class="text-danger">Invalid .amb name (e.g. alice.amb)</p>`;
      return;
    }

    try {
      decryptResult.textContent = "Checking name from server...";
      const response = await getDecrypt(nameToCheck);
      console.log(response);
      if (response.payeeName) {
        // found => show wallet, txn details
        const dateString = new Date(response.transactionTime).toLocaleString();
        decryptResult.innerHTML = `
          <h5>ANS Name: ${response.payeeName}</h5>
          <p><strong>Wallet Address:</strong> ${response.payerAddress}</p>
          <p><strong>Tx Hash:</strong>
            <a href="https://testnet.airdao.io/explorer/tx/${response.transactionHash}" target="_blank">
              ${response.transactionHash}
            </a>
          </p>
          <p><strong>Date of Registration:</strong> ${dateString}</p>
          ${response.yearsPaid
            ? `<p><strong>Years Paid:</strong> ${response.yearsPaid}</p>`
            : ""
          }
        `;
      } else {
        console.log(response);
        decryptResult.innerHTML = `
          <p class="text-danger"> ${response.message} in the ANS</p>
        `;
      }
    } catch (err) {
      console.error(err);
      decryptResult.textContent = "Server error or network issue.";
    }
  });
});
