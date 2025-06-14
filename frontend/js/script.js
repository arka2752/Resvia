// Main JavaScript for Hotel Booking AI Agent

document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const chatContainer = document.getElementById('chatContainer');
    const chatMessages = document.getElementById('chatMessages');
    const bookingSummary = document.getElementById('bookingSummary');
    const flightSearchForm = document.getElementById('flightSearchForm');
    const hotelSearchForm = document.getElementById('hotelSearchForm');

    // API Endpoints
    const API_BASE_URL = 'http://localhost:5000/api';

    // Booking state
    let currentBooking = {
        destination: '',
        checkIn: '',
        checkOut: '',
        guests: 0,
        rooms: 0,
        preferences: [],
        selectedHotel: null,
        status: 'not_started' // not_started, in_progress, confirmed
    };

    // Initialize the chat (no login required)
    userInput.disabled = false;
    userInput.placeholder = 'Tell me about your travel plans...';
    chatForm.querySelector('button').disabled = false;
    userInput.focus();

    // Event Listeners
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (!message) return;

        // Add user message
        addMessage(message, false);
        userInput.value = '';

        try {
            // Send message to backend and get response
            const response = await sendChatMessage(message);
            if (response && response.message) {
                addMessage(response.message);
            } else {
                addMessage("I'm sorry, I received an invalid response. Please try again.");
            }
        } catch (error) {
            addMessage("I'm sorry, I encountered an error. Please try again.");
        }
    });
    flightSearchForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const flightData = {
            origin: document.getElementById('origin').value,
            destination: document.getElementById('destination').value,
            departureDate: document.getElementById('departureDate').value,
            returnDate: document.getElementById('returnDate').value,
            adults: 1
        };

        try {
            addMessage("Searching for flights...");
            const results = await searchFlights(flightData);

            // Process and display flight results
            if (results && results.length > 0) {
                const message = `I found ${results.length} flights matching your criteria. Here are some options:\n\n` +
                    results.slice(0, 3).map(flight =>
                        `${flight.itineraries[0].segments[0].departure.iataCode} → ${flight.itineraries[0].segments[0].arrival.iataCode}\n` +
                        `Price: ${flight.price.total} ${flight.price.currency}`
                    ).join('\n\n');
                addMessage(message);
            } else {
                addMessage("I couldn't find any flights matching your criteria. Please try different dates or destinations.");
            }
        } catch (error) {
            addMessage("I'm sorry, I encountered an error while searching for flights. Please try again.");
        }
    });

    hotelSearchForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const hotelData = {
            cityCode: document.getElementById('cityCode').value,
            checkIn: document.getElementById('checkIn').value,
            checkOut: document.getElementById('checkOut').value,
            adults: 1
        };

        try {
            addMessage("Searching for hotels...");
            const results = await searchHotels(hotelData);

            // Process and display hotel results
            if (results && results.length > 0) {
                const message = `I found ${results.length} hotels in ${hotelData.cityCode}. Here are some options:\n\n` +
                    results.slice(0, 3).map(hotel =>
                        `${hotel.hotel.name}\n` +
                        `Rating: ${hotel.hotel.rating || 'N/A'}\n` +
                        `Price: ${hotel.offers[0].price.total} ${hotel.offers[0].price.currency}`
                    ).join('\n\n');
                addMessage(message);
            } else {
                addMessage("I couldn't find any hotels matching your criteria. Please try different dates or city.");
            }
        } catch (error) {
            addMessage("I'm sorry, I encountered an error while searching for hotels. Please try again.");
        }
    });

    // Functions
    function addMessage(content, isBot = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isBot ? 'bot-message' : 'user-message'}`;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (isBot) {
            const header = document.createElement('div');
            header.className = 'message-header mb-2';
            header.innerHTML = `
                <img src="https://ui-avatars.com/api/?name=Resvia&background=937DC2&color=fff" 
                     alt="Resvia" class="rounded-circle me-2" width="24" height="24">
                <span class="fw-bold">Resvia</span>
            `;
            messageContent.appendChild(header);
        }

        const text = document.createElement('p');
        // Convert newlines to <br> tags
        text.innerHTML = content.replace(/\n/g, '<br>');
        messageContent.appendChild(text);

        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendChatMessage(message) {
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            addMessage("I'm sorry, I encountered an error. Please try again.");
            throw error;
        }
    }

    async function searchFlights(data) {
        try {
            const response = await fetch(`${API_BASE_URL}/flights/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            addMessage("I'm sorry, I encountered an error while searching for flights. Please try again.");
            throw error;
        }
    }

    async function searchHotels(data) {
        try {
            const response = await fetch(`${API_BASE_URL}/hotels/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            addMessage("I'm sorry, I encountered an error while searching for hotels. Please try again.");
            throw error;
        }
    }

    // Register form submission
    const registerFormElement = document.querySelector('#registerForm form');
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Get form values
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const fullName = firstName + ' ' + lastName;
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
                        fullName,
                        email,
                        password
                    })
                });

                const data = await response.json();
                if (data.status === 'success') {
                    alert('Account created successfully!');
                    // After successful registration
                    registerForm.style.display = 'none';
                    loginForm.style.display = 'block';
                } else {
                    alert(data.error || 'Registration failed.');
                }
            } catch (error) {
                alert('An error occurred. Please try again.');
            }
        });
    }
});