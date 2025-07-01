// DOM Elements
const detectLocationBtn = document.getElementById('detectLocationBtn');
const locationInput = document.getElementById('locationInput');
const searchLocationBtn = document.getElementById('searchLocationBtn');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const error = document.getElementById('error');
const locationText = document.getElementById('locationText');
const dateInfo = document.getElementById('dateInfo');
const sunriseTime = document.getElementById('sunriseTime');
const sunsetTime = document.getElementById('sunsetTime');
const dayLength = document.getElementById('dayLength');
const solarNoon = document.getElementById('solarNoon');
const civilTwilight = document.getElementById('civilTwilight');
const errorMessage = document.getElementById('errorMessage');

// Global variables
let currentLat = null;
let currentLng = null;

// Event listeners
detectLocationBtn.addEventListener('click', detectLocation);
searchLocationBtn.addEventListener('click', searchLocation);
locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchLocation();
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    setCurrentDate();
    // Try to detect location automatically on load
    detectLocation();
});

// Set current date
function setCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    dateInfo.textContent = now.toLocaleDateString('en-US', options);
}

// Show loading state
function showLoading() {
    hideAllSections();
    loading.classList.add('show');
}

// Show results
function showResults() {
    hideAllSections();
    results.classList.add('show');
}

// Show error
function showError(message) {
    hideAllSections();
    errorMessage.textContent = message;
    error.classList.add('show');
}

// Hide all sections
function hideAllSections() {
    loading.classList.remove('show');
    results.classList.remove('show');
    error.classList.remove('show');
}

// Detect user's location
async function detectLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by this browser.');
        return;
    }

    showLoading();

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            currentLat = position.coords.latitude;
            currentLng = position.coords.longitude;
            
            // Get location name using reverse geocoding
            const locationName = await getLocationName(currentLat, currentLng);
            locationText.textContent = locationName;
            
            // Get sunrise/sunset data
            await getSunriseSunsetData(currentLat, currentLng);
        },
        (error) => {
            let message = 'Unable to retrieve your location. ';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    message += 'Location access was denied. Please enable location access and try again.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message += 'Location information is unavailable.';
                    break;
                case error.TIMEOUT:
                    message += 'Location request timed out.';
                    break;
                default:
                    message += 'An unknown error occurred.';
                    break;
            }
            showError(message);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        }
    );
}

// Search for location
async function searchLocation() {
    const query = locationInput.value.trim();
    if (!query) {
        showError('Please enter a location name or coordinates.');
        return;
    }

    showLoading();

    try {
        // Check if input is coordinates (lat,lng format)
        const coordRegex = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
        const coordMatch = query.match(coordRegex);

        if (coordMatch) {
            // Input is coordinates
            currentLat = parseFloat(coordMatch[1]);
            currentLng = parseFloat(coordMatch[2]);
            
            if (currentLat < -90 || currentLat > 90 || currentLng < -180 || currentLng > 180) {
                showError('Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.');
                return;
            }
            
            const locationName = await getLocationName(currentLat, currentLng);
            locationText.textContent = locationName;
        } else {
            // Input is location name - use geocoding
            const coords = await geocodeLocation(query);
            currentLat = coords.lat;
            currentLng = coords.lng;
            locationText.textContent = coords.name;
        }

        // Get sunrise/sunset data
        await getSunriseSunsetData(currentLat, currentLng);
        
    } catch (error) {
        console.error('Search error:', error);
        showError('Unable to find the specified location. Please try a different search term.');
    }
}

// Geocode location name to coordinates
async function geocodeLocation(locationName) {
    try {
        // Using a free geocoding service (Nominatim)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`
        );
        
        if (!response.ok) {
            throw new Error('Geocoding service unavailable');
        }
        
        const data = await response.json();
        
        if (data.length === 0) {
            throw new Error('Location not found');
        }
        
        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            name: data[0].display_name
        };
    } catch (error) {
        throw new Error('Unable to geocode location');
    }
}

// Get location name from coordinates (reverse geocoding)
async function getLocationName(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
        );
        
        if (!response.ok) {
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
        
        const data = await response.json();
        
        // Extract meaningful location info
        const address = data.address || {};
        const parts = [];
        
        if (address.city) parts.push(address.city);
        else if (address.town) parts.push(address.town);
        else if (address.village) parts.push(address.village);
        
        if (address.state) parts.push(address.state);
        if (address.country) parts.push(address.country);
        
        return parts.length > 0 ? parts.join(', ') : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        
    } catch (error) {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

// Get sunrise and sunset data
async function getSunriseSunsetData(lat, lng) {
    try {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const response = await fetch(
            `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=${dateString}&formatted=0`
        );
        
        if (!response.ok) {
            throw new Error('Sunrise-sunset API unavailable');
        }
        
        const data = await response.json();
        
        if (data.status !== 'OK') {
            throw new Error('Invalid response from sunrise-sunset API');
        }
        
        // Parse and display the data
        displaySunriseSunsetData(data.results);
        showResults();
        
    } catch (error) {
        console.error('Sunrise-sunset API error:', error);
        showError('Unable to retrieve sunrise and sunset data. Please try again later.');
    }
}

// Display sunrise and sunset data
function displaySunriseSunsetData(data) {
    // Convert UTC times to local times
    const sunrise = new Date(data.sunrise);
    const sunset = new Date(data.sunset);
    const solarNoonTime = new Date(data.solar_noon);
    const civilTwilightBegin = new Date(data.civil_twilight_begin);
    const civilTwilightEnd = new Date(data.civil_twilight_end);
    
    // Format time options
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    
    // Display times
    sunriseTime.textContent = sunrise.toLocaleTimeString('en-US', timeOptions);
    sunsetTime.textContent = sunset.toLocaleTimeString('en-US', timeOptions);
    solarNoon.textContent = solarNoonTime.toLocaleTimeString('en-US', timeOptions);
    
    // Calculate and display day length
    const dayLengthMs = sunset.getTime() - sunrise.getTime();
    const dayLengthHours = Math.floor(dayLengthMs / (1000 * 60 * 60));
    const dayLengthMinutes = Math.floor((dayLengthMs % (1000 * 60 * 60)) / (1000 * 60));
    dayLength.textContent = `${dayLengthHours}h ${dayLengthMinutes}m`;
    
    // Display civil twilight times
    const twilightBegin = civilTwilightBegin.toLocaleTimeString('en-US', timeOptions);
    const twilightEnd = civilTwilightEnd.toLocaleTimeString('en-US', timeOptions);
    civilTwilight.textContent = `${twilightBegin} - ${twilightEnd}`;
    
    // Add some dynamic content based on current time
    updateDynamicContent(sunrise, sunset);
}

// Update dynamic content based on current time
function updateDynamicContent(sunrise, sunset) {
    const now = new Date();
    const sunriseCard = document.querySelector('.time-card.sunrise .label');
    const sunsetCard = document.querySelector('.time-card.sunset .label');
    
    if (now < sunrise) {
        sunriseCard.textContent = `In ${getTimeUntil(now, sunrise)}`;
        sunsetCard.textContent = 'Later today';
    } else if (now >= sunrise && now < sunset) {
        sunriseCard.textContent = `${getTimeSince(sunrise, now)} ago`;
        sunsetCard.textContent = `In ${getTimeUntil(now, sunset)}`;
    } else {
        sunriseCard.textContent = `${getTimeSince(sunrise, now)} ago`;
        sunsetCard.textContent = `${getTimeSince(sunset, now)} ago`;
    }
}

// Calculate time until a future time
function getTimeUntil(from, to) {
    const diff = to.getTime() - from.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

// Calculate time since a past time
function getTimeSince(from, to) {
    const diff = to.getTime() - from.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

// Add some nice animations when data loads
function animateResults() {
    const timeCards = document.querySelectorAll('.time-card');
    const infoItems = document.querySelectorAll('.info-item');
    
    timeCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        }, index * 200);
    });
    
    infoItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            item.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 100);
        }, (index + 2) * 200);
    });
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'l':
                e.preventDefault();
                locationInput.focus();
                break;
            case 'r':
                e.preventDefault();
                location.reload();
                break;
        }
    }
});

// Add touch/swipe gesture support for mobile
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartY - touchEndY;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe up - refresh data
            if (currentLat && currentLng) {
                getSunriseSunsetData(currentLat, currentLng);
            }
        }
    }
}

// Service Worker registration for offline support (optional enhancement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Only register if we create a service worker file
        // navigator.serviceWorker.register('/sw.js');
    });
}

// Handle network status
window.addEventListener('online', () => {
    if (currentLat && currentLng) {
        getSunriseSunsetData(currentLat, currentLng);
    }
});

window.addEventListener('offline', () => {
    showError('You appear to be offline. Please check your internet connection.');
});

// Add some Easter eggs
let clickCount = 0;
const sunIcon = document.querySelector('header h1 i');

sunIcon.addEventListener('click', () => {
    clickCount++;
    if (clickCount === 5) {
        sunIcon.style.animation = 'rotate 1s linear infinite';
        setTimeout(() => {
            sunIcon.style.animation = 'rotate 20s linear infinite';
            clickCount = 0;
        }, 3000);
    }
});

// Initialize theme based on current time
function initializeTheme() {
    const hour = new Date().getHours();
    if (hour < 6 || hour > 18) {
        document.body.classList.add('night-theme');
    }
}

// Call initialize theme
initializeTheme();
