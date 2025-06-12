// Account Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const userProfile = document.getElementById('userProfile');
    const showRegisterForm = document.getElementById('showRegisterForm');
    const showLoginForm = document.getElementById('showLoginForm');
    const logoutButton = document.getElementById('logoutButton');
    
    // Check if user is already logged in (from localStorage)
    checkLoginStatus();
    
    // Toggle between login and register forms
    if (showRegisterForm) {
        showRegisterForm.addEventListener('click', function() {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        });
    }
    
    if (showLoginForm) {
        showLoginForm.addEventListener('click', function() {
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }
    
    // Login form submission
    const loginFormElement = document.querySelector('#loginForm form');
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            // In a real app, you would validate and send to backend
            // For demo, we'll just simulate a successful login
            const userData = {
                name: 'John Doe', // In a real app, this would come from the backend
                email: email,
                memberSince: 'January 2023',
                isLoggedIn: true
            };
            
            // Save to localStorage if remember me is checked
            if (rememberMe) {
                localStorage.setItem('userData', JSON.stringify(userData));
            } else {
                // Use sessionStorage if not remember me
                sessionStorage.setItem('userData', JSON.stringify(userData));
            }
            
            // Show profile
            showUserProfile(userData);
        });
    }
    
    // Register form submission
    const registerFormElement = document.querySelector('#registerForm form');
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // In a real app, you would validate and send to backend
            // For demo, we'll just simulate a successful registration
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            
            const userData = {
                name: fullName,
                email: email,
                memberSince: getCurrentDate(),
                isLoggedIn: true
            };
            
            // Save to localStorage
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Show profile
            showUserProfile(userData);
        });
    }
    
    // Logout functionality
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Clear storage
            localStorage.removeItem('userData');
            sessionStorage.removeItem('userData');
            
            // Show login form
            userProfile.style.display = 'none';
            loginForm.style.display = 'block';
            
            // Clear form fields
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            document.getElementById('rememberMe').checked = false;
        });
    }
    
    // Helper Functions
    function checkLoginStatus() {
        // Check localStorage first, then sessionStorage
        const storedUser = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            if (userData.isLoggedIn) {
                showUserProfile(userData);
            }
        }
    }
    
    function showUserProfile(userData) {
        // Hide forms
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'none';
        
        // Update profile data
        document.getElementById('profileName').textContent = userData.name;
        document.getElementById('profileEmail').textContent = userData.email;
        document.getElementById('memberSince').textContent = userData.memberSince;
        
        // Set initials in avatar
        const initials = getInitials(userData.name);
        document.querySelector('.initials').textContent = initials;
        
        // Show profile
        userProfile.style.display = 'block';
    }
    
    function getInitials(name) {
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase();
    }
    
    function getCurrentDate() {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const now = new Date();
        return `${months[now.getMonth()]} ${now.getFullYear()}`;
    }
    
    // Form validation (basic example)
    const formInputs = document.querySelectorAll('.form-control');
    formInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() === '' && this.hasAttribute('required')) {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
            }
        });
        
        input.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.classList.remove('is-invalid');
            }
        });
    });
});