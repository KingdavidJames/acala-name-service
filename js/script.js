
document.addEventListener("DOMContentLoaded", () => {
  const conBot = document.querySelector(".con-bot");       // "Connect Wallet" link
  const walletShow = document.querySelector(".walletshow"); 
  const modalButtons = document.querySelectorAll(".md-but"); 
  const body = document.body;

  // === 1) Check if wallet is in localStorage and valid (within 1 hour) ===
  const savedWalletConnected = localStorage.getItem("walletConnected");     // "true" or null
  const savedWalletAddress   = localStorage.getItem("walletAddress");       // e.g. "Ox374.....djgff"
  const savedConnectTime     = localStorage.getItem("walletConnectTime");   // e.g. "1693408350000"

  if (savedWalletConnected && savedWalletAddress && savedConnectTime) {
    const now = Date.now();
    const oneHourInMs = 60 * 60 * 1000; // 3600000 ms

    if ((now - parseInt(savedConnectTime, 10)) <= oneHourInMs) {
      // If less than 1 hour since last connect, show the wallet as connected
      conBot.classList.add("d-none");
      walletShow.classList.remove("d-none");
      // Optionally fill in the address if you have an element for it
      walletShow.querySelector("div.mb-0.fw-light.ms-1").textContent = savedWalletAddress;
    } else {
      // More than 1 hour old, clear local storage
      localStorage.removeItem("walletConnected");
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("walletConnectTime");
      // Show the connect button (default)
      conBot.classList.remove("d-none");
      walletShow.classList.add("d-none");
    }
  } else {
    // Default: not connected
    conBot.classList.remove("d-none");
    walletShow.classList.add("d-none");
  }

  // === 2) Handle Modal Buttons ===
  //    On click, we simulate connecting a wallet, hide the modal, show spinner, etc.
  modalButtons.forEach(button => {
    button.addEventListener("click", () => {
      // Close the modal
      const modal = document.querySelector("#staticBackdrop");
      if (modal) {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        modalInstance.hide();
      }

      // Create a spinner overlay
      const spinner = document.createElement("div");
      spinner.className = "position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75";
      spinner.innerHTML = `
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      `;
      body.appendChild(spinner);

      // Simulate a 2-second delay
      setTimeout(() => {
        body.removeChild(spinner);

        // Hide the connect button and show the wallet display
        conBot.classList.add("d-none");
        walletShow.classList.remove("d-none");

        // === 3) Save "connected" state in localStorage ===
        // We'll store a placeholder wallet address, e.g. "Ox374.....djgff"
        localStorage.setItem("walletConnected", "true");
        localStorage.setItem("walletAddress", "Ox374.....djgff");
        localStorage.setItem("walletConnectTime", Date.now().toString()); // store timestamp
      }, 2000);
    });
  });
});



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



// INCREMENT YEAR CODE
const minusBtn = document.getElementById('minusBtn');
const plusBtn = document.getElementById('plusBtn');
const yearDisplay = document.getElementById('yearDisplay');
let years = 1;

// Function to update the display and button states
const updateDisplay = () => {
  yearDisplay.textContent = `${years} Year${years > 1 ? 's' : ''}`;
  if (years === 1) {
    minusBtn.disabled = true;
    minusBtn.classList.add('disabled');
  } else {
    minusBtn.disabled = false;
    minusBtn.classList.remove('disabled');
  }
};

// Increment years
plusBtn.addEventListener('click', () => {
  years++;
  updateDisplay();
});

// Decrement years
minusBtn.addEventListener('click', () => {
  if (years > 1) {
    years--;
    updateDisplay();
  }
});

// Initial update
updateDisplay();

// TOOGLE DISPLAY

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








document.addEventListener("DOMContentLoaded", function () {
  // Countdown Timer
  const modal = document.getElementById("staticBackdrop");
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
  modal.addEventListener("show.bs.modal", () => {
    clearInterval(countdownInterval); // Clear any existing timer
    startCountdown(10 * 60); // Start a 10-minute countdown
  });

  // Event listener for modal hide
  modal.addEventListener("hide.bs.modal", () => {
    clearInterval(countdownInterval); // Stop the timer when modal is hidden
  });

  // Copy to Clipboard Tooltip

  const copyIcon = document.querySelector(".copy-icon");
  const tooltipText = document.querySelector(".tooltip-text");

  // Show "Copy to Clipboard" on hover
  copyIcon.addEventListener("mouseover", function () {
    tooltipText.textContent = "Copy to Clipboard";
    tooltipText.classList.remove("copied");
  });

  // Copy text to clipboard on click
  copyIcon.addEventListener("click", function () {
    const walletAddress = "Ox374sgtywue464775849djgff"; // Replace with dynamic content if needed
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


});