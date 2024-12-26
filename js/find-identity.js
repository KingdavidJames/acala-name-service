/*************************************
 * Simulated CSV Data (in-memory)
 *************************************/
let takenNames = [
    // Example of taken names:
    "james.amb",
    "nothing.amb",
    "sambo.amb",
    "spencer.amb",
    "yhubee.amb",
    "bobthebuilder.amb",
    "enene.amb",
    "praiz.amb",
    "precious.amb",
    // "alex.amb"
];

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

    // Grab the current displayed name from the availableDiv
    let text = availableDiv.querySelector("p").textContent;
    // Example text: "something.amb is Available"
    // We just want the name up to the " is "
    let chosenName = text.split(" is ")[0];

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
// The first one is "1 year registration" with price
// The second one is "Est. network fee" with price
// The third row is total

let yearCount = 1;
let basePrice = 100;      // 100 AMB
let networkFee = 2;       // 2 AMB

function setYearCount(value) {
    yearCount = value;
    yearDisplay.textContent = `${yearCount} Year`;
    if (yearCount > 1) {
        yearDisplay.textContent += "s";
    }

    // Also update the "x year registration" below the +/- control
    yearDetails.textContent = `${yearCount}`;

    // Calculate prices
    const totalNamePrice = basePrice * yearCount;
    const totalNetworkFee = networkFee * yearCount;
    const total = totalNamePrice + totalNetworkFee;

    // Update the text in the .total-calc
    // pYearEls[0]: "1 year registration" -> needs to show "yearCount year registration" and "totalNamePrice AMB"
    // pYearEls[1]: "Est. network fee" -> show "totalNetworkFee AMB"
    // pYearEls[2] -> The total row
    // (But watch out, we have multiple <p class="p-year fw-medium"> in the markup.)

    // We'll rely on index order from the HTML you posted:
    //   [0] => "1 year registration" text
    //   [1] => "1 year registration" price (100 AMB)
    //   [2] => "Est. network fee" text
    //   [3] => "2 AMB"
    //   [4] => "Total" text
    //   [5] => "102 AMB"
    pYearEls[0].textContent = `${yearCount} year registration`;
    pYearEls[1].textContent = `${totalNamePrice} AMB`;
    pYearEls[3].textContent = `${totalNetworkFee} AMB`;
    pYearEls[5].textContent = `${total} AMB`;

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
// In your HTML, the button with class .suc-payment points to "order-success.html" 
// for demonstration. We'll intercept the click here to update our CSV array.

const iHavePaidBtn = document.querySelector(".suc-payment");
iHavePaidBtn.addEventListener("click", function (event) {
    // The name chosen is in nameChosenEl
    const justRegisteredName = nameChosenEl.textContent.toLowerCase();

    // Simulate appending to the CSV:
    if (!takenNames.includes(justRegisteredName)) {
        takenNames.push(justRegisteredName);
        console.log("Updated takenNames array:", takenNames);
    }

    // In a real scenario, you’d do a POST or fetch to your server:
    // fetch('/append-to-csv', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ name: justRegisteredName })
    // });

    // Then let the user proceed to the success page...
    // or show a success message, etc.
});

//   =================================================================


    // Select all modal buttons
    const modalButtons = document.querySelectorAll(".md-but");
    const body = document.body;
    const conBot = document.querySelector(".con-bot");
    const walletShow = document.querySelector(".walletshow");

    // Add click event listeners to modal buttons
    modalButtons.forEach(button => {
        button.addEventListener("click", () => {
            // Close the modal
            const modal = document.querySelector("#staticBackdrop");
            if (modal) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                modalInstance.hide();
            }

            // Create a spinner element
            const spinner = document.createElement("div");
            spinner.className = "position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75";
            spinner.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            `;
            body.appendChild(spinner);

            // Simulate processing delay
            setTimeout(() => {
                // Remove the spinner
                body.removeChild(spinner);

                // Hide the connect button and show the wallet display
                conBot.classList.add("d-none");
                walletShow.classList.remove("d-none");
            }, 2000); // Adjust delay as needed
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


