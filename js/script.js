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
