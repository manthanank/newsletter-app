document.addEventListener("DOMContentLoaded", function () {
  // Set up dynamic base URL for API calls
  const apiBaseUrl = window.location.origin;
  // Get elements
  const unsubscribeBtn = document.getElementById("unsubscribe");
  const messageContainer = document.getElementById("message");
  const contentEl = document.getElementById("content");
  const emptyStateEl = document.getElementById("empty-state");
  const successStateEl = document.getElementById("success-state");
  const emailDisplayEl = document.getElementById("display-email");
  const themeToggle = document.getElementById("theme-toggle");

  // Theme toggle functionality
  initThemeToggle();

  function initThemeToggle() {
    // Check for saved theme preference or use the system preference
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      document.documentElement.setAttribute("data-theme", "dark");
      themeToggle.checked = true;
      updateThemeIcon(true);
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      themeToggle.checked = false;
      updateThemeIcon(false);
    }

    // Add event listener for theme toggle
    themeToggle.addEventListener("change", function (e) {
      const isDark = e.target.checked;

      document.documentElement.setAttribute(
        "data-theme",
        isDark ? "dark" : "light"
      );
      localStorage.setItem("theme", isDark ? "dark" : "light");
      updateThemeIcon(isDark);
    });
  }

  function updateThemeIcon(isDark) {
    const themeIcon = document.querySelector(".theme-switch-thumb i");

    if (isDark) {
      themeIcon.classList.remove("fa-sun");
      themeIcon.classList.add("fa-moon");
    } else {
      themeIcon.classList.remove("fa-moon");
      themeIcon.classList.add("fa-sun");
    }
  }

  // Get the email from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email");

  // Check if email exists in the URL
  if (!email) {
    // Show empty state and hide other content
    contentEl.style.display = "none";
    emptyStateEl.style.display = "block";
    successStateEl.style.display = "none";
    return;
  }

  // Display the email in the UI
  emailDisplayEl.textContent = email;

  // Email exists in URL, show content
  unsubscribeBtn.addEventListener("click", function () {
    // Show loading message
    showMessage("Processing your request...", "info");

    // Get selected reason (if any)
    const selectedReason = document.querySelector(
      'input[name="reason"]:checked'
    );
    const reason = selectedReason ? selectedReason.value : "not-specified";

    // Send a POST request to the server
    fetch(`${apiBaseUrl}/api/unsubscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        reason,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Server returned an error");
        }
        return response.json();
      })
      .then((data) => {
        // Show success state and hide other content
        contentEl.style.display = "none";
        emptyStateEl.style.display = "none";
        successStateEl.style.display = "block";

        // Scroll to top for better visibility of the success message
        window.scrollTo({ top: 0, behavior: "smooth" });
      })
      .catch((error) => {
        console.error("Error unsubscribing:", error);
        showMessage(
          "An error occurred while processing your request. Please try again later.",
          "error"
        );
      });
  });

  // Function to display messages
  function showMessage(text, type) {
    messageContainer.innerHTML = "";

    const messageEl = document.createElement("div");
    messageEl.className = `message ${type}`;
    messageEl.textContent = text;

    messageContainer.appendChild(messageEl);

    // Auto-hide info messages after 5 seconds
    if (type === "info") {
      setTimeout(() => {
        messageEl.classList.add("fade-out");
        setTimeout(() => {
          if (messageContainer.contains(messageEl)) {
            messageContainer.removeChild(messageEl);
          }
        }, 500);
      }, 5000);
    }
  }
});
