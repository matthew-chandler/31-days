# League of Legends Last Game Tracker

A web application that shows when a League of Legends summoner last played and how long ago that was.

## Features

- 🔍 Search for any summoner by name and region
- ⏰ Shows exactly when the last game was played
- 📅 Displays time elapsed in years, months, days, hours, and minutes
- 🎮 Shows game details (champion, mode, result)
- 🔒 Secure API key management through backend
- 📱 Responsive design for mobile and desktop

## Architecture

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Backend**: Flask (Python) with CORS support
- **API**: Riot Games API v4/v5

## Setup Instructions

### Prerequisites

- Python 3.7+
- pip3
- A Riot Games API key (get one at [developer.riotgames.com](https://developer.riotgames.com/))

### Installation

1. **Clone or download the project files**

2. **Set up your API key**
   - Your API key is already configured in the `.env` file:
   ```
   RIOT_API_KEY=RGAPI-aab55173-492a-43b6-8175-77a1a4d5fb18
   ```

3. **Start the backend server**
   ```bash
   ./start_server.sh
   ```
   
   Or manually:
   ```bash
   # Create virtual environment
   python3 -m venv venv
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Start the server
   python app.py
   ```

4. **Open the frontend**
   - Open `index.html` in your web browser
   - The frontend will automatically connect to the Flask backend on `http://localhost:5000`

## Usage

1. Select your region from the dropdown
2. Enter a summoner name
3. Click "Search" or press Enter
4. View the results showing when they last played

## API Endpoints

The Flask backend provides these endpoints:

- `GET /api/summoner/<region>/<summoner_name>` - Get summoner info
- `GET /api/matches/<region>/<puuid>` - Get match history
- `GET /api/match/<region>/<match_id>` - Get match details
- `GET /api/last-game/<region>/<summoner_name>` - Get complete last game info
- `GET /health` - Health check

## Security

- API key is stored securely in the backend `.env` file
- Frontend never handles the API key directly
- All Riot API calls are made from the backend to avoid CORS issues
- Rate limiting is handled by the Riot API

## Supported Regions

- NA (North America)
- EUW (Europe West)
- EUNE (Europe Nordic & East)
- KR (Korea)
- JP (Japan)
- BR (Brazil)
- LAN (Latin America North)
- LAS (Latin America South)
- OCE (Oceania)
- TR (Turkey)
- RU (Russia)

## Error Handling

The application handles various error scenarios:

- Invalid summoner names
- Network connectivity issues
- API rate limiting
- Backend server connectivity
- Invalid regions

## Development

### File Structure

```
├── index.html          # Frontend HTML
├── styles.css          # Frontend CSS
├── script.js           # Frontend JavaScript
├── app.py              # Flask backend
├── requirements.txt    # Python dependencies
├── .env               # Environment variables (API key)
├── start_server.sh    # Server startup script
└── README.md          # This file
```

### Customization

- **Change backend port**: Modify `app.py` and update `backendUrl` in `script.js`
- **Add features**: Extend the Flask API and frontend accordingly
- **Styling**: Modify `styles.css` for different themes

## Troubleshooting

**Backend won't start:**
- Check if Python 3 is installed: `python3 --version`
- Ensure the .env file exists with your API key
- Check if port 5000 is available

**Frontend can't connect:**
- Ensure the Flask server is running
- Check browser console for error messages
- Verify the backend URL in `script.js`

**API errors:**
- Verify your API key is valid
- Check if you've hit rate limits
- Ensure the summoner name and region are correct

## License

This project is for educational purposes. Riot Games API terms of service apply.
