// AI Service for Natural Language Processing and Conversation

/**
 * Process a user message and generate a response
 * In a production environment, this would call an actual AI service like OpenAI
 */
async function processMessage(message, bookingState) {
    // Default response
    let response = {
        text: "I'm here to help you book a hotel. Can you tell me where you'd like to stay?",
        updateBookingState: false,
        bookingState: bookingState,
        showHotels: false,
        hotels: []
    };
    
    // Simple keyword-based response logic
    const messageLower = message.toLowerCase();
    
    // Check for destination
    if (messageLower.includes('looking for') || 
        messageLower.includes('want to stay') || 
        messageLower.includes('hotel in')) {
        
        // Extract potential destination
        const destination = extractDestination(message);
        if (destination) {
            response.text = `Great! I'll help you find hotels in ${destination}. When are you planning to check in and check out?`;
            response.updateBookingState = true;
            response.bookingState = {
                ...bookingState,
                destination: destination,
                status: 'in_progress'
            };
        }
    }
    // Check for dates
    else if (messageLower.includes('check in') || 
             messageLower.includes('stay from') || 
             messageLower.includes('arrive on')) {
        
        // Extract potential dates
        const dates = extractDates(message);
        if (dates.checkIn && dates.checkOut) {
            response.text = `I've noted your stay from ${dates.checkIn} to ${dates.checkOut}. How many guests and rooms do you need?`;
            response.updateBookingState = true;
            response.bookingState = {
                ...bookingState,
                checkIn: dates.checkIn,
                checkOut: dates.checkOut
            };
        }
    }
    // Check for guests/rooms
    else if (messageLower.includes('guest') || 
             messageLower.includes('people') || 
             messageLower.includes('room')) {
        
        // Extract guest and room info
        const accommodationInfo = extractAccommodationInfo(message);
        if (accommodationInfo.guests) {
            response.updateBookingState = true;
            response.bookingState = {
                ...bookingState,
                guests: accommodationInfo.guests,
                rooms: accommodationInfo.rooms || 1
            };
            
            // If we have enough info, indicate we should show hotel options
            if (bookingState.destination && bookingState.checkIn && bookingState.checkOut) {
                response.text = `Great! Let me find some hotels in ${bookingState.destination} for ${accommodationInfo.guests} guests.`;
                response.showHotels = true;
            } else {
                response.text = `Thanks for the information. I still need to know `;
                if (!bookingState.destination) response.text += `your destination, `;
                if (!bookingState.checkIn) response.text += `your check-in and check-out dates, `;
                response.text = response.text.slice(0, -2) + '.'; // Remove trailing comma
            }
        }
    }
    // Check for preferences
    else if (messageLower.includes('prefer') || 
             messageLower.includes('looking for') || 
             messageLower.includes('want')) {
        
        // Extract preferences
        const preferences = extractPreferences(message);
        if (preferences.length > 0) {
            response.text = `I've noted your preferences for ${preferences.join(', ')}. `;
            response.updateBookingState = true;
            response.bookingState = {
                ...bookingState,
                preferences: [...(bookingState.preferences || []), ...preferences]
            };
            
            // If we have enough info, indicate we should show hotel options
            if (bookingState.destination && bookingState.checkIn && bookingState.checkOut && bookingState.guests) {
                response.text += `Let me find some suitable hotels for you.`;
                response.showHotels = true;
            } else {
                response.text += `I still need to know `;
                if (!bookingState.destination) response.text += `your destination, `;
                if (!bookingState.checkIn) response.text += `your check-in and check-out dates, `;
                if (!bookingState.guests) response.text += `the number of guests and rooms, `;
                response.text = response.text.slice(0, -2) + '.'; // Remove trailing comma
            }
        }
    }
    // Check for booking confirmation
    else if (messageLower.includes('book') || 
             messageLower.includes('confirm') || 
             messageLower.includes('reserve')) {
        
        if (bookingState.selectedHotel) {
            response.text = `I'll process your booking at ${bookingState.selectedHotel.name}. Please confirm this is correct.`;
            response.updateBookingState = true;
            response.bookingState = {
                ...bookingState,
                confirmationRequested: true
            };
        } else {
            response.text = `I don't have enough information to make a booking yet. Can you tell me where you'd like to stay?`;
        }
    }
    // Check for confirmation
    else if (messageLower.includes('yes') || 
             messageLower.includes('correct') || 
             messageLower.includes('confirm')) {
        
        if (bookingState.confirmationRequested) {
            response.text = `Great! I'm processing your booking now.`;
            response.updateBookingState = true;
            response.bookingState = {
                ...bookingState,
                status: 'confirming'
            };
        }
    }
    // Check for cancellation
    else if (messageLower.includes('cancel') || 
             messageLower.includes('no') || 
             messageLower.includes('stop')) {
        
        if (bookingState.confirmationRequested) {
            response.text = `I've cancelled the booking process. Is there anything else you'd like to search for?`;
            response.updateBookingState = true;
            response.bookingState = {
                ...bookingState,
                confirmationRequested: false
            };
        } else if (bookingState.status === 'in_progress') {
            response.text = `I've reset your search. What kind of hotel are you looking for?`;
            response.updateBookingState = true;
            response.bookingState = {
                status: 'not_started'
            };
        } else {
            response.text = `I'm here to help you book a hotel. Just let me know what you're looking for.`;
        }
    }
    // Handle greetings
    else if (messageLower.includes('hello') || 
             messageLower.includes('hi') || 
             messageLower.includes('hey')) {
        
        response.text = `Hello! I'm your AI booking assistant. I can help you find and book the perfect hotel on Booking.com. What kind of accommodation are you looking for?`;
    }
    // Handle thank you
    else if (messageLower.includes('thank') || 
             messageLower.includes('thanks')) {
        
        response.text = `You're welcome! I'm happy to help with your hotel booking needs. Is there anything else you'd like assistance with?`;
    }
    // Handle goodbye
    else if (messageLower.includes('bye') || 
             messageLower.includes('goodbye')) {
        
        response.text = `Goodbye! Feel free to come back anytime you need help with hotel bookings.`;
    }
    
    return response;
}

/**
 * Extract destination from user message
 */
function extractDestination(message) {
    // This is a simplified extraction - in a real app, you'd use NLP
    const destinations = [
        'New York', 'Paris', 'London', 'Tokyo', 'Sydney', 'Rome', 'Barcelona',
        'Amsterdam', 'Berlin', 'Dubai', 'Singapore', 'Hong Kong', 'Los Angeles',
        'San Francisco', 'Chicago', 'Miami', 'Las Vegas', 'Toronto', 'Vancouver'
    ];
    
    for (const city of destinations) {
        if (message.toLowerCase().includes(city.toLowerCase())) {
            return city;
        }
    }
    
    return null;
}

/**
 * Extract dates from user message
 */
function extractDates(message) {
    // This is a simplified extraction - in a real app, you'd use NLP and date parsing
    const result = {
        checkIn: null,
        checkOut: null
    };
    
    // For demo purposes, just set some dates
    const today = new Date();
    const checkIn = new Date(today);
    checkIn.setDate(today.getDate() + 7); // One week from today
    
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkIn.getDate() + 3); // 3 days stay
    
    result.checkIn = checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    result.checkOut = checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return result;
}

/**
 * Extract accommodation info from user message
 */
function extractAccommodationInfo(message) {
    // This is a simplified extraction - in a real app, you'd use NLP
    const result = {
        guests: null,
        rooms: null
    };
    
    // Look for numbers in the message
    const numbers = message.match(/\d+/g);
    if (numbers && numbers.length > 0) {
        // Assume first number is guests, second is rooms
        result.guests = parseInt(numbers[0]);
        if (numbers.length > 1) {
            result.rooms = parseInt(numbers[1]);
        } else {
            // Default to 1 room if not specified
            result.rooms = 1;
        }
    }
    
    return result;
}

/**
 * Extract preferences from user message
 */
function extractPreferences(message) {
    // This is a simplified extraction - in a real app, you'd use NLP
    const preferences = [];
    const possiblePreferences = [
        'pool', 'spa', 'gym', 'breakfast', 'wifi', 'parking',
        'pet friendly', 'beach', 'city center', 'airport shuttle',
        'luxury', 'budget', 'family friendly', 'business'
    ];
    
    for (const pref of possiblePreferences) {
        if (message.toLowerCase().includes(pref.toLowerCase())) {
            preferences.push(pref);
        }
    }
    
    return preferences;
}

module.exports = {
    processMessage
};