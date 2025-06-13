from flask import Flask, request, jsonify
from flask_cors import CORS
from amadeus import Client, ResponseError
from dotenv import load_dotenv
import os
import json
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Check if API credentials are available
api_key = os.getenv('AMADEUS_API_KEY')
api_secret = os.getenv('AMADEUS_API_SECRET')

if not api_key or not api_secret:
    raise ValueError("Amadeus API credentials not found. Please check your .env file.")

# Initialize Amadeus client
amadeus = Client(
    client_id=api_key,
    client_secret=api_secret
)

def process_chat_message(message):
    """Process user message and generate appropriate response"""
    logger.debug(f"Processing message: {message}")
    message = message.lower()
    
    # Flight-related keywords
    flight_keywords = ['flight', 'fly', 'airplane', 'airline', 'ticket', 'book a flight']
    # Hotel-related keywords
    hotel_keywords = ['hotel', 'stay', 'accommodation', 'room', 'book']
    
    if any(keyword in message for keyword in flight_keywords):
        logger.debug("Flight keywords detected")
        return {
            'type': 'flight',
            'message': "I can help you search for flights. Please use the flight search form on the right. You'll need to provide:\n- Origin airport code (e.g., JFK)\n- Destination airport code (e.g., LAX)\n- Departure date\n- Return date (optional)"
        }
    elif any(keyword in message for keyword in hotel_keywords):
        logger.debug("Hotel keywords detected")
        return {
            'type': 'hotel',
            'message': "I can help you find hotels. Please use the hotel search form on the right. You'll need to provide:\n- City code (e.g., NYC)\n- Check-in date\n- Check-out date"
        }
    elif 'hello' in message or 'hi' in message:
        logger.debug("Greeting detected")
        return {
            'type': 'greeting',
            'message': "Hello! I'm your travel assistant. I can help you book flights and hotels. What would you like to do today?"
        }
    elif 'help' in message:
        logger.debug("Help request detected")
        return {
            'type': 'help',
            'message': "I can help you with:\n1. Searching for flights\n2. Finding hotels\n3. Getting travel information\n\nJust let me know what you're looking for!"
        }
    else:
        logger.debug("No specific keywords detected")
        return {
            'type': 'general',
            'message': "I'm here to help with your travel plans. You can ask me about flights or hotels, or use the search forms on the right to find specific options."
        }

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        logger.debug("Received chat request")
        data = request.json
        logger.debug(f"Request data: {data}")
        
        if not data or 'message' not in data:
            logger.error("No message provided in request")
            return jsonify({'error': 'No message provided'}), 400

        response = process_chat_message(data['message'])
        logger.debug(f"Sending response: {response}")
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/flights/search', methods=['POST'])
def search_flights():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        required_fields = ['origin', 'destination', 'departureDate']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode=data['origin'],
            destinationLocationCode=data['destination'],
            departureDate=data['departureDate'],
            adults=data.get('adults', 1),
            returnDate=data.get('returnDate'),
            currencyCode=data.get('currency', 'USD')
        )
        return jsonify(response.data)
    except ResponseError as error:
        return jsonify({'error': str(error)}), 400
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/hotels/search', methods=['POST'])
def search_hotels():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        required_fields = ['cityCode', 'checkIn', 'checkOut']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        response = amadeus.shopping.hotel_offers.get(
            cityCode=data['cityCode'],
            checkInDate=data['checkIn'],
            checkOutDate=data['checkOut'],
            adults=data.get('adults', 1),
            radius=data.get('radius', 5),
            radiusUnit=data.get('radiusUnit', 'KM'),
            currency=data.get('currency', 'USD')
        )
        return jsonify(response.data)
    except ResponseError as error:
        return jsonify({'error': str(error)}), 400
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/hotels/offers', methods=['GET'])
def get_hotel_offers():
    try:
        hotel_id = request.args.get('hotelId')
        if not hotel_id:
            return jsonify({'error': 'Hotel ID is required'}), 400

        response = amadeus.shopping.hotel_offers_by_hotel.get(
            hotelId=hotel_id
        )
        return jsonify(response.data)
    except ResponseError as error:
        return jsonify({'error': str(error)}), 400
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

# Add a health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'amadeus_connected': bool(amadeus)
    })

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({
        'status': 'ok',
        'message': 'Backend is working!'
    })

if __name__ == '__main__':
    app.run(debug=True) 