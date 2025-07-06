from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Riot API configuration
RIOT_API_KEY = os.getenv('RIOT_API_KEY')
if not RIOT_API_KEY:
    raise ValueError("RIOT_API_KEY not found in environment variables")

# Regional endpoints
REGIONAL_ENDPOINTS = {
    'na1': 'https://na1.api.riotgames.com',
    'euw1': 'https://euw1.api.riotgames.com',
    'eune1': 'https://eune1.api.riotgames.com',
    'kr': 'https://kr.api.riotgames.com',
    'jp1': 'https://jp1.api.riotgames.com',
    'br1': 'https://br1.api.riotgames.com',
    'la1': 'https://la1.api.riotgames.com',
    'la2': 'https://la2.api.riotgames.com',
    'oc1': 'https://oc1.api.riotgames.com',
    'tr1': 'https://tr1.api.riotgames.com',
    'ru': 'https://ru.api.riotgames.com'
}

# Regional routing for account API (Riot ID lookup)
ACCOUNT_REGIONAL_ROUTING = {
    'na1': 'americas',
    'br1': 'americas',
    'la1': 'americas',
    'la2': 'americas',
    'euw1': 'europe',
    'eune1': 'europe',
    'tr1': 'europe',
    'ru': 'europe',
    'kr': 'asia',
    'jp1': 'asia',
    'oc1': 'sea'
}

# Regional routing for match API
REGIONAL_ROUTING = {
    'na1': 'americas',
    'br1': 'americas',
    'la1': 'americas',
    'la2': 'americas',
    'euw1': 'europe',
    'eune1': 'europe',
    'tr1': 'europe',
    'ru': 'europe',
    'kr': 'asia',
    'jp1': 'asia',
    'oc1': 'sea'
}

class TimeCalculator:
    @staticmethod
    def get_time_ago(timestamp):
        """Calculate time ago from timestamp and return structured data"""
        now = datetime.now()
        game_date = datetime.fromtimestamp(timestamp / 1000)  # Convert milliseconds to seconds
        diff_ms = (now - game_date).total_seconds() * 1000
        
        years = int(diff_ms // (1000 * 60 * 60 * 24 * 365))
        months = int((diff_ms % (1000 * 60 * 60 * 24 * 365)) // (1000 * 60 * 60 * 24 * 30))
        days = int((diff_ms % (1000 * 60 * 60 * 24 * 30)) // (1000 * 60 * 60 * 24))
        hours = int((diff_ms % (1000 * 60 * 60 * 24)) // (1000 * 60 * 60))
        minutes = int((diff_ms % (1000 * 60 * 60)) // (1000 * 60))

        parts = []
        if years > 0:
            parts.append(f"{years} year{'s' if years != 1 else ''}")
        if months > 0:
            parts.append(f"{months} month{'s' if months != 1 else ''}")
        if days > 0:
            parts.append(f"{days} day{'s' if days != 1 else ''}")
        if hours > 0 and years == 0:
            parts.append(f"{hours} hour{'s' if hours != 1 else ''}")
        if minutes > 0 and years == 0 and months == 0:
            parts.append(f"{minutes} minute{'s' if minutes != 1 else ''}")

        if len(parts) == 0:
            time_ago_text = 'Just now'
        elif len(parts) == 1:
            time_ago_text = f"{parts[0]} ago"
        elif len(parts) == 2:
            time_ago_text = f"{parts[0]} and {parts[1]} ago"
        else:
            time_ago_text = f"{', '.join(parts[:-1])}, and {parts[-1]} ago"

        return {
            'years': years,
            'months': months,
            'days': days,
            'hours': hours,
            'minutes': minutes,
            'text': time_ago_text,
            'formatted_date': game_date.strftime('%B %d, %Y at %I:%M %p')
        }

def parse_riot_id(riot_id_input):
    """Parse Riot ID input to extract gameName and tagLine"""
    # Check if input contains '#' for new Riot ID format
    if '#' in riot_id_input:
        parts = riot_id_input.split('#')
        if len(parts) == 2:
            return parts[0], parts[1]
    
    # If no '#' found, assume it's a legacy summoner name with default tag
    # This is a fallback, but users should provide full Riot ID
    return riot_id_input, None

def get_puuid_by_riot_id(game_name, tag_line, region):
    """Get PUUID using Riot ID (gameName + tagLine)"""
    if region not in ACCOUNT_REGIONAL_ROUTING:
        return {'success': False, 'error': 'Invalid region for account lookup'}
    
    routing_region = ACCOUNT_REGIONAL_ROUTING[region]
    
    if tag_line:
        # Use the new Riot ID endpoint
        url = f"https://{routing_region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
    else:
        # Fallback: try the legacy summoner name endpoint (deprecated but may still work)
        base_url = REGIONAL_ENDPOINTS[region]
        url = f"{base_url}/lol/summoner/v4/summoners/by-name/{game_name}"
    
    return make_riot_request(url)

def make_riot_request(url):
    """Make a request to Riot API with proper headers and error handling"""
    headers = {
        'X-Riot-Token': RIOT_API_KEY
    }
    
    # Log the request
    print(f"\n🔗 RIOT API REQUEST:")
    print(f"   URL: {url}")
    masked_key = f"{RIOT_API_KEY[:10]}..." if RIOT_API_KEY else "None"
    print(f"   Headers: {{'X-Riot-Token': '{masked_key}' }}")
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        # Log the response
        print(f"📥 RIOT API RESPONSE:")
        print(f"   Status Code: {response.status_code}")
        print(f"   Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            response_data = response.json()
            print(f"   Response Body (truncated): {str(response_data)[:500]}...")
            return {'success': True, 'data': response_data}
        elif response.status_code == 404:
            print(f"   Error: 404 - Summoner not found")
            return {'success': False, 'error': 'Summoner not found. Please check the spelling and region.'}
        elif response.status_code == 403:
            print(f"   Error: 403 - Invalid API key or insufficient permissions")
            return {'success': False, 'error': 'Invalid API key or insufficient permissions.'}
        elif response.status_code == 429:
            print(f"   Error: 429 - Rate limit exceeded")
            return {'success': False, 'error': 'Rate limit exceeded. Please wait and try again.'}
        else:
            print(f"   Error: {response.status_code} - {response.text}")
            return {'success': False, 'error': f'API request failed with status {response.status_code}'}
            
    except requests.exceptions.Timeout:
        print(f"   Error: Request timed out")
        return {'success': False, 'error': 'Request timed out. Please try again.'}
    except requests.exceptions.RequestException as e:
        print(f"   Error: Network error - {str(e)}")
        return {'success': False, 'error': f'Network error: {str(e)}'}

@app.route('/api/summoner/<region>/<riot_id>')
def get_summoner(region, riot_id):
    """Get summoner information by Riot ID (gameName#tagLine) and region"""
    if region not in REGIONAL_ENDPOINTS:
        return jsonify({'success': False, 'error': 'Invalid region'}), 400
    
    # Parse the Riot ID
    game_name, tag_line = parse_riot_id(riot_id)
    
    # Get account info (PUUID) using Riot ID
    account_result = get_puuid_by_riot_id(game_name, tag_line, region)
    if not account_result['success']:
        return jsonify(account_result), 400
    
    account_data = account_result['data']
    puuid = account_data.get('puuid')
    
    if not puuid:
        return jsonify({'success': False, 'error': 'PUUID not found in account data'}), 400
    
    # Get summoner info using PUUID
    base_url = REGIONAL_ENDPOINTS[region]
    url = f"{base_url}/lol/summoner/v4/summoners/by-puuid/{puuid}"
    
    summoner_result = make_riot_request(url)
    
    if summoner_result['success']:
        # Combine account and summoner data
        combined_data = {
            'account': account_data,
            'summoner': summoner_result['data']
        }
        return jsonify({'success': True, 'data': combined_data})
    else:
        return jsonify(summoner_result), 400

@app.route('/api/matches/<region>/<puuid>')
def get_match_history(region, puuid):
    """Get match history for a summoner"""
    if region not in REGIONAL_ROUTING:
        return jsonify({'success': False, 'error': 'Invalid region'}), 400
    
    routing_region = REGIONAL_ROUTING[region]
    count = request.args.get('count', 1, type=int)
    
    # Limit count to prevent abuse
    count = min(count, 20)
    
    url = f"https://{routing_region}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?count={count}"
    
    result = make_riot_request(url)
    
    if result['success']:
        return jsonify(result)
    else:
        return jsonify(result), 400

@app.route('/api/match/<region>/<match_id>')
def get_match_details(region, match_id):
    """Get detailed information about a specific match"""
    if region not in REGIONAL_ROUTING:
        return jsonify({'success': False, 'error': 'Invalid region'}), 400
    
    routing_region = REGIONAL_ROUTING[region]
    url = f"https://{routing_region}.api.riotgames.com/lol/match/v5/matches/{match_id}"
    
    result = make_riot_request(url)
    
    if result['success']:
        return jsonify(result)
    else:
        return jsonify(result), 400

@app.route('/api/last-game/<region>/<riot_id>')
def get_last_game(region, riot_id):
    """Get complete information about a summoner's last game using Riot ID"""
    if region not in REGIONAL_ENDPOINTS:
        return jsonify({'success': False, 'error': 'Invalid region'}), 400
    
    # Parse the Riot ID
    game_name, tag_line = parse_riot_id(riot_id)
    
    # Step 1: Get account info (PUUID) using Riot ID
    account_result = get_puuid_by_riot_id(game_name, tag_line, region)
    if not account_result['success']:
        return jsonify(account_result), 400
    
    account_data = account_result['data']
    puuid = account_data.get('puuid')
    
    if not puuid:
        return jsonify({'success': False, 'error': 'PUUID not found in account data'}), 400
    
    # Step 2: Get summoner info using PUUID
    base_url = REGIONAL_ENDPOINTS[region]
    summoner_url = f"{base_url}/lol/summoner/v4/summoners/by-puuid/{puuid}"
    
    summoner_result = make_riot_request(summoner_url)
    if not summoner_result['success']:
        return jsonify(summoner_result), 400
    
    summoner_data = summoner_result['data']
    
    # Step 3: Get match history
    routing_region = REGIONAL_ROUTING[region]
    matches_url = f"https://{routing_region}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?count=1"
    
    matches_result = make_riot_request(matches_url)
    if not matches_result['success']:
        return jsonify(matches_result), 400
    
    match_ids = matches_result['data']
    if not match_ids:
        return jsonify({'success': False, 'error': 'No recent matches found for this summoner.'}), 404
    
    # Step 4: Get match details
    match_url = f"https://{routing_region}.api.riotgames.com/lol/match/v5/matches/{match_ids[0]}"
    
    match_result = make_riot_request(match_url)
    if not match_result['success']:
        return jsonify(match_result), 400
    
    match_data = match_result['data']
    
    # Step 5: Find the participant
    participant = None
    for p in match_data['info']['participants']:
        if p['puuid'] == puuid:
            participant = p
            break
    
    if not participant:
        return jsonify({'success': False, 'error': 'Player not found in match data.'}), 500
    
    # Calculate time ago for the last game
    game_end_timestamp = match_data['info']['gameEndTimestamp']
    time_calculation = TimeCalculator.get_time_ago(game_end_timestamp)
    
    # Combine all data
    response_data = {
        'success': True,
        'data': {
            'account': account_data,
            'summoner': summoner_data,
            'match': match_data,
            'participant': participant,
            'timeAgo': time_calculation
        }
    }
    
    return jsonify(response_data)

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'data': {
            'status': 'healthy', 
            'api_key_configured': bool(RIOT_API_KEY)
        }
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print(f"Starting Flask server...")
    print(f"API Key configured: {'Yes' if RIOT_API_KEY else 'No'}")
    app.run(debug=True, host='0.0.0.0', port=5000)
