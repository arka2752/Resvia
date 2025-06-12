// Simulated Booking.com API integration

/**
 * Search for hotels based on user criteria
 * In a production environment, this would call the actual Booking.com API
 */
async function searchHotels(params) {
    const { destination, checkIn, checkOut, guests, rooms, preferences } = params;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock hotel data
    const hotels = [
        {
            id: 1,
            name: 'Grand Hotel ' + destination,
            description: 'Luxury hotel in the heart of ' + destination,
            price: '$199',
            rating: 4.7,
            image: 'https://placehold.co/600x400?text=Grand+Hotel',
            amenities: ['Pool', 'Spa', 'Gym', 'Free WiFi', 'Restaurant']
        },
        {
            id: 2,
            name: destination + ' Plaza Hotel',
            description: 'Modern comfort with stunning city views',
            price: '$149',
            rating: 4.5,
            image: 'https://placehold.co/600x400?text=Plaza+Hotel',
            amenities: ['Free WiFi', 'Gym', 'Restaurant', 'Bar', 'Business Center']
        },
        {
            id: 3,
            name: 'Boutique Hotel ' + destination,
            description: 'Charming boutique hotel with personalized service',
            price: '$179',
            rating: 4.8,
            image: 'https://placehold.co/600x400?text=Boutique+Hotel',
            amenities: ['Free WiFi', 'Breakfast Included', 'Concierge', 'Bar']
        },
        {
            id: 4,
            name: 'Budget Inn ' + destination,
            description: 'Affordable comfort for budget travelers',
            price: '$99',
            rating: 4.0,
            image: 'https://placehold.co/600x400?text=Budget+Inn',
            amenities: ['Free WiFi', 'Breakfast Available', 'Parking']
        },
        {
            id: 5,
            name: 'Luxury Suites ' + destination,
            description: 'Exclusive luxury suites with premium amenities',
            price: '$299',
            rating: 4.9,
            image: 'https://placehold.co/600x400?text=Luxury+Suites',
            amenities: ['Pool', 'Spa', 'Gym', 'Free WiFi', 'Restaurant', 'Bar', 'Concierge', 'Room Service']
        }
    ];
    
    // Filter hotels based on preferences if any
    if (preferences && preferences.length > 0) {
        return hotels.filter(hotel => {
            return preferences.some(pref => {
                return hotel.amenities.some(amenity => 
                    amenity.toLowerCase().includes(pref.toLowerCase()));
            });
        });
    }
    
    return hotels;
}

/**
 * Get hotel details by ID
 */
async function getHotelDetails(hotelId, destination) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock hotel data based on ID
    const hotels = {
        1: {
            id: 1,
            name: 'Grand Hotel ' + destination,
            description: 'Luxury hotel in the heart of ' + destination,
            price: '$199',
            rating: 4.7,
            image: 'https://placehold.co/600x400?text=Grand+Hotel',
            amenities: ['Pool', 'Spa', 'Gym', 'Free WiFi', 'Restaurant'],
            address: '123 Main Street, ' + destination,
            coordinates: { lat: 40.7128, lng: -74.0060 }, // Example coordinates
            rooms: [
                { type: 'Standard', price: '$199', available: true },
                { type: 'Deluxe', price: '$249', available: true },
                { type: 'Suite', price: '$349', available: true }
            ],
            reviews: [
                { user: 'John D.', rating: 5, comment: 'Excellent service and amenities!' },
                { user: 'Sarah M.', rating: 4, comment: 'Great location, comfortable rooms.' },
                { user: 'Robert L.', rating: 5, comment: 'Luxurious experience, will definitely return.' }
            ]
        },
        2: {
            id: 2,
            name: destination + ' Plaza Hotel',
            description: 'Modern comfort with stunning city views',
            price: '$149',
            rating: 4.5,
            image: 'https://placehold.co/600x400?text=Plaza+Hotel',
            amenities: ['Free WiFi', 'Gym', 'Restaurant', 'Bar', 'Business Center'],
            address: '456 Broadway, ' + destination,
            coordinates: { lat: 40.7580, lng: -73.9855 }, // Example coordinates
            rooms: [
                { type: 'Standard', price: '$149', available: true },
                { type: 'Business', price: '$189', available: true },
                { type: 'Executive', price: '$249', available: true }
            ],
            reviews: [
                { user: 'Michael P.', rating: 4, comment: 'Great business hotel with excellent facilities.' },
                { user: 'Emily R.', rating: 5, comment: 'Amazing views and friendly staff.' },
                { user: 'David K.', rating: 4, comment: 'Comfortable rooms and good location.' }
            ]
        },
        3: {
            id: 3,
            name: 'Boutique Hotel ' + destination,
            description: 'Charming boutique hotel with personalized service',
            price: '$179',
            rating: 4.8,
            image: 'https://placehold.co/600x400?text=Boutique+Hotel',
            amenities: ['Free WiFi', 'Breakfast Included', 'Concierge', 'Bar'],
            address: '789 Park Avenue, ' + destination,
            coordinates: { lat: 40.7736, lng: -73.9566 }, // Example coordinates
            rooms: [
                { type: 'Classic', price: '$179', available: true },
                { type: 'Deluxe', price: '$219', available: true },
                { type: 'Junior Suite', price: '$279', available: true }
            ],
            reviews: [
                { user: 'Jessica T.', rating: 5, comment: 'Charming hotel with incredible attention to detail.' },
                { user: 'Thomas B.', rating: 5, comment: 'Personalized service made our stay special.' },
                { user: 'Laura M.', rating: 4, comment: 'Beautiful decor and excellent breakfast.' }
            ]
        },
        4: {
            id: 4,
            name: 'Budget Inn ' + destination,
            description: 'Affordable comfort for budget travelers',
            price: '$99',
            rating: 4.0,
            image: 'https://placehold.co/600x400?text=Budget+Inn',
            amenities: ['Free WiFi', 'Breakfast Available', 'Parking'],
            address: '101 Budget Street, ' + destination,
            coordinates: { lat: 40.7305, lng: -73.9352 }, // Example coordinates
            rooms: [
                { type: 'Standard', price: '$99', available: true },
                { type: 'Double', price: '$119', available: true },
                { type: 'Family', price: '$149', available: true }
            ],
            reviews: [
                { user: 'Mark S.', rating: 4, comment: 'Great value for money.' },
                { user: 'Anna P.', rating: 3, comment: 'Basic but clean and comfortable.' },
                { user: 'Kevin R.', rating: 4, comment: 'Friendly staff and good location for the price.' }
            ]
        },
        5: {
            id: 5,
            name: 'Luxury Suites ' + destination,
            description: 'Exclusive luxury suites with premium amenities',
            price: '$299',
            rating: 4.9,
            image: 'https://placehold.co/600x400?text=Luxury+Suites',
            amenities: ['Pool', 'Spa', 'Gym', 'Free WiFi', 'Restaurant', 'Bar', 'Concierge', 'Room Service'],
            address: '555 Luxury Avenue, ' + destination,
            coordinates: { lat: 40.7629, lng: -73.9712 }, // Example coordinates
            rooms: [
                { type: 'Junior Suite', price: '$299', available: true },
                { type: 'Executive Suite', price: '$399', available: true },
                { type: 'Presidential Suite', price: '$599', available: true }
            ],
            reviews: [
                { user: 'William J.', rating: 5, comment: 'Absolutely stunning property with impeccable service.' },
                { user: 'Catherine D.', rating: 5, comment: 'The epitome of luxury. Worth every penny.' },
                { user: 'Richard M.', rating: 5, comment: 'Exceptional experience from start to finish.' }
            ]
        }
    };
    
    return hotels[hotelId] || null;
}

/**
 * Confirm a booking
 */
async function confirmBooking(bookingDetails) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Generate a random booking reference
    const bookingReference = 'BOK' + Math.floor(Math.random() * 1000000);
    
    // Calculate total price
    const pricePerNight = parseInt(bookingDetails.selectedHotel.price.replace('$', ''));
    const nights = calculateNights(bookingDetails.checkIn, bookingDetails.checkOut);
    const totalPrice = pricePerNight * nights;
    
    // Return confirmation details
    return {
        success: true,
        bookingReference,
        hotel: bookingDetails.selectedHotel,
        checkIn: bookingDetails.checkIn,
        checkOut: bookingDetails.checkOut,
        guests: bookingDetails.guests,
        rooms: bookingDetails.rooms,
        totalPrice,
        confirmationDate: new Date().toISOString(),
        paymentStatus: 'Confirmed',
        cancellationPolicy: 'Free cancellation until 24 hours before check-in'
    };
}

/**
 * Calculate number of nights between check-in and check-out
 */
function calculateNights(checkIn, checkOut) {
    // In a real app, you would parse the dates and calculate the difference
    // For demo purposes, return a fixed value
    return 3;
}

module.exports = {
    searchHotels,
    getHotelDetails,
    confirmBooking
};