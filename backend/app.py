from flask import Flask, request, jsonify
from flask_cors import CORS
from amadeus import Client, ResponseError
from openai import OpenAI
from dotenv import load_dotenv
import os
import json
import logging
import re
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Debug logging for environment variables
logger.debug("Environment variables:")
logger.debug(f"AMADEUS_API_KEY exists: {bool(os.getenv('AMADEUS_API_KEY'))}")
logger.debug(f"AMADEUS_API_SECRET exists: {bool(os.getenv('AMADEUS_API_SECRET'))}")
logger.debug(f"OPENAI_API_KEY exists: {bool(os.getenv('OPENAI_API_KEY'))}")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Check if API credentials are available
amadeus_api_key = os.getenv('AMADEUS_API_KEY')
amadeus_api_secret = os.getenv('AMADEUS_API_SECRET')
openai_api_key = os.getenv('OPENAI_API_KEY')

if not amadeus_api_key or not amadeus_api_secret:
    raise ValueError("Amadeus API credentials not found. Please check your .env file.")

if not openai_api_key:
    raise ValueError("OpenAI API key not found. Please check your .env file.")

# Initialize Amadeus client
amadeus = Client(
    client_id=amadeus_api_key,
    client_secret=amadeus_api_secret
)

# Initialize OpenAI client (using your existing setup)
openai_client = OpenAI(
    base_url="https://api.novita.ai/v3/openai",
    api_key=openai_api_key,
)

class TravelIntentExtractor:
    """Extract travel intent and parameters from natural language"""
    
    @staticmethod
    def extract_travel_intent(user_message: str) -> Dict[str, Any]:
        system_prompt = f"""You are a travel assistant that extracts structured information from user queries. 
        Analyze the user's message and extract travel-related information in JSON format.
        
        Return ONLY a valid JSON object with these possible fields:
        - 'intent': 'flight_search', 'hotel_search', 'general_travel', 'greeting', 'help'
        - 'origin': airport code or city name (for flights)
        - 'destination': airport code or city name  
        - 'departure_date': YYYY-MM-DD format
        - 'return_date': YYYY-MM-DD format (if mentioned)
        - 'check_in': YYYY-MM-DD format (for hotels)
        - 'check_out': YYYY-MM-DD format (for hotels)
        - 'adults': number of adults (default 1)
        - 'confidence': confidence level (0.0-1.0)
        - 'missing_info': list of missing required information
        
        If dates are relative (like 'tomorrow', 'next week'), convert to actual dates.
        Today's date is {datetime.now().strftime('%Y-%m-%d')}
        
        Respond with ONLY a valid JSON object, no extra text, no markdown, no explanation.
        """
        intent_json = None
        try:
            response = openai_client.chat.completions.create(
                model="deepseek/deepseek-r1-0528",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=1000,
                temperature=0.1
            )
            intent_json = response.choices[0].message.content.strip()
            # Remove any markdown formatting
            intent_json = re.sub(r'```json\n?', '', intent_json)
            intent_json = re.sub(r'```\n?', '', intent_json)
            logger.debug(f"AI intent extraction raw output: {intent_json}")
            return json.loads(intent_json)
        except Exception as e:
            logger.error(f"Error extracting intent: {e}")
            if intent_json is not None:
                logger.error(f"Raw AI output: {intent_json}")
            return {
                "intent": "general_travel",
                "confidence": 0.0,
                "error": f"Intent extraction failed: {str(e)}"
            }

class AIResponseGenerator:
    """Generate intelligent responses using AI"""
    
    @staticmethod
    def generate_contextual_response(
        user_message: str, 
        intent_data: Dict[str, Any], 
        api_data: Optional[Dict[str, Any]] = None,
        stream: bool = False
    ) -> str:
        """Generate contextual response based on user message and available data"""
        
        # Create context for the AI
        context_parts = [f"User message: {user_message}"]
        
        if intent_data:
            context_parts.append(f"Extracted intent: {json.dumps(intent_data, indent=2)}")
        
        if api_data:
            context_parts.append(f"API response data: {json.dumps(api_data, indent=2)}")
        
        context = "\n".join(context_parts)
        
        system_prompt = f"""You are a helpful and knowledgeable travel assistant. Respond naturally and conversationally to the user's travel query.
        
        Guidelines:
        1. Be friendly, helpful, and professional
        2. If you have API data with flights/hotels, summarize the key information naturally
        3. If information is missing, politely ask for clarification
        4. Provide helpful travel tips when relevant
        5. Keep responses concise but informative
        6. If there are errors or no results, offer alternatives or suggestions
        
        Context: {context}
        
        Respond as a helpful travel assistant would."""
        
        try:
            response = openai_client.chat.completions.create(
                model="deepseek/deepseek-r1-0528",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=1500,
                temperature=0.7,
                stream=stream
            )
            
            if stream:
                return response  # Return the streaming response object
            else:
                return response.choices[0].message.content.strip()
                
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            return f"I apologize, but I'm having trouble processing your request right now. Please try again or contact support if the issue persists."

def process_chat_message_with_ai(message: str) -> Dict[str, Any]:
    """Enhanced chat processing with AI integration"""
    logger.debug(f"Processing message with AI: {message}")
    
    # Extract intent using AI
    intent_data = TravelIntentExtractor.extract_travel_intent(message)
    logger.debug(f"Extracted intent: {intent_data}")
    
    # Handle different intents
    intent = intent_data.get('intent', 'general_travel')
    
    if intent == 'greeting':
        return {
            'type': 'greeting',
            'message': AIResponseGenerator.generate_contextual_response(message, intent_data),
            'intent_data': intent_data
        }
    
    elif intent == 'help':
        return {
            'type': 'help',
            'message': AIResponseGenerator.generate_contextual_response(message, intent_data),
            'intent_data': intent_data
        }
    
    elif intent == 'flight_search':
        # Check if we have enough information for flight search
        missing_info = []
        if not intent_data.get('origin'):
            missing_info.append('departure city/airport')
        if not intent_data.get('destination'):
            missing_info.append('destination city/airport')
        if not intent_data.get('departure_date'):
            missing_info.append('departure date')
        
        if missing_info:
            intent_data['missing_info'] = missing_info
            return {
                'type': 'flight_search_incomplete',
                'message': AIResponseGenerator.generate_contextual_response(message, intent_data),
                'intent_data': intent_data,
                'missing_info': missing_info
            }
        else:
            # All info present: fetch flights from Amadeus
            try:
                amadeus_response = amadeus.shopping.flight_offers_search.get(
                    originLocationCode=intent_data['origin'],
                    destinationLocationCode=intent_data['destination'],
                    departureDate=intent_data['departure_date'],
                    adults=intent_data.get('adults', 1),
                    returnDate=intent_data.get('return_date'),
                    currencyCode='USD'
                )
                flight_data = amadeus_response.data
                ai_summary = AIResponseGenerator.generate_contextual_response(
                    message, intent_data, {'flights': flight_data[:3]}
                )
                return {
                    'type': 'flight_search_results',
                    'message': ai_summary,
                    'flights': flight_data,
                    'intent_data': intent_data,
                    'search_params': {
                        'origin': intent_data['origin'],
                        'destination': intent_data['destination'],
                        'departureDate': intent_data['departure_date'],
                        'returnDate': intent_data.get('return_date'),
                        'adults': intent_data.get('adults', 1)
                    }
                }
            except ResponseError as error:
                return {
                    'type': 'flight_search_error',
                    'message': f"Sorry, I couldn't fetch flights: {error}",
                    'intent_data': intent_data
                }
    
    elif intent == 'hotel_search':
        # Check if we have enough information for hotel search
        missing_info = []
        if not intent_data.get('destination'):
            missing_info.append('destination city')
        if not intent_data.get('check_in'):
            missing_info.append('check-in date')
        if not intent_data.get('check_out'):
            missing_info.append('check-out date')
        
        if missing_info:
            intent_data['missing_info'] = missing_info
            return {
                'type': 'hotel_search_incomplete',
                'message': AIResponseGenerator.generate_contextual_response(message, intent_data),
                'intent_data': intent_data,
                'missing_info': missing_info
            }
        else:
            return {
                'type': 'hotel_search_ready',
                'message': AIResponseGenerator.generate_contextual_response(message, intent_data),
                'intent_data': intent_data,
                'search_params': {
                    'cityCode': intent_data['destination'],
                    'checkIn': intent_data['check_in'],
                    'checkOut': intent_data['check_out'],
                    'adults': intent_data.get('adults', 1)
                }
            }
    
    else:
        # General travel query
        return {
            'type': 'general_travel',
            'message': AIResponseGenerator.generate_contextual_response(message, intent_data),
            'intent_data': intent_data
        }

# Enhanced chat endpoint with AI
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        logger.debug("Received chat request")
        data = request.json
        logger.debug(f"Request data: {data}")
        
        if not data or 'message' not in data:
            logger.error("No message provided in request")
            return jsonify({'error': 'No message provided'}), 400

        # Use AI-powered chat processing
        response = process_chat_message_with_ai(data['message'])
        logger.debug(f"Sending AI response: {response}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

# New endpoint for streaming chat responses
@app.route('/api/chat/stream', methods=['POST'])
def chat_stream():
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400

        # Extract intent
        intent_data = TravelIntentExtractor.extract_travel_intent(data['message'])
        
        # Generate streaming response
        def generate():
            try:
                response_stream = AIResponseGenerator.generate_contextual_response(
                    data['message'], 
                    intent_data, 
                    stream=True
                )
                
                for chunk in response_stream:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        yield f"data: {json.dumps({'content': content})}\n\n"
                
                yield f"data: {json.dumps({'done': True, 'intent_data': intent_data})}\n\n"
                
            except Exception as e:
                logger.error(f"Error in streaming: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return app.response_class(
            generate(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            }
        )
        
    except Exception as e:
        logger.error(f"Error in chat stream endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Enhanced flight search with AI response
@app.route('/api/flights/search', methods=['POST'])
def search_flights():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Check if this is an AI-assisted search
        user_message = data.get('user_message', '')
        
        required_fields = ['origin', 'destination', 'departureDate']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        # Search flights using Amadeus
        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode=data['origin'],
            destinationLocationCode=data['destination'],
            departureDate=data['departureDate'],
            adults=data.get('adults', 1),
            returnDate=data.get('returnDate'),
            currencyCode=data.get('currency', 'USD')
        )
        
        flight_data = response.data
        
        # If we have a user message, generate an AI response about the results
        ai_response = None
        if user_message:
            ai_response = AIResponseGenerator.generate_contextual_response(
                user_message, 
                {'intent': 'flight_search'}, 
                {'flights': flight_data[:3]}  # Send only top 3 results to AI
            )
        
        return jsonify({
            'flights': flight_data,
            'ai_response': ai_response,
            'search_params': data
        })
        
    except ResponseError as error:
        error_message = str(error)
        ai_response = AIResponseGenerator.generate_contextual_response(
            data.get('user_message', ''), 
            {'intent': 'flight_search'}, 
            {'error': error_message}
        )
        return jsonify({
            'error': error_message, 
            'ai_response': ai_response
        }), 400
        
    except Exception as e:
        logger.error(f"Unexpected error in flight search: {str(e)}")
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

# Enhanced hotel search with AI response
@app.route('/api/hotels/search', methods=['POST'])
def search_hotels():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        user_message = data.get('user_message', '')
        
        required_fields = ['cityCode', 'checkIn', 'checkOut']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        # Search hotels using Amadeus
        response = amadeus.shopping.hotel_offers.get(
            cityCode=data['cityCode'],
            checkInDate=data['checkIn'],
            checkOutDate=data['checkOut'],
            adults=data.get('adults', 1),
            radius=data.get('radius', 5),
            radiusUnit=data.get('radiusUnit', 'KM'),
            currency=data.get('currency', 'USD')
        )
        
        hotel_data = response.data
        
        # Generate AI response about the results
        ai_response = None
        if user_message:
            ai_response = AIResponseGenerator.generate_contextual_response(
                user_message, 
                {'intent': 'hotel_search'}, 
                {'hotels': hotel_data[:3]}  # Send only top 3 results to AI
            )
        
        return jsonify({
            'hotels': hotel_data,
            'ai_response': ai_response,
            'search_params': data
        })
        
    except ResponseError as error:
        error_message = str(error)
        ai_response = AIResponseGenerator.generate_contextual_response(
            data.get('user_message', ''), 
            {'intent': 'hotel_search'}, 
            {'error': error_message}
        )
        return jsonify({
            'error': error_message,
            'ai_response': ai_response
        }), 400
        
    except Exception as e:
        logger.error(f"Unexpected error in hotel search: {str(e)}")
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

# New endpoint for AI-powered automatic search
@app.route('/api/ai-search', methods=['POST'])
def ai_search():
    """Automatically determine search type and execute based on user message"""
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400
        
        user_message = data['message']
        
        # Extract intent and parameters
        intent_data = TravelIntentExtractor.extract_travel_intent(user_message)
        
        if intent_data.get('intent') == 'flight_search':
            # Check if we have enough info for flight search
            if (intent_data.get('origin') and 
                intent_data.get('destination') and 
                intent_data.get('departure_date')):
                
                # Execute flight search
                search_params = {
                    'origin': intent_data['origin'],
                    'destination': intent_data['destination'],
                    'departureDate': intent_data['departure_date'],
                    'adults': intent_data.get('adults', 1),
                    'user_message': user_message
                }
                
                if intent_data.get('return_date'):
                    search_params['returnDate'] = intent_data['return_date']
                
                # Use the existing flight search endpoint
                return search_flights_internal(search_params)
            
        elif intent_data.get('intent') == 'hotel_search':
            # Check if we have enough info for hotel search
            if (intent_data.get('destination') and 
                intent_data.get('check_in') and 
                intent_data.get('check_out')):
                
                # Execute hotel search
                search_params = {
                    'cityCode': intent_data['destination'],
                    'checkIn': intent_data['check_in'],
                    'checkOut': intent_data['check_out'],
                    'adults': intent_data.get('adults', 1),
                    'user_message': user_message
                }
                
                # Use the existing hotel search endpoint
                return search_hotels_internal(search_params)
        
        # If we can't execute a search, return the intent analysis
        ai_response = AIResponseGenerator.generate_contextual_response(
            user_message, intent_data
        )
        
        return jsonify({
            'type': 'analysis',
            'intent_data': intent_data,
            'ai_response': ai_response,
            'can_search': False
        })
        
    except Exception as e:
        logger.error(f"Error in AI search: {str(e)}")
        return jsonify({'error': str(e)}), 500

def search_flights_internal(params):
    """Internal flight search function"""
    try:
        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode=params['origin'],
            destinationLocationCode=params['destination'],
            departureDate=params['departureDate'],
            adults=params.get('adults', 1),
            returnDate=params.get('returnDate'),
            currencyCode='USD'
        )
        
        flight_data = response.data
        ai_response = AIResponseGenerator.generate_contextual_response(
            params.get('user_message', ''), 
            {'intent': 'flight_search'}, 
            {'flights': flight_data[:3]}
        )
        
        return jsonify({
            'type': 'flight_results',
            'flights': flight_data,
            'ai_response': ai_response,
            'search_params': params
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

def search_hotels_internal(params):
    """Internal hotel search function"""
    try:
        response = amadeus.shopping.hotel_offers.get(
            cityCode=params['cityCode'],
            checkInDate=params['checkIn'],
            checkOutDate=params['checkOut'],
            adults=params.get('adults', 1),
            radius=5,
            radiusUnit='KM',
            currency='USD'
        )
        
        hotel_data = response.data
        ai_response = AIResponseGenerator.generate_contextual_response(
            params.get('user_message', ''), 
            {'intent': 'hotel_search'}, 
            {'hotels': hotel_data[:3]}
        )
        
        return jsonify({
            'type': 'hotel_results',
            'hotels': hotel_data,
            'ai_response': ai_response,
            'search_params': params
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Keep your existing endpoints
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

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        if not data:
            logger.error("No data provided for registration")
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['email', 'password', 'firstName', 'lastName']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            logger.error(f"Missing required fields for registration: {', '.join(missing_fields)}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        user_data = {
            'name': f"{data['firstName']} {data['lastName']}",
            'email': data['email'],
            'memberSince': 'Today'
        }
        
        logger.debug(f"User registered: {user_data['email']}")
        return jsonify({
            'status': 'success',
            'message': 'Account created successfully!',
            'user': user_data
        }), 201
    except Exception as e:
        logger.error(f"Error in register endpoint: {str(e)}")
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        if not data:
            logger.error("No data provided for login")
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['email', 'password']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            logger.error(f"Missing required fields for login: {', '.join(missing_fields)}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        user_email = data['email']
        user_data = {
            'name': user_email.split('@')[0].replace('.', ' ').title(),
            'email': user_email,
            'memberSince': 'Today',
            'isLoggedIn': True
        }
        logger.debug(f"User logged in (simulated): {user_data['email']}")
        return jsonify({
            'status': 'success',
            'message': 'Logged in successfully!',
            'user': user_data
        })
    except Exception as e:
        logger.error(f"Error in login endpoint: {str(e)}")
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'amadeus_connected': bool(amadeus),
        'openai_connected': bool(openai_client)
    })

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({
        'status': 'ok',
        'message': 'AI-Enhanced Backend is working!',
        'features': ['Amadeus API', 'OpenAI Integration', 'Natural Language Processing']
    })

@app.route('/')
def home():
    return "AI-Enhanced Travel Backend is running!"

if __name__ == '__main__':
    app.run(debug=True) 