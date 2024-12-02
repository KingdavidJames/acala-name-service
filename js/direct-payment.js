// Select all payment option divs and their select icons
const paymentOptions = document.querySelectorAll('.select-payment > div');
const orderDetails = document.querySelector('.order-details');
const coinTypeSpans = document.querySelectorAll('.coin-type');

// Function to handle the selection logic
function handleSelection(selectedDiv) {
    // Deselect all options and hide their select-coin icons
    paymentOptions.forEach(option => {
        option.classList.remove('selected');
        const selectIcon = option.querySelector('.select-coin');
        if (selectIcon) {
            selectIcon.classList.add('d-none');
        }
    });

    // Select the clicked option and show its select-coin icon
    selectedDiv.classList.add('selected');
    const selectedIcon = selectedDiv.querySelector('.select-coin');
    if (selectedIcon) {
        selectedIcon.classList.remove('d-none');
    }

    // Update the coin type in the order details
    const selectedCoin = selectedDiv.querySelector('.coin-header').textContent.trim();
    coinTypeSpans.forEach(span => {
        span.textContent = selectedCoin;
    });
}

// Add click event listeners to each payment option
paymentOptions.forEach(option => {
    option.addEventListener('click', () => handleSelection(option));
});

// Set default selection to AST on page load
const defaultSelection = document.querySelector('.select-payment .ast');
if (defaultSelection) {
    handleSelection(defaultSelection);
}

 // Copy to Clipboard Tooltip

 const copyIconNew = document.querySelector(".copy-icon2");
 const tooltipTextNew = document.querySelector(".tooltip-text2");

 // Show "Copy to Clipboard" on hover
 copyIconNew.addEventListener("mouseover", function () {
     tooltipTextNew.textContent = "Copy to Clipboard";
     tooltipTextNew.classList.remove("copied");
 });

 // Copy text to clipboard on click
 copyIconNew.addEventListener("click", function () {
     const walletAddress = "Ox374sgtywue464775849djgff"; // Replace with dynamic content if needed
     navigator.clipboard.writeText(walletAddress).then(() => {
         // Change tooltip to "Copied!" on click
         tooltipTextNew.textContent = "Copied!";
         tooltipTextNew.classList.add("copied");

         // Revert to "Copy to Clipboard" after 2 seconds
         setTimeout(() => {
             tooltipTextNew.textContent = "Copy to Clipboard";
             tooltipTextNew.classList.remove("copied");
         }, 2000);
     }).catch(err => {
         console.error("Failed to copy text: ", err);
     });
 });