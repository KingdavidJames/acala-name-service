document.addEventListener("DOMContentLoaded", function() {
    // Grab the element where we display the chosen name
    const nameTakenEl = document.getElementById("nameTaken");
    // Retrieve the chosenName from localStorage
    const chosenName = localStorage.getItem("chosenName");
    
    if (chosenName) {
      // Update the text to the user’s chosen name
      nameTakenEl.innerHTML = `
        ${chosenName}
        <i class="bi bi-copy cursor-pointer copy-icon2"></i>
        <span class="tooltip-text2 fs-8">Copy to Clipboard</span>
      `;
    }
  });
