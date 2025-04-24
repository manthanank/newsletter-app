document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('subscribeForm');
    const messageContainer = document.getElementById('message');
    const themeToggle = document.getElementById('theme-toggle');
    
    // Get the base API URL dynamically from the current window location
    const apiBaseUrl = window.location.origin;
    
    // Theme toggle functionality
    initThemeToggle();

    function initThemeToggle() {
        // Check for saved theme preference or use the system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.checked = true;
            updateThemeIcon(true);
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.checked = false;
            updateThemeIcon(false);
        }
        
        // Add event listener for theme toggle
        themeToggle.addEventListener('change', function(e) {
            const isDark = e.target.checked;
            
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcon(isDark);
        });
    }
    
    function updateThemeIcon(isDark) {
        const themeIcon = document.querySelector('.theme-switch-thumb i');
        
        if (isDark) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        } else {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    }

    // Existing form submission functionality
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const email = emailInput.value.trim();
        const name = nameInput.value.trim();
        
        // Get selected interests
        const selectedInterests = Array.from(
            document.querySelectorAll('input[name="interests"]:checked')
        ).map(checkbox => checkbox.value);

        // Clear previous messages
        messageContainer.innerHTML = '';
        
        // Show loading message
        showMessage('Subscribing...', 'info');

        // Perform validation
        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address.', 'error');
            return;
        }

        // Make a POST request to the API endpoint using dynamic URL
        fetch(`${apiBaseUrl}/api/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: email,
                name: name,
                groups: selectedInterests 
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Reset form
            form.reset();
            
            // Show success message with animation
            showMessage(data.message || 'Successfully subscribed to the newsletter!', 'success');
            
            // Add thank you animation
            showThankYou();
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('An error occurred while subscribing. Please try again later.', 'error');
        });
    });

    // Function to validate email format
    function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Function to display messages
    function showMessage(message, type) {
        messageContainer.innerHTML = '';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        messageContainer.appendChild(messageDiv);

        // Auto-hide info messages after 5 seconds
        if (type === 'info') {
            setTimeout(() => {
                messageDiv.classList.add('fade-out');
                setTimeout(() => {
                    if (messageContainer.contains(messageDiv)) {
                        messageContainer.removeChild(messageDiv);
                    }
                }, 500);
            }, 5000);
        }
    }
    
    // Function to show thank you animation after successful subscription
    function showThankYou() {
        // Create a temporary div for the animation
        const thankYouEl = document.createElement('div');
        thankYouEl.className = 'thank-you-animation';
        thankYouEl.innerHTML = '<i class="fas fa-heart"></i><span>Thank you for subscribing!</span>';
        
        document.body.appendChild(thankYouEl);
        
        // Remove after animation completes
        setTimeout(() => {
            thankYouEl.classList.add('fade-out');
            setTimeout(() => {
                if (document.body.contains(thankYouEl)) {
                    document.body.removeChild(thankYouEl);
                }
            }, 1000);
        }, 3000);
    }
});
