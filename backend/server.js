// Backend server for Hotel Booking AI Agent

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import services
const bookingApi = require('./api/bookingApi');
const aiService = require('./services/aiService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes

// Route to handle chat messages
app.post('/api/chat', async (req, res) => {
    try {
        const { message, bookingState } = req.body;
        
        // Process the message using the AI service
        const response = await aiService.processMessage(message, bookingState);
        
        // If we need to show hotels, fetch them
        if (response.showHotels) {
            const hotels = await bookingApi.searchHotels({
                destination: response.bookingState.destination,
                checkIn: response.bookingState.checkIn,
                checkOut: response.bookingState.checkOut,
                guests: response.bookingState.guests,
                rooms: response.bookingState.rooms,
                preferences: response.bookingState.preferences
            });
            
            response.hotels = hotels;
        }
        
        res.json(response);
    } catch (error) {
        console.error('Error processing chat message:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// Route to handle hotel search
app.post('/api/search-hotels', async (req, res) => {
    try {
        const { destination, checkIn, checkOut, guests, rooms, preferences } = req.body;
        
        // Search for hotels using the booking API
        const hotels = await bookingApi.searchHotels({
            destination,
            checkIn,
            checkOut,
            guests,
            rooms,
            preferences
        });
        
        res.json({ hotels });
    } catch (error) {
        console.error('Error searching hotels:', error);
        res.status(500).json({ error: 'Failed to search hotels' });
    }
});

// Route to get hotel details
app.get('/api/hotel/:id', async (req, res) => {
    try {
        const hotelId = parseInt(req.params.id);
        const { destination } = req.query;
        
        // Get hotel details using the booking API
        const hotel = await bookingApi.getHotelDetails(hotelId, destination);
        
        if (!hotel) {
            return res.status(404).json({ error: 'Hotel not found' });
        }
        
        res.json({ hotel });
    } catch (error) {
        console.error('Error getting hotel details:', error);
        res.status(500).json({ error: 'Failed to get hotel details' });
    }
});

// Route to handle booking confirmation
app.post('/api/confirm-booking', async (req, res) => {
    try {
        const { bookingDetails } = req.body;
        
        // Confirm booking using the booking API
        const confirmation = await bookingApi.confirmBooking(bookingDetails);
        
        res.json(confirmation);
    } catch (error) {
        console.error('Error confirming booking:', error);
        res.status(500).json({ error: 'Failed to confirm booking' });
    }
});

// Catch-all route to return the main index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});