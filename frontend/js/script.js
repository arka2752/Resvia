// Main JavaScript for Hotel Booking AI Agent

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const chatContainer = document.getElementById('chatContainer');
    const chatMessages = document.getElementById('chatMessages');
    const loginRequired = document.getElementById('loginRequired');
    const bookingSummary = document.getElementById('bookingSummary');
    
    // API Endpoints
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000/api' 
        : '/api';
    const NOVITA_API_URL = 'https://api.novita.ai/v1/chat'; // Replace with actual Novita.ai API endpoint
    
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

    // User state
    let isLoggedIn = false;
    let userProfile = null;

    // Initialize the chat
    initChat();

    // Event Listeners
    chatForm.addEventListener('submit', handleUserMessage);
    window.addEventListener('storage', handleStorageChange);

    // Functions
    function initChat() {
        checkLoginStatus();
        if (!isLoggedIn) {
            showLoginRequired();
            disableChatInput();
        } else {
            hideLoginRequired();
            enableChatInput();
            loadUserProfile();
        }
        userInput.focus();
    }

    function checkLoginStatus() {
        const token = localStorage.getItem('bookingbot_token');
        const user = JSON.parse(localStorage.getItem('bookingbot_user'));
        isLoggedIn = !!(token && user);
        userProfile = user;
        return isLoggedIn;
    }

    function handleStorageChange(e) {
        if (e.key === 'bookingbot_token' || e.key === 'bookingbot_user') {
            checkLoginStatus();
            if (isLoggedIn) {
                hideLoginRequired();
                enableChatInput();
                loadUserProfile();
            } else {
                showLoginRequired();
                disableChatInput();
            }
        }
    }

    function showLoginRequired() {
        loginRequired.style.display = 'block';
        chatMessages.style.display = 'none';
    }

    function hideLoginRequired() {
        loginRequired.style.display = 'none';
        chatMessages.style.display = 'block';
    }

    function disableChatInput() {
        userInput.disabled = true;
        userInput.placeholder = 'Please login to chat...';
        chatForm.querySelector('button').disabled = true;
    }

    function enableChatInput() {
        userInput.disabled = false;
        userInput.placeholder = 'Tell me about your hotel preferences...';
        chatForm.querySelector('button').disabled = false;
    }

    function loadUserProfile() {
        if (userProfile) {
            currentBooking.preferences = userProfile.preferences || [];
            // You can pre-fill other booking details from user profile if needed
        }
    }

    function handleUserMessage(e) {
        e.preventDefault();
        
        if (!isLoggedIn) {
            showLoginRequired();
            return;
        }
        
        const message = userInput.value.trim();
        if (message === '') return;
        
        // Add user message to chat
        addMessageToChat('user', message);
        
        // Clear input field
        userInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Process the message and get AI response
        processUserMessage(message);
    }

    function addMessageToChat(sender, content, isHtml = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        // Add message header with avatar
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';

        if (sender === 'bot') {
            const avatar = document.createElement('img');
            avatar.src = 'https://ui-avatars.com/api/?name=Booking+Bot&background=0D6EFD&color=fff';
            avatar.alt = 'BookingBot';
            avatar.className = 'rounded-circle me-2';
            avatar.width = 24;
            avatar.height = 24;
            headerDiv.appendChild(avatar);

            const name = document.createElement('span');
            name.className = 'fw-bold';
            name.textContent = 'BookingBot';
            headerDiv.appendChild(name);
        } else {
            if (userProfile) {
                const avatar = document.createElement('img');
                avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.firstName + '+' + userProfile.lastName)}&background=0D6EFD&color=fff`;
                avatar.alt = userProfile.firstName;
                avatar.className = 'rounded-circle me-2';
                avatar.width = 24;
                avatar.height = 24;
                headerDiv.appendChild(avatar);

                const name = document.createElement('span');
                name.className = 'fw-bold';
                name.textContent = `${userProfile.firstName} ${userProfile.lastName}`;
                headerDiv.appendChild(name);
            }
        }

        contentDiv.appendChild(headerDiv);
        
        // Add message content
        if (isHtml) {
            const contentWrapper = document.createElement('div');
            contentWrapper.innerHTML = content;
            contentDiv.appendChild(contentWrapper);
        } else {
            const paragraph = document.createElement('p');
            paragraph.textContent = content;
            contentDiv.appendChild(paragraph);
        }

        // Add timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        contentDiv.appendChild(timestamp);
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom of chat
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            typingDiv.appendChild(dot);
        }
        
        chatMessages.appendChild(typingDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async function processUserMessage(message) {
        try {
            // Prepare the chat context with user profile and booking state
            const context = {
                user: userProfile,
                booking: currentBooking,
                timestamp: new Date().toISOString()
            };

            // Call Novita.ai API (to be implemented)
            const response = await fetch(NOVITA_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NOVITA_API_KEY}` // To be configured
                },
                body: JSON.stringify({
                    message: message,
                    context: context
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response from AI');
            }

            const data = await response.json();

            // Hide typing indicator
            hideTypingIndicator();

            // Process AI response
            const aiMessage = data.message;
            const actions = data.actions || [];

            // Add AI message to chat
            addMessageToChat('bot', aiMessage);

            // Handle any actions returned by the AI
            for (const action of actions) {
                switch (action.type) {
                    case 'update_booking':
                        updateBookingState(action.data);
                        break;
                    case 'search_hotels':
                        await searchHotels(action.data);
                        break;
                    case 'confirm_booking':
                        await confirmBooking(action.data);
                        break;
                }
            }

        } catch (error) {
            console.error('Error processing message:', error);
            hideTypingIndicator();
            addMessageToChat('bot', 'I apologize, but I encountered an error. Please try again or contact support if the problem persists.');
        }
    }

    function updateBookingState(updates) {
        currentBooking = { ...currentBooking, ...updates };
        updateBookingSummary();
    }

    async function searchHotels(searchParams) {
        try {
            const response = await fetch(`${API_URL}/hotels/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(searchParams)
            });

            if (!response.ok) throw new Error('Failed to search hotels');

            const hotels = await response.json();
            showHotels(hotels);
        } catch (error) {
            console.error('Error searching hotels:', error);
            addMessageToChat('bot', 'I apologize, but I had trouble searching for hotels. Please try again.');
        }
    }

    async function confirmBooking(bookingDetails) {
        try {
            const response = await fetch(`${API_URL}/bookings/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('bookingbot_token')}`
                },
                body: JSON.stringify({
                    ...bookingDetails,
                    userId: userProfile.id
                })
            });

            if (!response.ok) throw new Error('Failed to confirm booking');

            const confirmation = await response.json();
            showBookingConfirmation(confirmation);
        } catch (error) {
            console.error('Error confirming booking:', error);
            addMessageToChat('bot', 'I apologize, but I encountered an error while confirming your booking. Please try again.');
        }
    }

    function showHotels(hotels) {
        let hotelsHtml = `
            <div class="hotels-list">
                <h5 class="mb-3">Available Hotels</h5>
                <div class="row">
        `;

        hotels.forEach(hotel => {
            hotelsHtml += `
                <div class="col-md-6 mb-3">
                    <div class="card hotel-card h-100">
                        <img src="${hotel.image || 'https://via.placeholder.com/300x200?text=Hotel+Image'}" 
                             class="card-img-top" alt="${hotel.name}">
                        <div class="card-body">
                            <h6 class="card-title">${hotel.name}</h6>
                            <p class="card-text small">${hotel.location}</p>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="badge bg-primary">${hotel.rating} ★</span>
                                <span class="text-success fw-bold">$${hotel.price}/night</span>
                            </div>
                            <button class="btn btn-outline-primary btn-sm w-100" 
                                    onclick="selectHotel(${JSON.stringify(hotel).replace(/"/g, '&quot;')})">
                                Select Hotel
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        hotelsHtml += `
                </div>
            </div>
        `;

        addMessageToChat('bot', hotelsHtml, true);
    }

    function showBookingConfirmation(confirmation) {
        const confirmationHtml = `
            <div class="booking-confirmation">
                <div class="text-center mb-3">
                    <i class="fas fa-check-circle text-success fa-3x"></i>
                </div>
                <h5 class="text-center mb-3">Booking Confirmed!</h5>
                <div class="card">
                    <div class="card-body">
                        <p class="mb-2"><strong>Booking Reference:</strong> ${confirmation.referenceNumber}</p>
                        <p class="mb-2"><strong>Hotel:</strong> ${confirmation.hotelName}</p>
                        <p class="mb-2"><strong>Check-in:</strong> ${confirmation.checkIn}</p>
                        <p class="mb-2"><strong>Check-out:</strong> ${confirmation.checkOut}</p>
                        <p class="mb-2"><strong>Guests:</strong> ${confirmation.guests}</p>
                        <p class="mb-2"><strong>Total Price:</strong> $${confirmation.totalPrice}</p>
                    </div>
                </div>
                <div class="text-center mt-3">
                    <button class="btn btn-primary" onclick="startNewBooking()">Book Another Hotel</button>
                </div>
            </div>
        `;

        addMessageToChat('bot', confirmationHtml, true);
        currentBooking.status = 'confirmed';
        updateBookingSummary();
    }

    function startNewBooking() {
        currentBooking = {
            destination: '',
            checkIn: '',
            checkOut: '',
            guests: 0,
            rooms: 0,
            preferences: userProfile ? userProfile.preferences : [],
            selectedHotel: null,
            status: 'not_started'
        };
        updateBookingSummary();
        addMessageToChat('bot', 'I\'m ready to help you find another hotel! Where would you like to go?');
    }

    window.selectHotel = function(hotel) {
        currentBooking.selectedHotel = hotel;
        updateBookingSummary();
        addMessageToChat('bot', `Great choice! I'll help you book ${hotel.name}. Would you like to proceed with the booking?`);
    };

    function updateBookingSummary() {
        let summaryHtml = '';

        if (currentBooking.status === 'not_started') {
            summaryHtml = `
                <div class="alert alert-info">
                    <p>No booking in progress. Start a conversation to begin!</p>
                </div>
            `;
        } else {
            summaryHtml = `
                <div class="booking-details">
                    ${currentBooking.destination ? `
                        <div class="mb-3">
                            <h6 class="text-muted">Destination</h6>
                            <p class="mb-0">${currentBooking.destination}</p>
                        </div>
                    ` : ''}
                    
                    ${currentBooking.checkIn && currentBooking.checkOut ? `
                        <div class="mb-3">
                            <h6 class="text-muted">Dates</h6>
                            <p class="mb-0">${currentBooking.checkIn} - ${currentBooking.checkOut}</p>
                        </div>
                    ` : ''}
                    
                    ${currentBooking.guests > 0 ? `
                        <div class="mb-3">
                            <h6 class="text-muted">Guests</h6>
                            <p class="mb-0">${currentBooking.guests} person${currentBooking.guests > 1 ? 's' : ''}</p>
                        </div>
                    ` : ''}
                    
                    ${currentBooking.rooms > 0 ? `
                        <div class="mb-3">
                            <h6 class="text-muted">Rooms</h6>
                            <p class="mb-0">${currentBooking.rooms} room${currentBooking.rooms > 1 ? 's' : ''}</p>
                        </div>
                    ` : ''}
                    
                    ${currentBooking.preferences.length > 0 ? `
                        <div class="mb-3">
                            <h6 class="text-muted">Preferences</h6>
                            <ul class="list-unstyled mb-0">
                                ${currentBooking.preferences.map(pref => `<li><i class="fas fa-check text-success me-2"></i>${pref}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${currentBooking.selectedHotel ? `
                        <div class="mb-3">
                            <h6 class="text-muted">Selected Hotel</h6>
                            <div class="card">
                                <div class="card-body p-2">
                                    <h6 class="card-title mb-1">${currentBooking.selectedHotel.name}</h6>
                                    <p class="card-text small mb-1">${currentBooking.selectedHotel.location}</p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span class="badge bg-primary">${currentBooking.selectedHotel.rating} ★</span>
                                        <span class="text-success fw-bold">$${currentBooking.selectedHotel.price}/night</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        bookingSummary.innerHTML = summaryHtml;
    }

    async function processUserMessage(message) {
        try {
            // Send message to backend API
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    bookingState: currentBooking
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get response from AI');
            }
            
            const data = await response.json();
            
            // Hide typing indicator
            hideTypingIndicator();
            
            // Update booking state if needed
            if (data.updateBookingState) {
                currentBooking = data.bookingState;
                updateBookingSummary();
            }
            
            // Add AI response to chat
            addMessageToChat('bot', data.text);
            
            // If we have hotels to show, display them
            if (data.showHotels && data.hotels && data.hotels.length > 0) {
                showHotels(data.hotels);
            }
            
            // If booking is confirmed, show confirmation
            if (currentBooking.status === 'confirmed') {
                showBookingConfirmation();
            }
            
        } catch (error) {
            console.error('Error processing message:', error);
            hideTypingIndicator();
            addMessageToChat('bot', 'Sorry, I encountered an error. Please try again.');
        }
    }

    function showHotels(hotels) {
        // Create HTML for hotel options
        let hotelsHTML = `
            <p>Based on your requirements, I've found these hotels in ${currentBooking.destination}:</p>
            <div class="hotel-options">
        `;
        
        hotels.forEach(hotel => {
            hotelsHTML += `
                <div class="hotel-card card mb-3">
                    <div class="row g-0">
                        <div class="col-md-4">
                            <img src="${hotel.image}" class="img-fluid rounded-start" alt="${hotel.name}">
                        </div>
                        <div class="col-md-8">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start">
                                    <h5 class="card-title">${hotel.name}</h5>
                                    <span class="hotel-rating">${hotel.rating}/5</span>
                                </div>
                                <p class="card-text">${hotel.description}</p>
                                <p class="card-text"><small class="text-muted">Amenities: ${hotel.amenities.join(', ')}</small></p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="hotel-price">${hotel.price} per night</span>
                                    <button class="btn btn-primary select-hotel" data-hotel-id="${hotel.id}">Select</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        hotelsHTML += `</div>`;
        
        // Add hotel options to chat
        addMessageToChat('bot', hotelsHTML, true);
        
        // Add event listeners to select buttons
        setTimeout(() => {
            document.querySelectorAll('.select-hotel').forEach(button => {
                button.addEventListener('click', function() {
                    const hotelId = parseInt(this.getAttribute('data-hotel-id'));
                    selectHotel(hotels.find(h => h.id === hotelId));
                });
            });
        }, 100);
    }

    function selectHotel(hotel) {
        currentBooking.selectedHotel = hotel;
        updateBookingSummary();
        
        // Add confirmation message to chat
        addMessageToChat('bot', `You've selected ${hotel.name}. The total for your stay (${calculateNights()} nights) will be $${calculateTotalPrice()}. Would you like to confirm this booking?`);
        
        // Highlight selected hotel card
        document.querySelectorAll('.hotel-card').forEach(card => {
            const cardHotelId = parseInt(card.querySelector('.select-hotel').getAttribute('data-hotel-id'));
            if (cardHotelId === hotel.id) {
                card.classList.add('selected-hotel');
                card.querySelector('.select-hotel').textContent = 'Selected';
                card.querySelector('.select-hotel').disabled = true;
            } else {
                card.classList.remove('selected-hotel');
            }
        });
    }

    async function confirmBooking() {
        try {
            // Show loading indicator
            addMessageToChat('bot', '<div class="spinner"></div>', true);
            
            // Send confirmation request to backend
            const response = await fetch(`${API_URL}/confirm-booking`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bookingDetails: currentBooking
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to confirm booking');
            }
            
            const confirmation = await response.json();
            
            // Remove loading spinner
            document.querySelector('.spinner').parentNode.parentNode.remove();
            
            // Update booking state
            currentBooking.status = 'confirmed';
            currentBooking.bookingReference = confirmation.bookingReference;
            currentBooking.totalPrice = confirmation.totalPrice;
            updateBookingSummary();
            
            // Show confirmation message
            showBookingConfirmation(confirmation);
            
        } catch (error) {
            console.error('Error confirming booking:', error);
            // Remove loading spinner if it exists
            const spinner = document.querySelector('.spinner');
            if (spinner) {
                spinner.parentNode.parentNode.remove();
            }
            addMessageToChat('bot', 'Sorry, I encountered an error while confirming your booking. Please try again.');
        }
    }

    function showBookingConfirmation(confirmation = null) {
        const bookingRef = confirmation ? confirmation.bookingReference : currentBooking.bookingReference;
        const totalPrice = confirmation ? confirmation.totalPrice : calculateTotalPrice();
        
        const confirmationMessage = `
            <div class="alert alert-success">
                <h5>Booking Confirmed!</h5>
                <p>Your reservation at ${currentBooking.selectedHotel.name} has been confirmed.</p>
                <p>Booking reference: ${bookingRef}</p>
                <p>A confirmation email has been sent to your registered email address.</p>
            </div>
            <p>Thank you for booking with us! Is there anything else I can help you with?</p>
        `;
        
        addMessageToChat('bot', confirmationMessage, true);
    }

    function updateBookingSummary() {
        let summaryHTML = '';
        
        if (currentBooking.status === 'not_started') {
            summaryHTML = `
                <div class="alert alert-info">
                    <p>No booking in progress. Start a conversation to begin!</p>
                </div>
            `;
        } else if (currentBooking.status === 'in_progress') {
            summaryHTML = `<div class="booking-details">`;
            
            if (currentBooking.destination) {
                summaryHTML += `
                    <div class="booking-detail">
                        <span class="booking-label">Destination:</span> ${currentBooking.destination}
                    </div>
                `;
            }
            
            if (currentBooking.checkIn && currentBooking.checkOut) {
                summaryHTML += `
                    <div class="booking-detail">
                        <span class="booking-label">Check-in:</span> ${currentBooking.checkIn}
                    </div>
                    <div class="booking-detail">
                        <span class="booking-label">Check-out:</span> ${currentBooking.checkOut}
                    </div>
                `;
            }
            
            if (currentBooking.guests) {
                summaryHTML += `
                    <div class="booking-detail">
                        <span class="booking-label">Guests:</span> ${currentBooking.guests}
                    </div>
                `;
            }
            
            if (currentBooking.rooms) {
                summaryHTML += `
                    <div class="booking-detail">
                        <span class="booking-label">Rooms:</span> ${currentBooking.rooms}
                    </div>
                `;
            }
            
            if (currentBooking.preferences && currentBooking.preferences.length > 0) {
                summaryHTML += `
                    <div class="booking-detail">
                        <span class="booking-label">Preferences:</span> ${currentBooking.preferences.join(', ')}
                    </div>
                `;
            }
            
            if (currentBooking.selectedHotel) {
                summaryHTML += `
                    <div class="booking-detail">
                        <span class="booking-label">Selected Hotel:</span> ${currentBooking.selectedHotel.name}
                    </div>
                    <div class="booking-detail">
                        <span class="booking-label">Price:</span> ${currentBooking.selectedHotel.price} per night
                    </div>
                    <div class="booking-detail">
                        <span class="booking-label">Total:</span> $${calculateTotalPrice()}
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-booking w-100" id="confirmBookingBtn">Confirm Booking</button>
                    </div>
                `;
                
                // Add event listener to confirm button
                setTimeout(() => {
                    const confirmBtn = document.getElementById('confirmBookingBtn');
                    if (confirmBtn) {
                        confirmBtn.addEventListener('click', confirmBooking);
                    }
                }, 100);
            }
            
            summaryHTML += `</div>`;
        } else if (currentBooking.status === 'confirmed') {
            summaryHTML = `
                <div class="alert alert-success">
                    <h5>Booking Confirmed!</h5>
                    <p>Your reservation at ${currentBooking.selectedHotel.name} has been confirmed.</p>
                    <p>Booking reference: ${currentBooking.bookingReference}</p>
                </div>
                <div class="booking-details">
                    <div class="booking-detail">
                        <span class="booking-label">Destination:</span> ${currentBooking.destination}
                    </div>
                    <div class="booking-detail">
                        <span class="booking-label">Check-in:</span> ${currentBooking.checkIn}
                    </div>
                    <div class="booking-detail">
                        <span class="booking-label">Check-out:</span> ${currentBooking.checkOut}
                    </div>
                    <div class="booking-detail">
                        <span class="booking-label">Guests:</span> ${currentBooking.guests}
                    </div>
                    <div class="booking-detail">
                        <span class="booking-label">Rooms:</span> ${currentBooking.rooms}
                    </div>
                    <div class="booking-detail">
                        <span class="booking-label">Total Price:</span> $${currentBooking.totalPrice || calculateTotalPrice()}
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-outline-primary w-100" id="newBookingBtn">Start New Booking</button>
                    </div>
                </div>
            `;
            
            // Add event listener to new booking button
            setTimeout(() => {
                const newBookingBtn = document.getElementById('newBookingBtn');
                if (newBookingBtn) {
                    newBookingBtn.addEventListener('click', startNewBooking);
                }
            }, 100);
        }
        
        bookingSummary.innerHTML = summaryHTML;
    }

    function startNewBooking() {
        // Reset booking state
        currentBooking = {
            destination: '',
            checkIn: '',
            checkOut: '',
            guests: 0,
            rooms: 0,
            preferences: [],
            selectedHotel: null,
            status: 'not_started'
        };
        
        // Update booking summary
        updateBookingSummary();
        
        // Add message to chat
        addMessageToChat('bot', 'I can help you with a new booking. Where would you like to stay?');
    }

    function calculateNights() {
        // In a real app, you would calculate this from actual dates
        return 3; // Default to 3 nights for demo
    }

    function calculateTotalPrice() {
        // In a real app, you would calculate this from actual prices and dates
        if (!currentBooking.selectedHotel) return 0;
        
        const pricePerNight = parseInt(currentBooking.selectedHotel.price.replace('$', ''));
        return pricePerNight * calculateNights();
    }
});