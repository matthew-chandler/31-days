#!/bin/bash

echo "🚀 Starting League of Legends Last Game Tracker Backend"
echo "=================================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found! Please create a .env file with your RIOT_API_KEY."
    echo "Example:"
    echo "RIOT_API_KEY=your_api_key_here"
    exit 1
fi

# Start the Flask server
echo "🎮 Starting Flask server..."
echo "Backend will be available at: http://localhost:5000"
echo "Open index.html in your browser to use the application"
echo "Press Ctrl+C to stop the server"
echo ""

python3 app.py
