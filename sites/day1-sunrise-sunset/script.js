// Global variables
let userLocation = null;
let sunData = null;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeBasedBackground(); // Set initial background once
    setupLocationControls();
    updateCurrentDate(); // Update the current date display
    requestIPLocation(); // Start with IP location automatically
});

// Setup location control event listeners
function setupLocationControls() {
    const searchInput = document.getElementById('location-search');
    const locationDisplay = document.getElementById('location-info');
    
    // Function to show search input
    function showSearchInput() {
        locationDisplay.style.display = 'none';
        searchInput.style.display = 'block';
        searchInput.focus();
    }
    
    // Show search input when clicking on the location display
    locationDisplay.addEventListener('click', function() {
        if (searchInput.style.display === 'none' || !searchInput.style.display) {
            showSearchInput();
        }
    });
    
    // Add enter key support for search input
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Add escape key to cancel search
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideSearchInput();
        }
    });
    
    // Show coordinate hint when user focuses on search input
    searchInput.addEventListener('focus', function() {
        document.getElementById('coordinate-hint').style.display = 'block';
    });
    
    // Hide coordinate hint when user clicks elsewhere
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-section')) {
            document.getElementById('coordinate-hint').style.display = 'none';
        }
    });
}

// Hide search input and show location display
function hideSearchInput() {
    const searchInput = document.getElementById('location-search');
    const locationDisplay = document.getElementById('location-info');
    
    searchInput.style.display = 'none';
    searchInput.value = '';
    locationDisplay.style.display = 'flex';
    document.getElementById('coordinate-hint').style.display = 'none';
}

// Update current date display
function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
}

// Show location loading state
function showLocationLoading(message = 'Detecting your location...') {
    const locationInfo = document.getElementById('location-info');
    locationInfo.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
}

// Request location using IP address
async function requestIPLocation() {
    showLocationLoading('Detecting your location via IP...');
    
    try {
        const response = await fetch('https://ipapi.co/json/');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.reason || 'IP geolocation failed');
        }
        
        const position = {
            coords: {
                latitude: data.latitude,
                longitude: data.longitude
            },
            locationData: {
                city: data.city,
                region: data.region,
                country: data.country_name,
                timezone: data.timezone,
                method: 'IP'
            }
        };
        
        onLocationSuccess(position);
        
    } catch (error) {
        console.error('IP location error:', error);
        onLocationError(error);
    }
}

// Handle search input (city name or coordinates)
function handleSearch() {
    const searchInput = document.getElementById('location-search');
    const searchValue = searchInput.value.trim();
    
    if (!searchValue) {
        alert('Please enter a city name or coordinates');
        return;
    }
    
    // Check if input looks like coordinates
    if (isCoordinateInput(searchValue)) {
        parseAndUseCoordinates(searchValue);
    } else {
        searchLocation(searchValue);
    }
}

// Check if input looks like coordinates
function isCoordinateInput(input) {
    // Patterns for coordinates: "40.7128, -74.0060" or "40.7128°N, 74.0060°W" etc.
    const coordPatterns = [
        /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/,  // "40.7128, -74.0060"
        /^-?\d+\.?\d*°?[NS]?\s*,?\s*-?\d+\.?\d*°?[EW]?$/i,  // "40.7128°N, 74.0060°W"
    ];
    
    return coordPatterns.some(pattern => pattern.test(input));
}

// Parse coordinates from input string
function parseAndUseCoordinates(input) {
    try {
        // Clean up the input
        let cleaned = input.replace(/[°NSEW]/gi, '').replace(/\s+/g, ' ').trim();
        
        // Handle different separators
        const coords = cleaned.split(/[,\s]+/).filter(c => c.length > 0);
        
        if (coords.length !== 2) {
            throw new Error('Invalid coordinate format');
        }
        
        let lat = parseFloat(coords[0]);
        let lng = parseFloat(coords[1]);
        
        // Handle N/S and E/W indicators
        if (input.match(/[SW]/i)) {
            if (input.toLowerCase().includes('s')) lat = -Math.abs(lat);
            if (input.toLowerCase().includes('w')) lng = -Math.abs(lng);
        }
        
        if (isNaN(lat) || isNaN(lng)) {
            throw new Error('Invalid coordinate values');
        }
        
        if (lat < -90 || lat > 90) {
            throw new Error('Latitude must be between -90 and 90 degrees');
        }
        
        if (lng < -180 || lng > 180) {
            throw new Error('Longitude must be between -180 and 180 degrees');
        }
        
        const position = {
            coords: {
                latitude: lat,
                longitude: lng
            },
            locationData: {
                method: 'Manual Coordinates',
                searchTerm: input
            }
        };
        
        onLocationSuccess(position);
        
    } catch (error) {
        alert('Invalid coordinates. Please use format like: "40.7128, -74.0060"');
    }
}

// Search for location by city name
async function searchLocation(searchTerm) {
    showLocationLoading('Searching for location...');
    
    try {
        // Use OpenStreetMap Nominatim API for geocoding (free, no API key required)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&limit=1`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.length === 0) {
            throw new Error('Location not found. Please try a different search term.');
        }
        
        const result = data[0];
        const position = {
            coords: {
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon)
            },
            locationData: {
                city: result.display_name.split(',')[0],
                country: result.display_name.split(',').pop().trim(),
                method: 'Search',
                searchTerm: searchTerm
            }
        };
        
        onLocationSuccess(position);
        
    } catch (error) {
        console.error('Location search error:', error);
        onLocationError(error);
    }
}

// Handle successful location detection
function onLocationSuccess(position) {
    userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        locationInfo: position.locationData || null
    };

    displayLocation();
    fetchSunData();
    fetchDSTInfo();
}

// Handle location detection error
function onLocationError(error) {
    let errorMessage = 'Unable to detect your location. ';
    
    if (error.message) {
        errorMessage += error.message;
    } else {
        errorMessage += 'Please check your internet connection and try again.';
    }

    showError(errorMessage);
}

// Display location information
function displayLocation() {
    const locationInfo = document.getElementById('location-info');
    const coordinatesDiv = document.getElementById('coordinates');
    
    let cityInfo = 'Unknown Location';
    
    if (userLocation.locationInfo) {
        const info = userLocation.locationInfo;
        
        // Set location text
        if (info.city && info.country) {
            cityInfo = `${info.city}${info.region ? ', ' + info.region : ''}`;
        } else if (info.searchTerm) {
            cityInfo = `${info.searchTerm}`;
        }
    }
    
    locationInfo.innerHTML = `
        <span class="current-location">${cityInfo}</span>
    `;
    
    // Display coordinates
    if (userLocation.latitude && userLocation.longitude) {
        coordinatesDiv.innerHTML = `${userLocation.latitude.toFixed(4)}°, ${userLocation.longitude.toFixed(4)}°`;
        coordinatesDiv.style.display = 'block';
    } else {
        coordinatesDiv.style.display = 'none';
    }
    
    // Ensure the location display is visible and search input is hidden
    locationInfo.style.display = 'flex';
    document.getElementById('location-search').style.display = 'none';
}

// Fetch sunrise/sunset data from API
async function fetchSunData() {
    if (!userLocation) {
        showError('Location not available.');
        return;
    }

    try {
        const response = await fetch(
            `https://api.sunrise-sunset.org/json?lat=${userLocation.latitude}&lng=${userLocation.longitude}&formatted=0`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status !== 'OK') {
            throw new Error('API returned error status');
        }
        
        sunData = data.results;
        displaySunTimes();
        startCountdownUpdates();
        
    } catch (error) {
        console.error('Error fetching sun data:', error);
        showError('Failed to fetch sunrise/sunset data. Please try again.');
    }
}

// Display sunrise and sunset times
function displaySunTimes() {
    if (!sunData) return;

    // Convert UTC times to local time
    const sunrise = new Date(sunData.sunrise);
    const sunset = new Date(sunData.sunset);
    const solarNoon = new Date(sunData.solar_noon);
    
    // Format times
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
    };
    
    // Update time displays
    document.getElementById('sunrise-time').textContent = sunrise.toLocaleTimeString('en-US', timeOptions);
    document.getElementById('sunset-time').textContent = sunset.toLocaleTimeString('en-US', timeOptions);
    document.getElementById('solar-noon').textContent = solarNoon.toLocaleTimeString('en-US', timeOptions);
    
    // Calculate and display day length
    const dayLengthMs = sunset.getTime() - sunrise.getTime();
    const dayLengthHours = Math.floor(dayLengthMs / (1000 * 60 * 60));
    const dayLengthMinutes = Math.floor((dayLengthMs % (1000 * 60 * 60)) / (1000 * 60));
    document.getElementById('day-length').textContent = `${dayLengthHours}h ${dayLengthMinutes}m`;
    
    // Background already set - don't update to avoid multiple image loads
}

// Start countdown updates
function startCountdownUpdates() {
    updateCountdowns();
    setInterval(updateCountdowns, 60000); // Update every minute
}

// Update countdown displays
function updateCountdowns() {
    if (!sunData) return;

    const now = new Date();
    const sunrise = new Date(sunData.sunrise);
    const sunset = new Date(sunData.sunset);
    
    // Calculate time until sunrise
    const timeToSunrise = sunrise.getTime() - now.getTime();
    const timeToSunset = sunset.getTime() - now.getTime();
    
    // Update sunrise countdown
    const sunriseCountdown = document.getElementById('sunrise-countdown');
    if (timeToSunrise > 0) {
        sunriseCountdown.textContent = `in ${formatTimeUntil(timeToSunrise)}`;
    } else if (timeToSunrise > -24 * 60 * 60 * 1000) { // Within 24 hours ago
        sunriseCountdown.textContent = `${formatTimeAgo(-timeToSunrise)} ago`;
    } else {
        sunriseCountdown.textContent = 'Yesterday';
    }
    
    // Update sunset countdown
    const sunsetCountdown = document.getElementById('sunset-countdown');
    if (timeToSunset > 0) {
        sunsetCountdown.textContent = `in ${formatTimeUntil(timeToSunset)}`;
    } else if (timeToSunset > -24 * 60 * 60 * 1000) { // Within 24 hours ago
        sunsetCountdown.textContent = `${formatTimeAgo(-timeToSunset)} ago`;
    } else {
        sunsetCountdown.textContent = 'Yesterday';
    }
}

// Format time until/ago
function formatTimeUntil(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

function formatTimeAgo(ms) {
    return formatTimeUntil(ms);
}

// Show error message
function showError(message) {
    const locationInfo = document.getElementById('location-info');
    locationInfo.innerHTML = `
        <div class="error-message">
            ${message}
            <br>
            <button class="retry-btn" onclick="requestIPLocation()">Try Again</button>
        </div>
    `;
}

// Refresh all data
// Add some visual feedback for retry button clicks
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('retry-btn')) {
        e.target.style.transform = 'scale(0.95)';
        setTimeout(() => {
            e.target.style.transform = '';
        }, 150);
    }
});

// Handle visibility change to refresh data when page becomes visible
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && sunData) {
        // Update countdowns when page becomes visible
        updateCountdowns();
    }
});

// Auto-refresh data at midnight
function scheduleNextRefresh() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
        // Refresh location data at midnight
        requestIPLocation();
        // Schedule the next refresh for the following day
        scheduleNextRefresh();
    }, msUntilMidnight);
}

// Start the auto-refresh schedule
scheduleNextRefresh();

// Fetch DST information for the current location
async function fetchDSTInfo() {
    if (!userLocation) {
        document.getElementById('dst-info').textContent = '--';
        return;
    }

    try {
        // Use TimeZoneDB API for DST information (free tier available)
        // Alternatively, we can use browser's Intl API for basic timezone info
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Get current date and check DST status
        const now = new Date();
        const january = new Date(now.getFullYear(), 0, 1);
        const july = new Date(now.getFullYear(), 6, 1);
        
        // Check if DST is currently active
        const isDST = now.getTimezoneOffset() < Math.max(january.getTimezoneOffset(), july.getTimezoneOffset());
        
        // Calculate next DST change date
        const nextDSTChange = calculateNextDSTChange(now, isDST);
        
        if (nextDSTChange) {
            const timeUntilChange = nextDSTChange.getTime() - now.getTime();
            const daysUntilChange = Math.ceil(timeUntilChange / (1000 * 60 * 60 * 24));
            
            const changeType = isDST ? 'End' : 'Start';
            const changeDate = nextDSTChange.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            
            if (daysUntilChange <= 0) {
                document.getElementById('dst-info').textContent = 'Today!';
            } else if (daysUntilChange === 1) {
                document.getElementById('dst-info').textContent = 'Tomorrow';
            } else if (daysUntilChange <= 7) {
                document.getElementById('dst-info').textContent = `${daysUntilChange} days`;
            } else {
                document.getElementById('dst-info').textContent = `${changeDate}`;
            }
        } else {
            // Location doesn't observe DST
            document.getElementById('dst-info').textContent = 'No DST';
        }
        
    } catch (error) {
        console.error('Error fetching DST data:', error);
        document.getElementById('dst-info').textContent = 'Unknown';
    }
}

// Calculate the next DST change date
function calculateNextDSTChange(currentDate, isDSTActive) {
    const year = currentDate.getFullYear();
    
    // DST rules for most locations (US/Europe pattern)
    // Note: This is a simplified calculation and may not be accurate for all timezones
    
    // For US: Second Sunday in March (start), First Sunday in November (end)
    // For Europe: Last Sunday in March (start), Last Sunday in October (end)
    
    // Try to detect timezone region
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    let startDate, endDate;
    
    if (timeZone.includes('America/')) {
        // US rules
        startDate = getNthSunday(year, 2, 2); // Second Sunday in March (month 2)
        endDate = getNthSunday(year, 10, 1); // First Sunday in November (month 10)
    } else if (timeZone.includes('Europe/')) {
        // European rules
        startDate = getLastSunday(year, 2); // Last Sunday in March
        endDate = getLastSunday(year, 9); // Last Sunday in October
    } else {
        // Default to US rules or return null for regions without DST
        const january = new Date(year, 0, 1);
        const july = new Date(year, 6, 1);
        
        // If timezone offset is the same in January and July, likely no DST
        if (january.getTimezoneOffset() === july.getTimezoneOffset()) {
            return null;
        }
        
        startDate = getNthSunday(year, 2, 2);
        endDate = getNthSunday(year, 10, 1);
    }
    
    // Determine next change based on current date and DST status
    if (isDSTActive) {
        // DST is active, next change is to end DST
        if (currentDate < endDate) {
            return endDate;
        } else {
            // Already past this year's end date, return next year's start
            return getNthSunday(year + 1, 2, 2);
        }
    } else {
        // DST is not active, next change is to start DST
        if (currentDate < startDate) {
            return startDate;
        } else {
            // Already past this year's start date, return end date
            return endDate;
        }
    }
}

// Get the nth Sunday of a month (e.g., 2nd Sunday)
function getNthSunday(year, month, n) {
    const firstDay = new Date(year, month, 1);
    const firstSunday = new Date(year, month, 1 + (7 - firstDay.getDay()) % 7);
    return new Date(year, month, firstSunday.getDate() + (n - 1) * 7, 2, 0, 0); // 2 AM
}

// Get the last Sunday of a month
function getLastSunday(year, month) {
    const lastDay = new Date(year, month + 1, 0); // Last day of month
    const lastSunday = new Date(year, month, lastDay.getDate() - lastDay.getDay());
    return new Date(year, month, lastSunday.getDate(), 2, 0, 0); // 2 AM
}

// Set dynamic background based on time of day with real outdoor images
function setTimeBasedBackground() {
    const now = new Date();
    const hour = now.getHours();
    const body = document.body;
    
    // Remove all existing time classes
    const timeClasses = ['early-morning', 'sunrise', 'morning', 'midday', 'afternoon', 'sunset', 'twilight', 'night', 'late-night'];
    body.classList.remove(...timeClasses);
    
    // Determine time period and apply appropriate class with local background image
    if (hour >= 4 && hour < 6) {
        body.classList.add('early-morning');
        setBackgroundImage('early morning');
    } else if (hour >= 6 && hour < 8) {
        body.classList.add('sunrise');
        setBackgroundImage('sunrise');
    } else if (hour >= 8 && hour < 11) {
        body.classList.add('morning');
        setBackgroundImage('morning');
    } else if (hour >= 11 && hour < 15) {
        body.classList.add('midday');
        setBackgroundImage('midday');
    } else if (hour >= 15 && hour < 17) {
        body.classList.add('afternoon');
        setBackgroundImage('afternoon');
    } else if (hour >= 17 && hour < 19) {
        body.classList.add('sunset');
        setBackgroundImage('sunset');
    } else if (hour >= 19 && hour < 21) {
        body.classList.add('twilight');
        setBackgroundImage('twilight');
    } else if (hour >= 21 && hour < 24) {
        body.classList.add('night');
        setBackgroundImage('night');
    } else {
        body.classList.add('late-night');
        setBackgroundImage('late night');
    }
}

// Enhanced background that considers sunrise/sunset times if available
function setEnhancedTimeBasedBackground() {
    if (sunData) {
        const now = new Date();
        const sunrise = new Date(sunData.sunrise);
        const sunset = new Date(sunData.sunset);
        const body = document.body;
        
        // Remove all existing time classes
        const timeClasses = ['early-morning', 'sunrise', 'morning', 'midday', 'afternoon', 'sunset', 'twilight', 'night', 'late-night'];
        body.classList.remove(...timeClasses);
        
        const currentTime = now.getTime();
        const sunriseTime = sunrise.getTime();
        const sunsetTime = sunset.getTime();
        
        if (currentTime < sunriseTime - 2 * 60 * 60 * 1000) { // More than 2 hours before sunrise
            body.classList.add('late-night');
            setBackgroundImage('late night');
        } else if (currentTime < sunriseTime - 1 * 60 * 60 * 1000) { // 1-2 hours before sunrise
            body.classList.add('early-morning');
            setBackgroundImage('early morning');
        } else if (currentTime < sunriseTime + 1 * 60 * 60 * 1000) { // Sunrise ± 1 hour
            body.classList.add('sunrise');
            setBackgroundImage('sunrise');
        } else if (currentTime < sunriseTime + 4 * 60 * 60 * 1000) { // 1-4 hours after sunrise
            body.classList.add('morning');
            setBackgroundImage('morning');
        } else if (currentTime < sunsetTime - 2 * 60 * 60 * 1000) { // More than 2 hours before sunset
            body.classList.add('midday');
            setBackgroundImage('midday');
        } else if (currentTime < sunsetTime) { // 0-2 hours before sunset
            body.classList.add('afternoon');
            setBackgroundImage('afternoon');
        } else if (currentTime < sunsetTime + 1 * 60 * 60 * 1000) { // Sunset ± 1 hour
            body.classList.add('sunset');
            setBackgroundImage('sunset');
        } else if (currentTime < sunsetTime + 2 * 60 * 60 * 1000) { // 1-2 hours after sunset
            body.classList.add('twilight');
            setBackgroundImage('twilight');
        } else {
            body.classList.add('night');
            setBackgroundImage('night');
        }
    } else {
        // Fallback to basic time-based background
        setTimeBasedBackground();
    }
}

// Fetch and set background image using only local images
async function setBackgroundImage(searchTerms) {
    try {
        console.log(`Setting background for: ${searchTerms}`);
        
        // Use local images only
        const localImageUrl = getLocalImageByTime();
        if (localImageUrl) {
            console.log(`Loading local image: ${localImageUrl}`);
            try {
                await loadBackgroundImage(localImageUrl);
                console.log('Successfully loaded local image');
                return; // Success, exit function
            } catch (error) {
                console.warn('Failed to load local image, using gradient fallback:', error);
            }
        }
        
        // If local image fails, use gradient fallback
        console.warn('Local image failed, using gradient fallback');
        setGradientFallback();
        
    } catch (error) {
        console.error('Error setting background image:', error);
        setGradientFallback();
    }
}

// Helper function to load a local background image
function loadBackgroundImage(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        // Set a shorter timeout for local images
        const timeout = setTimeout(() => {
            reject(new Error('Local image load timeout'));
        }, 5000); // 5 second timeout for local images
        
        img.onload = function() {
            clearTimeout(timeout);
            document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${imageUrl}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
            resolve();
        };
        
        img.onerror = function() {
            clearTimeout(timeout);
            reject(new Error('Local image failed to load'));
        };
        
        img.src = imageUrl;
    });
}

// Get local background images based on time of day
function getLocalImageByTime() {
    const hour = new Date().getHours();
    const body = document.body;
    
    // Local image collections that match specific times of day
    const imageCollections = {
        'early-morning': [
            '../images/early-morning-1.jpg', // Misty pre-dawn landscape
            '../images/early-morning-2.jpg', // Dark blue morning sky
            '../images/early-morning-3.jpg'  // Early morning mist
        ],
        'sunrise': [
            '../images/sunrise-1.jpg', // Ocean sunrise
            '../images/sunrise-2.jpg', // Mountain sunrise
            '../images/sunrise-3.jpg'  // Forest sunrise
        ],
        'morning': [
            '../images/morning-1.jpg', // Bright forest path
            '../images/morning-2.jpg', // Clear lake morning
            '../images/morning-3.jpg'  // Alpine morning
        ],
        'midday': [
            '../images/midday-1.jpg', // Bright mountain peak
            '../images/midday-2.jpg', // Intense ocean midday
            '../images/midday-3.jpg'  // Bright green forest
        ],
        'afternoon': [
            '../images/afternoon-1.jpg', // Warm lake afternoon
            '../images/afternoon-2.jpg', // Golden mountain light
            '../images/afternoon-3.jpg'  // Warm forest afternoon
        ],
        'sunset': [
            '../images/sunset-1.jpg', // Ocean sunset
            '../images/sunset-2.jpg', // Mountain sunset
            '../images/sunset-3.jpg'  // Dramatic sunset sky
        ],
        'twilight': [
            '../images/twilight-1.jpg', // Blue hour twilight
            '../images/twilight-2.jpg', // Purple dusk sky
            '../images/twilight-3.jpg'  // Evening twilight
        ],
        'night': [
            '../images/night-1.jpg', // Starry night sky
            '../images/night-2.jpg', // Night landscape
            '../images/night-3.jpg'  // Moonlit night
        ],
        'late-night': [
            '../images/late-night-1.jpg', // Milky way stars
            '../images/late-night-2.jpg', // Deep night sky
            '../images/late-night-3.jpg'  // Astronomical night
        ]
    };
    
    // Determine current time period
    let timePeriod = 'midday'; // default
    if (body.classList.contains('early-morning')) timePeriod = 'early-morning';
    else if (body.classList.contains('sunrise')) timePeriod = 'sunrise';
    else if (body.classList.contains('morning')) timePeriod = 'morning';
    else if (body.classList.contains('midday')) timePeriod = 'midday';
    else if (body.classList.contains('afternoon')) timePeriod = 'afternoon';
    else if (body.classList.contains('sunset')) timePeriod = 'sunset';
    else if (body.classList.contains('twilight')) timePeriod = 'twilight';
    else if (body.classList.contains('night')) timePeriod = 'night';
    else if (body.classList.contains('late-night')) timePeriod = 'late-night';
    
    // Get random image from the appropriate collection
    const images = imageCollections[timePeriod] || imageCollections['midday'];
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
}

// Fallback gradient backgrounds
function setGradientFallback() {
    const body = document.body;
    
    if (body.classList.contains('early-morning')) {
        body.style.background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)';
    } else if (body.classList.contains('sunrise')) {
        body.style.background = 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 25%, #fecfef 50%, #f093fb 75%, #ff9a9e 100%)';
    } else if (body.classList.contains('morning')) {
        body.style.background = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 25%, #ffd89b 50%, #19547b 75%, #a8edea 100%)';
    } else if (body.classList.contains('midday')) {
        body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #667eea 75%, #764ba2 100%)';
    } else if (body.classList.contains('afternoon')) {
        body.style.background = 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 25%, #ff8a80 50%, #ff7043 75%, #ffecd2 100%)';
    } else if (body.classList.contains('sunset')) {
        body.style.background = 'linear-gradient(135deg, #fa709a 0%, #fee140 25%, #fa709a 50%, #fee140 75%, #fa709a 100%)';
    } else if (body.classList.contains('twilight')) {
        body.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 25%, #667eea 50%, #764ba2 75%, #4facfe 100%)';
    } else if (body.classList.contains('night')) {
        body.style.background = 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #0c0c0c 100%)';
    } else {
        body.style.background = 'linear-gradient(135deg, #000000 0%, #0f0f23 25%, #1a1a2e 50%, #16213e 75%, #000000 100%)';
    }
    
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = 'center';
    body.style.backgroundAttachment = 'fixed';
}

// Background is set once on initial load - no need for additional setup
