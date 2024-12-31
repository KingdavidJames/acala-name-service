/*************************************
 * Simulated CSV Data (in-memory)
 *************************************/

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
searchInput.addEventListener("keydown", function (e) {
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

        // Simulate a short delay for searching
        setTimeout(() => {
            spinner.style.display = "none";

            // Check if name is in 'takenNames'
            // We’ll standardize everything to "something.amb"
            const formattedName = nameToCheck.endsWith(".amb")
                ? nameToCheck.toLowerCase()
                : nameToCheck.toLowerCase() + ".amb";

            if (takenNames.includes(formattedName)) {
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
        }, 1000); // 1 second search delay
    }
});

/*************************************
 * Handle "Get Name" click
 *************************************/
getNameLink.addEventListener("click", function (e) {
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
 * "I have made payment" button logic
 * (in the modal)
 *************************************/
const iHavePaidBtn = document.querySelector(".suc-payment");
iHavePaidBtn.addEventListener("click", function (event) {
    // The user’s chosen name:
    const justRegisteredName = nameChosenEl.textContent.toLowerCase();

    // 1) Add to your in-memory array
    if (!takenNames.includes(justRegisteredName)) {
        takenNames.push(justRegisteredName);
        console.log("Updated takenNames array:", takenNames);
    }

    // 2) Save updated array to localStorage so it persists
    localStorage.setItem("takenNames", JSON.stringify(takenNames));

    // 3) Also save the "justRegisteredName" so the next page (success page) can display it
    localStorage.setItem("chosenName", justRegisteredName);

    // 4) Let the link navigate to order-success.html as usual
    //    (Or if you’re preventing default, you can redirect manually)
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

