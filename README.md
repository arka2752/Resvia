# Hotel Booking AI Agent

An AI-powered agent for booking hotels on Booking.com, deployed on Vercel.

## Project Overview

This project is an AI agent that helps users book hotels on Booking.com. It features a conversational interface where users can specify their preferences, search for hotels, and complete bookings.

### Features

- Conversational AI interface for hotel bookings
- Hotel search based on user preferences
- Booking confirmation and management
- Responsive design for all devices

## Project Structure

```
/
├── frontend/               # Frontend code
│   ├── index.html          # Main HTML file
│   ├── css/                # CSS styles
│   │   └── style.css       # Main stylesheet
│   └── js/                 # JavaScript files
│       └── script.js       # Main JavaScript file
│
└── backend/                # Backend code
    ├── server.js           # Express server
    ├── package.json        # Node.js dependencies
    └── .env                # Environment variables
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd hotel-booking-ai-agent
```

2. Install backend dependencies

```bash
cd backend
npm install
```

3. Set up environment variables

Create a `.env` file in the backend directory with the following variables:

```
PORT=3000
NODE_ENV=development
```

### Running the Application

1. Start the backend server

```bash
cd backend
npm start
```

2. Open the frontend

Open `frontend/index.html` in your browser, or serve it using a static file server.

## Deployment

### Deploying to Vercel

1. Create a Vercel account if you don't have one
2. Install the Vercel CLI: `npm install -g vercel`
3. Run `vercel` from the project root
4. Follow the prompts to deploy your application

## Development

### Frontend

The frontend is built with HTML, CSS, and JavaScript, using Bootstrap for styling.

### Backend

The backend is built with Node.js and Express, providing API endpoints for the frontend to communicate with.

## License

This project is licensed under the MIT License - see the LICENSE file for details.