document.addEventListener("DOMContentLoaded", () => {
    // Select all payment option divs
    const paymentOptions = document.querySelectorAll('.select-payment > div');
    const coinElement = document.getElementById('coin');
    const coinNameElement = document.getElementById('coinName');

    // Function to handle the select toggle and update coin details
    function handleSelection(selectedDiv) {
        // Update select-coin icons
        paymentOptions.forEach(option => {
            const selectIcon = option.querySelector('.select-coin');
            if (selectIcon) {
                selectIcon.classList.add('d-none');
            }
        });

        const selectedIcon = selectedDiv.querySelector('.select-coin');
        if (selectedIcon) {
            selectedIcon.classList.remove('d-none');
        }

        // Update #coin and #coinName with the selected coin's header and details
        const coinHeader = selectedDiv.querySelector('.coin-header')?.textContent;
        const coinDetails = selectedDiv.querySelector('.coin-details')?.textContent;

        if (coinHeader && coinDetails) {
            coinElement.textContent = coinHeader;
            coinNameElement.textContent = coinDetails;
        }
    }

    // Add click event listeners to each payment option
    paymentOptions.forEach(option => {
        option.addEventListener('click', () => handleSelection(option));
    });

    // Set default selection to AMB on page load
    const defaultSelection = document.querySelector('.select-payment .amb');
    if (defaultSelection) {
        handleSelection(defaultSelection);
    }
});
