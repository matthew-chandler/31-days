class RiotAPI {
    constructor() {
        this.backendUrl = 'https://league.machandler.com';
    }

    async makeRequest(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }

            if (!data.success) {
                throw new Error(data.error || 'API request failed');
            }

            return data.data;
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Cannot connect to backend server.');
            }
            throw error;
        }
    }

    async getSummonerByRiotId(riotId, region) {
        const url = `${this.backendUrl}/api/summoner/${region}/${encodeURIComponent(riotId)}`;
        return await this.makeRequest(url);
    }

    async getLastGame(riotId, region) {
        const url = `${this.backendUrl}/api/last-game/${region}/${encodeURIComponent(riotId)}`;
        return await this.makeRequest(url);
    }

    async checkHealth() {
        const url = `${this.backendUrl}/health`;
        return await this.makeRequest(url);
    }
}

class App {
    constructor() {
        this.riotAPI = new RiotAPI();
        this.initializeElements();
        this.attachEventListeners();
        this.checkBackendHealth();
    }

    initializeElements() {
        this.regionSelect = document.getElementById('regionSelect');
        this.summonerInput = document.getElementById('summonerInput');
        this.searchButton = document.getElementById('searchButton');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.errorMessage = document.getElementById('errorMessage');
        this.results = document.getElementById('results');

        // Result elements
        this.summonerIcon = document.getElementById('summonerIcon');
        this.summonerName = document.getElementById('summonerName');
        this.summonerLevel = document.getElementById('summonerLevel');
        this.lastGameDate = document.getElementById('lastGameDate');
        this.timeAgo = document.getElementById('timeAgo');
        this.gameMode = document.getElementById('gameMode');
        this.champion = document.getElementById('champion');
        this.gameResult = document.getElementById('gameResult');
    }

    attachEventListeners() {
        this.searchButton.addEventListener('click', () => this.searchSummoner());
        this.summonerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchSummoner();
            }
        });
    }

    async checkBackendHealth() {
        try {
            await this.riotAPI.checkHealth();
            console.log('✅ Backend server is running and healthy');
        } catch (error) {
            console.warn('⚠️ Backend server health check failed:', error.message);
            this.showError('Backend server is not running.');
        }
    }

    showLoading() {
        this.hideAll();
        this.loadingSpinner.classList.remove('hidden');
    }

    showError(message) {
        this.hideAll();
        this.errorMessage.querySelector('p').textContent = message;
        this.errorMessage.classList.remove('hidden');
    }

    showSuccess(message) {
        // You could add a success message element if needed
        console.log(message);
    }

    showResults() {
        this.hideAll();
        this.results.classList.remove('hidden');
    }

    hideAll() {
        this.loadingSpinner.classList.add('hidden');
        this.errorMessage.classList.add('hidden');
        this.results.classList.add('hidden');
    }

    async searchSummoner() {
        const riotIdInput = this.summonerInput.value.trim();
        const region = this.regionSelect.value;

        if (!riotIdInput) {
            this.showError('Please enter a Riot ID (e.g., Player#NA1).');
            return;
        }

        // Validate Riot ID format
        if (!riotIdInput.includes('#')) {
            this.showError('Please enter a valid Riot ID with # (e.g., Player#NA1). Legacy summoner names are no longer supported.');
            return;
        }

        this.showLoading();

        try {
            // Use the combined endpoint for better performance
            const result = await this.riotAPI.getLastGame(riotIdInput, region);
            
            const { account, summoner, match, participant, timeAgo } = result;
            this.displayResults(account, summoner, match, participant, timeAgo);
            
        } catch (error) {
            console.error('Error searching summoner:', error);
            this.showError(error.message || 'An error occurred while searching for the summoner.');
        }
    }

    displayResults(account, summoner, matchDetails, participant, timeAgo) {
        // Summoner info - use Riot ID from account data
        this.summonerIcon.src = `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${summoner.profileIconId}.png`;
        this.summonerIcon.alt = `${account.gameName}#${account.tagLine}'s icon`;
        this.summonerName.textContent = `${account.gameName}#${account.tagLine}`;
        this.summonerLevel.textContent = `Level ${summoner.summonerLevel}`;

        // Game timing - use backend-calculated values
        this.lastGameDate.textContent = timeAgo.formatted_date;
        this.timeAgo.textContent = timeAgo.text;

        // Game details
        this.gameMode.textContent = `🎮 ${this.getGameModeDisplay(matchDetails.info.gameMode, matchDetails.info.queueId)}`;
        this.champion.textContent = `⚔️ ${participant.championName}`;
        this.gameResult.textContent = participant.win ? '🏆 Victory' : '💀 Defeat';

        this.showResults();
    }

    getGameModeDisplay(gameMode, queueId) {
        const queueMap = {
            420: 'Ranked Solo/Duo',
            440: 'Ranked Flex',
            450: 'ARAM',
            400: 'Normal Draft',
            430: 'Normal Blind',
            900: 'URF',
            1020: 'One For All',
            1300: 'Nexus Blitz'
        };
        
        return queueMap[queueId] || gameMode || 'Unknown Mode';
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
