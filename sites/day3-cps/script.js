const box = document.getElementById('box');
const timer = document.getElementById('timer');
const clicks = document.getElementById('clicks');
const result = document.getElementById('result');
const finalClicks = document.getElementById('final-clicks');
const cps = document.getElementById('cps');
const resetButton = document.getElementById('reset-button');
const durationSlider = document.getElementById('duration-slider');
const leaderboardList = document.getElementById('leaderboard-list');
const leaderboardDiv = document.getElementById('leaderboard');

let clickCount = 0;
let testDuration = 10;
let timeLeft = 10;
let timerId = null;
let gameStarted = false;
let startTime;
let leaderboard = [];

durationSlider.addEventListener('input', () => {
    if (!gameStarted) {
        testDuration = parseInt(durationSlider.value);
        timeLeft = testDuration;
        timer.textContent = timeLeft.toFixed(3);
    }
});

box.addEventListener('click', () => {
    if (!gameStarted) {
        gameStarted = true;
        box.style.backgroundColor = '#ff6b6b';
        durationSlider.disabled = true;
        startTime = Date.now();
        timerId = setInterval(() => {
            const elapsedTime = (Date.now() - startTime) / 1000;
            timeLeft = testDuration - elapsedTime;
            if (timeLeft > 0) {
                timer.textContent = timeLeft.toFixed(3);
            } else {
                timer.textContent = '0.000';
                endGame();
            }
        }, 10);
    }
    clickCount++;
    clicks.textContent = clickCount;
});

resetButton.addEventListener('click', () => {
    clickCount = 0;
    testDuration = parseInt(durationSlider.value);
    timeLeft = testDuration;
    gameStarted = false;
    box.style.backgroundColor = '#4CAF50';
    durationSlider.disabled = false;
    clearInterval(timerId);
    clicks.textContent = 0;
    timer.textContent = timeLeft.toFixed(3);
    result.style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
});

function endGame() {
    clearInterval(timerId);
    finalClicks.textContent = clickCount;
    const currentCPS = (clickCount / testDuration).toFixed(2);
    cps.textContent = currentCPS;
    updateLeaderboard(parseFloat(currentCPS), testDuration);
    document.getElementById('game-area').style.display = 'none';
    result.style.display = 'block';

    resetButton.disabled = true;
    setTimeout(() => {
        resetButton.disabled = false;
    }, 1000);
}

function updateLeaderboard(cps, duration) {
    leaderboard.push({ cps, duration });
    leaderboard.sort((a, b) => b.cps - a.cps);
    leaderboard = leaderboard.slice(0, 5);
    saveLeaderboard();
    renderLeaderboard();
}

function saveLeaderboard() {
    localStorage.setItem('cpsLeaderboard', JSON.stringify(leaderboard));
}

function loadLeaderboard() {
    const savedLeaderboard = localStorage.getItem('cpsLeaderboard');
    if (savedLeaderboard) {
        leaderboard = JSON.parse(savedLeaderboard);
        renderLeaderboard();
    }
}

function renderLeaderboard() {
    if (leaderboard.length === 0) {
        leaderboardDiv.style.display = 'none';
        return;
    }
    leaderboardDiv.style.display = 'block';
    leaderboardList.innerHTML = '';
    leaderboard.forEach((score, index) => {
        const li = document.createElement('li');
        li.textContent = `#${index + 1}: ${score.cps} CPS (${score.duration}s)`;
        leaderboardList.appendChild(li);
    });
}

loadLeaderboard();
