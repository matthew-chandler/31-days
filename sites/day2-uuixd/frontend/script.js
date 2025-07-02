document.getElementById('generate-btn').addEventListener('click', generateUuid);

// Automatically generate the next UUID on page load
window.addEventListener('DOMContentLoaded', generateUuid);

async function generateUuid() {
    const display = document.getElementById('uuid-display');
    const copiedFeedback = document.getElementById('copied-feedback');
    display.textContent = 'Loading...';
    if (copiedFeedback) copiedFeedback.style.display = 'none';
    try {
        // Change the URL if backend runs on a different port or host
        const response = await fetch('http://localhost:5000/');
        if (!response.ok) {
            const errorText = await response.text();
            display.textContent = `Error: ${response.status} - ${errorText}`;
            return;
        }
        const uuid = await response.text();
        display.textContent = uuid;
    } catch (err) {
        display.textContent = 'Network error: ' + err;
    }
}

const display = document.getElementById('uuid-display');

// Create a feedback element for 'Copied!'
let copiedFeedback = document.createElement('div');
copiedFeedback.id = 'copied-feedback';
copiedFeedback.style.display = 'none';
display.parentNode.insertBefore(copiedFeedback, display.nextSibling);

display.addEventListener('click', async () => {
    const text = display.textContent;
    if (text && !text.startsWith('Click') && !text.startsWith('Error') && !text.startsWith('Loading')) {
        try {
            await navigator.clipboard.writeText(text);
            copiedFeedback.textContent = 'Copied!';
            copiedFeedback.style.display = 'block';
            copiedFeedback.classList.add('show');
            // Do not auto-hide; stays until next UUID is generated
        } catch (e) {
            // fallback: do nothing
        }
    }
});

function getFlagEmoji(countryName) {
    // Use a simple mapping for common countries, fallback to globe
    const countryToCode = {
        'United States': 'US',
        'Canada': 'CA',
        'United Kingdom': 'GB',
        'Germany': 'DE',
        'France': 'FR',
        'Japan': 'JP',
        'China': 'CN',
        'India': 'IN',
        'Australia': 'AU',
        'Brazil': 'BR',
        'Italy': 'IT',
        'Spain': 'ES',
        'Russia': 'RU',
        'South Korea': 'KR',
        'Mexico': 'MX',
        'Netherlands': 'NL',
        'Sweden': 'SE',
        'Turkey': 'TR',
        'Switzerland': 'CH',
        'Local': '🏠',
        'Unknown': '🌐',
    };
    if (countryName === 'Local') return '🏠';
    if (countryName === 'Unknown') return '🌐';
    let code = countryToCode[countryName];
    if (!code && countryName && countryName.length === 2) code = countryName.toUpperCase();
    if (!code) return '🌐';
    // Convert country code to regional indicator symbols
    return code.replace(/./g, c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65));
}

// Leaderboard rendering
function renderLeaderboard(entries) {
    let leaderboard = document.getElementById('leaderboard');
    if (!leaderboard) {
        leaderboard = document.createElement('div');
        leaderboard.id = 'leaderboard';
        leaderboard.innerHTML = `<h2>Country Leaderboard:</h2><ul id="leaderboard-list"></ul>`;
        document.querySelector('.container').appendChild(leaderboard);
    }
    const list = leaderboard.querySelector('#leaderboard-list');
    list.innerHTML = '';
    const medals = [
        '<span class="medal gold">🥇</span>',
        '<span class="medal silver">🥈</span>',
        '<span class="medal bronze">🥉</span>'
    ];
    // Filter out 'Unknown' countries
    const filtered = entries.filter(entry => entry.country !== 'Unknown');
    if (filtered.length === 0) {
        list.innerHTML = '<li>No data yet.</li>';
    } else {
        filtered.forEach((entry, i) => {
            const li = document.createElement('li');
            const flag = getFlagEmoji(entry.country);
            li.innerHTML = `${medals[i] || ''} <span class="country">${entry.country}</span> <span class="flag">${flag}</span> <span class="count">${entry.count}</span>`;
            list.appendChild(li);
        });
    }
}

async function fetchLeaderboard() {
    try {
        const response = await fetch('http://localhost:5000/leaderboard');
        if (!response.ok) return;
        const data = await response.json();
        renderLeaderboard(data);
    } catch (e) {
        // Optionally handle error
    }
}

// Fetch leaderboard on load and every 10 seconds
fetchLeaderboard();
setInterval(fetchLeaderboard, 10000);
