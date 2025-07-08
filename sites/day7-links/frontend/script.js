// Configuration
const API_BASE_URL = 'https://l.machandler.com';

// DOM Elements
const urlForm = document.getElementById('urlForm');
const originalUrlInput = document.getElementById('originalUrl');
const customShortCodeInput = document.getElementById('customShortCode');
const submitBtn = document.getElementById('submitBtn');
const submitText = document.getElementById('submitText');
const loadingText = document.getElementById('loadingText');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const shortUrlInput = document.getElementById('shortUrl');
const errorText = document.getElementById('errorText');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.querySelector('.theme-icon');

// Theme management
function initializeTheme() {
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const systemTheme = prefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', systemTheme);
        updateThemeIcon(systemTheme);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only update if user hasn't set a manual preference
    if (!localStorage.getItem('theme')) {
        const systemTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', systemTheme);
        updateThemeIcon(systemTheme);
    }
});

// Event Listeners
urlForm.addEventListener('submit', handleSubmit);
themeToggle.addEventListener('click', toggleTheme);

document.addEventListener('DOMContentLoaded', function() {
    console.log('Link Shortener loaded');
    console.log('API Base URL:', API_BASE_URL);
    
    // Initialize theme
    initializeTheme();
    
    // Auto-focus on URL input
    originalUrlInput.focus();
});

// Form submission handler
async function handleSubmit(event) {
    event.preventDefault();
    
    let originalUrl = originalUrlInput.value.trim();
    const customShortCode = customShortCodeInput.value.trim();
    
    if (!originalUrl) {
        showError('Please enter a valid URL');
        return;
    }
    
    // Auto-prefix with http:// if no protocol is provided
    if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
        originalUrl = 'http://' + originalUrl;
    }
    
    // Validate URL format
    if (!isValidUrl(originalUrl)) {
        showError('Please enter a valid URL');
        return;
    }
    
    // Validate custom short code if provided
    if (customShortCode && !isValidShortCode(customShortCode)) {
        showError('Custom short code can only contain letters, numbers, hyphens, and underscores');
        return;
    }
    
    await createShortUrl(originalUrl, customShortCode);
}

// Create short URL via API
async function createShortUrl(originalUrl, customShortCode) {
    setLoading(true);
    hideMessages();
    
    try {
        const requestBody = {
            original_url: originalUrl
        };
        
        if (customShortCode) {
            requestBody.custom_short_code = customShortCode;
        }
        
        console.log('Making API request to:', `${API_BASE_URL}/shorten`);
        console.log('Request body:', requestBody);
        
        const response = await fetch(`${API_BASE_URL}/shorten`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
            const shortUrl = `${API_BASE_URL}/${data.short_code}`;
            showSuccess(shortUrl);
        } else {
            // Handle different error scenarios
            let errorMessage = 'Failed to create short link';
            
            if (response.status === 409) {
                errorMessage = data.detail || 'This custom short code is already taken. Please try a different one.';
            } else if (response.status === 400) {
                errorMessage = data.detail || 'Invalid request. Please check your input.';
            } else if (response.status === 422) {
                errorMessage = 'Invalid input format. Please check your URL and short code.';
            } else if (response.status >= 500) {
                errorMessage = 'Server error. Please try again later.';
            } else if (data.detail) {
                errorMessage = data.detail;
            }
            
            showError(errorMessage);
        }
    } catch (error) {
        console.error('Network error:', error);
        
        // Handle different types of network errors
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showError('Unable to connect to the server. Please check your internet connection and try again.');
        } else if (error.name === 'AbortError') {
            showError('Request timeout. Please try again.');
        } else {
            showError('An unexpected error occurred. Please try again.');
        }
    } finally {
        setLoading(false);
    }
}

// Validation functions
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
        return false;
    }
}

function isValidShortCode(shortCode) {
    const pattern = /^[a-zA-Z0-9\-_]+$/;
    return pattern.test(shortCode) && shortCode.length > 0 && shortCode.length <= 50;
}

// UI state management
function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitText.classList.toggle('hidden', isLoading);
    loadingText.classList.toggle('hidden', !isLoading);
}

function showSuccess(shortUrl) {
    hideMessages();
    shortUrlInput.value = shortUrl;
    successMessage.classList.remove('hidden');
    
    // Auto-focus the short URL for easy copying
    setTimeout(() => {
        shortUrlInput.select();
    }, 100);
}

function showError(message) {
    hideMessages();
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideMessages() {
    successMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

// Copy to clipboard functionality
async function copyToClipboard() {
    const copyBtn = document.getElementById('copyBtn');
    const shortUrl = shortUrlInput.value;
    
    try {
        await navigator.clipboard.writeText(shortUrl);
        
        // Visual feedback
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copy-success');
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copy-success');
        }, 2000);
        
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        
        // Fallback: select the text
        shortUrlInput.select();
        shortUrlInput.setSelectionRange(0, 99999); // For mobile devices
        
        // Try the older method
        try {
            document.execCommand('copy');
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy';
            }, 2000);
        } catch (fallbackError) {
            console.error('Fallback copy failed:', fallbackError);
            alert('Please manually copy the URL: ' + shortUrl);
        }
    }
}

// Reset form for creating another link
function resetForm() {
    urlForm.reset();
    hideMessages();
    originalUrlInput.focus();
}

// Handle Enter key in custom short code input
customShortCodeInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleSubmit(event);
    }
});

// Real-time validation feedback
originalUrlInput.addEventListener('input', function() {
    let url = this.value.trim();
    if (url) {
        // Auto-prefix with http:// if no protocol is provided for validation
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'http://' + url;
        }
        
        if (!isValidUrl(url)) {
            this.setCustomValidity('Please enter a valid URL');
        } else {
            this.setCustomValidity('');
        }
    } else {
        this.setCustomValidity('');
    }
});

customShortCodeInput.addEventListener('input', function() {
    const shortCode = this.value.trim();
    if (shortCode && !isValidShortCode(shortCode)) {
        this.setCustomValidity('Only letters, numbers, hyphens, and underscores allowed');
    } else {
        this.setCustomValidity('');
    }
});

// Handle paste events to auto-validate URLs
originalUrlInput.addEventListener('paste', function() {
    // Give the paste event time to complete
    setTimeout(() => {
        let url = this.value.trim();
        if (url) {
            // Auto-prefix with http:// if no protocol is provided
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'http://' + url;
            }
            
            if (!isValidUrl(url)) {
                showError('Please enter a valid URL');
            } else {
                hideError();
            }
        }
    }, 100);
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + Enter to submit form
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (!submitBtn.disabled) {
            handleSubmit(event);
        }
    }
    
    // Escape to hide messages
    if (event.key === 'Escape') {
        hideMessages();
    }
});

// Service Worker registration (for offline functionality if needed)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment to register service worker
        // navigator.serviceWorker.register('/sw.js');
    });
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isValidUrl,
        isValidShortCode,
        createShortUrl
    };
}
