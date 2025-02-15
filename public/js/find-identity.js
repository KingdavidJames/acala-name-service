/*************************************
 * Dropdown & Pricing Logic
 *************************************/
// Pricing mapping for each currency
const pricingData = {
    ACA: { basePrice: 2, networkFee: 1 },
    LDOT: { basePrice: 3, networkFee: 1.5 },
    tDOT: { basePrice: 4, networkFee: 2 }
};

// Global pricing variables (initially set for ACA)
let basePrice = pricingData.ACA.basePrice;
let networkFee = pricingData.ACA.networkFee;
let currentCurrency = "ACA"; // current currency for display

// Global year count
let yearCount = 1;

// DOM Elements for price calculation (make sure these IDs/classes exist in your HTML)
const yearDisplay = document.getElementById("yearDisplay");
const yearDetails = document.querySelector(".year-details span");
const pYearEls = document.querySelectorAll(".p-year");
const modalTotalacaEl = document.getElementById("modalTotalaca");
const minusBtn = document.getElementById("minusBtn");
const plusBtn = document.getElementById("plusBtn");

// Function to update pricing display based on the yearCount
function setYearCount(value) {
    yearCount = value;
    yearDisplay.textContent = `${yearCount} Year${yearCount > 1 ? "s" : ""}`;
    yearDetails.textContent = `${yearCount}`;

    // Calculate prices
    const totalNamePrice = basePrice * yearCount;
    const totalNetworkFee = networkFee * yearCount;
    const total = totalNamePrice + totalNetworkFee;

    // Update the text in the .total-calc elements
    pYearEls[0].textContent = `${yearCount} year registration`;
    pYearEls[1].textContent = `${totalNamePrice} ${currentCurrency}`;
    pYearEls[2].textContent = `Est. network fee`;
    pYearEls[3].textContent = `${totalNetworkFee} ${currentCurrency}`;
    pYearEls[4].textContent = `Total`;
    pYearEls[5].textContent = `${total} ${currentCurrency}`;

    // Update the modal’s total <span>
    if (modalTotalacaEl) {
        modalTotalacaEl.textContent = total;
    }

    // Enable/disable the minus button based on the year count
    if (yearCount <= 1) {
        minusBtn.classList.add("disabled");
        minusBtn.disabled = true;
    } else {
        minusBtn.classList.remove("disabled");
        minusBtn.disabled = false;
    }
}

// Initialize pricing with 1 year on load
setYearCount(1);

// Dropdown Items Logic
const dropdownItems = document.querySelectorAll('.dropdown-item');
dropdownItems.forEach(item => {
    item.addEventListener('click', function (e) {
        e.preventDefault();

        // Retrieve data attributes from the clicked dropdown item
        const imgSrc = this.getAttribute('data-img');
        const title = this.getAttribute('data-title');
        const details = this.getAttribute('data-details');

        // Update the dropdown toggle button content
        const dropdownToggle = document.getElementById('dropdownMenuButton');
        dropdownToggle.innerHTML = `
        <img src="${imgSrc}" class="w-50px" alt="">
        <div class="ms-3 me-5">
          <h1 class="modal-title fs-5 coin-header">${title}</h1>
          <p class="coin-details mb-0">${details}</p>
        </div>
      `;

        // Update pricing variables based on the selected currency
        if (pricingData[title]) {
            basePrice = pricingData[title].basePrice;
            networkFee = pricingData[title].networkFee;
            currentCurrency = title;
        }

        // Recalculate the totals based on the new currency values
        setYearCount(yearCount);
    });
});

/*************************************
 * Simulated CSV Data (in-memory)
 *************************************/
import { checkName } from "./api.js";
// Merge localStorage 'takenNames' with our default array
const storedTakenNames = JSON.parse(localStorage.getItem("takenNames")) || [];
let takenNames = [
    // Add any default taken names here, if applicable
];
// Merge them
takenNames = [...takenNames, ...storedTakenNames];

// DOM Elements for Name Search and Registration
const searchInput = document.getElementById("dynamic_searchbar");
const availableDiv = document.getElementById("availableName");
const unavailableDiv = document.getElementById("unAvailableName");
const getNameLink = document.getElementById("getName");

// Spinner Element
let spinner = null;

// Registration Elements
const registerNameDiv = document.getElementById("registerName");
const findNameDiv = document.getElementById("findName");
const nameChosenEl = document.getElementById("nameChosen");

/*************************************
 * Hide the available/unavailable name divs initially
 *************************************/
availableDiv.style.display = "none";
unavailableDiv.style.display = "none";

/*************************************
 * Add a spinner next to the input
 *************************************/
spinner = document.createElement("div");
spinner.className = "spinner-border spinner-border-sm text-primary ms-2 simp";
spinner.setAttribute("role", "status");
spinner.style.display = "none";
searchInput.parentNode.appendChild(spinner);

/*************************************
 * Searching for a name
 *************************************/
searchInput.addEventListener("keydown", async function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        spinner.style.display = "inline-block";

        const nameToCheck = this.value.trim();
        if (!nameToCheck) {
            availableDiv.style.display = "none";
            unavailableDiv.style.display = "none";
            spinner.style.display = "none";
            return;
        }

        // Simulate delay for searching
        setTimeout(async () => {
            spinner.style.display = "none";
            // Format the name (assuming ".aca" as default)
            const formattedName = nameToCheck.endsWith(".aca")
                ? nameToCheck.toLowerCase()
                : nameToCheck.toLowerCase() + ".aca";

            try {
                const response = await checkName(formattedName);
                console.log(response);
                if (response.taken) {
                    availableDiv.style.display = "none";
                    unavailableDiv.style.display = "flex";
                    unavailableDiv.querySelector("p").innerHTML =
                        `${formattedName} is <span class="text-red fw-medium">Taken</span>`;
                } else {
                    unavailableDiv.style.display = "none";
                    availableDiv.style.display = "flex";
                    availableDiv.querySelector("p").innerHTML =
                        `${formattedName} is <span class="text-green fw-medium">Available</span>`;
                }
            } catch (error) {
                console.error("Error checking name:", error);
                alert("An error occurred while checking the name. Please try again.");
            }
        }, 1000);
    }
});

/*************************************
 * Handle "Get Name" click
 *************************************/
getNameLink.addEventListener("click", function (e) {
    e.preventDefault();
    if (availableDiv.style.display !== "flex") {
        alert("The selected name is not available.");
        return;
    }
    let text = availableDiv.querySelector("p").innerHTML;
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = text;
    let chosenName = tempDiv.textContent.split(" is ")[0];
    nameChosenEl.textContent = chosenName;
    findNameDiv.style.display = "none";
    registerNameDiv.style.display = "block";
    setYearCount(1);
});

/*************************************
 * Year increment / decrement logic
 *************************************/
minusBtn.addEventListener("click", function () {
    if (yearCount > 1) {
        setYearCount(yearCount - 1);
    }
});

plusBtn.addEventListener("click", function () {
    setYearCount(yearCount + 1);
});

/*************************************
 * "I have made payment" button logic (in the modal)
 *************************************/
const iHavePaidBtn = document.querySelector(".suc-payment");
iHavePaidBtn.addEventListener("click", function (event) {
    const justRegisteredName = nameChosenEl.textContent.toLowerCase();
    if (!takenNames.includes(justRegisteredName)) {
        takenNames.push(justRegisteredName);
        console.log("Updated takenNames array:", takenNames);
    }
    localStorage.setItem("takenNames", JSON.stringify(takenNames));
    localStorage.setItem("chosenName", justRegisteredName);
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

getName.addEventListener("click", (event) => {
    event.preventDefault();
    findName.style.display = "none";
    registerName.style.display = "block";
});

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

function startCountdown(duration) {
    let time = duration;
    updateTimerDisplay(time);
    countdownInterval = setInterval(() => {
        time--;
        updateTimerDisplay(time);
        if (time <= 0) {
            clearInterval(countdownInterval);
            const modalInstance = bootstrap.Modal.getInstance(paymentModal);
            if (modalInstance) {
                modalInstance.hide();
            }
            alert('Payment time has expired.');
        }
    }, 1000);
}

function updateTimerDisplay(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    timerElement.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

if (paymentModal) {
    paymentModal.addEventListener("show.bs.modal", () => {
        clearInterval(countdownInterval);
        startCountdown(5 * 60); // 5-minute countdown
    });
    paymentModal.addEventListener("hide.bs.modal", () => {
        clearInterval(countdownInterval);
    });
}

/*************************************
 * Copy to Clipboard Tooltip
 *************************************/
const copyIcon = document.querySelector(".copy-icon");
const tooltipText = document.querySelector(".tooltip-text");

copyIcon.addEventListener("mouseover", function () {
    tooltipText.textContent = "Copy to Clipboard";
    tooltipText.classList.remove("copied");
});

copyIcon.addEventListener("click", function () {
    const walletAddress = "0x1787b2190C575bAFb61d8582589E0eB4DFBA2C84"; // Adjust if needed
    navigator.clipboard.writeText(walletAddress).then(() => {
        tooltipText.textContent = "Copied!";
        tooltipText.classList.add("copied");
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
// Place your optional Ethers.js helper functions here if needed.
