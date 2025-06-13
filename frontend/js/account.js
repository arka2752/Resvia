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
        loginFormElement.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form values
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            try {
                const response = await fetch('http://localhost:5000/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message);
                    if (rememberMe) {
                        localStorage.setItem('userData', JSON.stringify(data.user));
                    } else {
                        sessionStorage.setItem('userData', JSON.stringify(data.user));
                    }
                    showUserProfile(data.user);
                } else {
                    alert(data.error || 'Login failed.');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('An error occurred during login. Please try again.');
            }
        });
    }
    
    // Register form submission
    const registerFormElement = document.querySelector('#registerForm form');
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form values
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            
            try {
                const response = await fetch('http://localhost:5000/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        email,
                        password
                    })
                });
                
                const data = await response.json();
                if (response.ok) {
                    alert(data.message);
                    // After successful registration, show login form
                    registerForm.style.display = 'none';
                    loginForm.style.display = 'block';
                    // Optionally clear register form fields
                    document.querySelector('#registerForm form').reset();
                } else {
                    alert(data.error || 'Registration failed.');
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('An error occurred during registration. Please try again.');
            }
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