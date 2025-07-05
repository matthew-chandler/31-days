class PopulationExplorer {
    constructor() {
        this.selectedCountries = new Map();
        this.currentChart = null;
        this.allCountries = [];
        this.populationData = [];
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadCountries();
        this.initializeYearSelectors();
    }

    initializeElements() {
        this.searchInput = document.getElementById('countrySearch');
        this.dropdown = document.getElementById('dropdown');
        this.countryTags = document.getElementById('countryTags');
        this.queryBtn = document.getElementById('queryBtn');
        this.loading = document.getElementById('loading');
        this.resultsSection = document.getElementById('resultsSection');
        this.chartContainer = document.getElementById('chartContainer');
        this.tableContainer = document.getElementById('tableContainer');
        this.toggleBtn = document.getElementById('toggleChart');
        this.downloadBtn = document.getElementById('downloadData');
        this.startYearSelect = document.getElementById('startYear');
        this.endYearSelect = document.getElementById('endYear');
        this.statsSummary = document.getElementById('statsSummary');
    }

    initializeEventListeners() {
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.searchInput.addEventListener('focus', () => this.showDropdown());
        this.searchInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.queryBtn.addEventListener('click', () => this.queryPopulationData());
        this.toggleBtn.addEventListener('click', () => this.toggleView());
        this.downloadBtn.addEventListener('click', () => this.downloadData());
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) && !this.dropdown.contains(e.target)) {
                this.hideDropdown();
            }
        });
    }

    initializeYearSelectors() {
        const currentYear = new Date().getFullYear();
        const startYear = 1960;
        
        // Populate year selectors
        for (let year = currentYear - 1; year >= startYear; year--) {
            const startOption = document.createElement('option');
            startOption.value = year;
            startOption.textContent = year;
            this.startYearSelect.appendChild(startOption);
            
            const endOption = document.createElement('option');
            endOption.value = year;
            endOption.textContent = year;
            this.endYearSelect.appendChild(endOption);
        }
        
        // Set default values - start from 1960 to show full historical range
        this.startYearSelect.value = 1960;
        this.endYearSelect.value = currentYear - 1;
    }

    async loadCountries() {
        try {
            const response = await fetch('https://api.worldbank.org/v2/country?format=json&per_page=300');
            const data = await response.json();
            
            if (data && data[1]) {
                this.allCountries = data[1]
                    .filter(country => country.capitalCity && country.region.value !== 'Aggregates')
                    .map(country => ({
                        id: country.id,
                        name: country.name,
                        capital: country.capitalCity,
                        region: country.region.value
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name));
            }
        } catch (error) {
            console.error('Error loading countries:', error);
            this.showError('Failed to load countries. Please try again.');
        }
    }

    handleKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            
            if (e.ctrlKey || e.metaKey) {
                // Ctrl+Enter or Cmd+Enter to query data
                if (this.selectedCountries.size > 0) {
                    this.queryPopulationData();
                }
            } else {
                // Enter to select top country from dropdown
                const dropdownItems = this.dropdown.querySelectorAll('.dropdown-item');
                if (dropdownItems.length > 0 && this.dropdown.style.display !== 'none') {
                    const firstItem = dropdownItems[0];
                    // Extract country data from the first item
                    const countryName = firstItem.querySelector('strong').textContent;
                    const country = this.allCountries.find(c => c.name === countryName);
                    if (country && !this.selectedCountries.has(country.id)) {
                        this.selectCountry(country);
                    }
                }
            }
        } else if (e.key === 'Escape') {
            // Escape to close dropdown
            this.hideDropdown();
            this.searchInput.blur();
        }
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.hideDropdown();
            return;
        }

        const filteredCountries = this.allCountries.filter(country =>
            country.name.toLowerCase().includes(query.toLowerCase()) &&
            !this.selectedCountries.has(country.id)
        );

        this.displayDropdownItems(filteredCountries.slice(0, 10));
        this.showDropdown();
    }

    displayDropdownItems(countries) {
        this.dropdown.innerHTML = '';
        
        countries.forEach(country => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerHTML = `
                <div>
                    <strong>${country.name}</strong>
                    <br>
                    <small>${country.capital} • ${country.region}</small>
                </div>
            `;
            item.addEventListener('click', () => this.selectCountry(country));
            this.dropdown.appendChild(item);
        });

        if (countries.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'dropdown-item';
            noResults.textContent = 'No countries found';
            noResults.style.color = '#999';
            this.dropdown.appendChild(noResults);
        }
    }

    selectCountry(country) {
        this.selectedCountries.set(country.id, country);
        this.searchInput.value = '';
        this.hideDropdown();
        this.updateCountryTags();
        this.updateQueryButton();
    }

    removeCountry(countryId) {
        this.selectedCountries.delete(countryId);
        this.updateCountryTags();
        this.updateQueryButton();
    }

    updateCountryTags() {
        this.countryTags.innerHTML = '';
        
        this.selectedCountries.forEach((country, id) => {
            const tag = document.createElement('div');
            tag.className = 'country-tag';
            tag.innerHTML = `
                <span>${country.name}</span>
                <span class="remove" data-country-id="${id}">×</span>
            `;
            
            tag.querySelector('.remove').addEventListener('click', () => this.removeCountry(id));
            this.countryTags.appendChild(tag);
        });
    }

    updateQueryButton() {
        this.queryBtn.disabled = this.selectedCountries.size === 0;
    }

    showDropdown() {
        this.dropdown.style.display = 'block';
    }

    hideDropdown() {
        this.dropdown.style.display = 'none';
    }

    async queryPopulationData() {
        if (this.selectedCountries.size === 0) return;

        this.showLoading();
        this.hideResults();

        try {
            const startYear = this.startYearSelect.value;
            const endYear = this.endYearSelect.value;
            const countryIds = Array.from(this.selectedCountries.keys()).join(';');
            
            const url = `https://api.worldbank.org/v2/country/${countryIds}/indicator/SP.POP.TOTL?date=${startYear}:${endYear}&format=json&per_page=1000`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data && data[1]) {
                this.populationData = this.processPopulationData(data[1]);
                this.displayResults();
            } else {
                throw new Error('No data received from API');
            }
            
        } catch (error) {
            console.error('Error fetching population data:', error);
            this.showError('Failed to fetch population data. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    processPopulationData(rawData) {
        const processedData = {};
        
        rawData.forEach(entry => {
            if (entry.value !== null) {
                const countryId = entry.country.id;
                const year = parseInt(entry.date);
                const population = entry.value;
                
                if (!processedData[countryId]) {
                    processedData[countryId] = {
                        country: entry.country.value,
                        data: []
                    };
                }
                
                processedData[countryId].data.push({ year, population });
            }
        });
        
        // Sort data by year for each country
        Object.values(processedData).forEach(countryData => {
            countryData.data.sort((a, b) => a.year - b.year);
        });
        
        return processedData;
    }

    displayResults() {
        this.createChart();
        this.createTable();
        this.createStatsSummary();
        this.showResults();
        this.scrollToResults();
    }

    scrollToResults() {
        // Small delay to ensure the results section is visible before scrolling
        setTimeout(() => {
            this.resultsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
        }, 100);
    }

    createChart() {
        const ctx = document.getElementById('populationChart').getContext('2d');
        
        if (this.currentChart) {
            this.currentChart.destroy();
        }

        const datasets = Object.entries(this.populationData).map(([countryId, countryData], index) => {
            const colors = [
                '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
                '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
                '#d299c2', '#fef9d7', '#667eea', '#764ba2'
            ];
            
            return {
                label: countryData.country,
                data: countryData.data.map(item => ({
                    x: item.year,
                    y: item.population
                })),
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '20',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            };
        });

        this.currentChart = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Year',
                            font: { size: 14, weight: 'bold' }
                        },
                        ticks: {
                            callback: function(value) {
                                return Math.round(value).toString(); // Remove commas from years
                            }
                        },
                        grid: { color: '#f0f0f0' }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Population',
                            font: { size: 14, weight: 'bold' }
                        },
                        ticks: {
                            callback: value => this.formatNumber(value)
                        },
                        grid: { color: '#f0f0f0' }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Population Trends Over Time',
                        font: { size: 18, weight: 'bold' },
                        padding: 20
                    },
                    legend: {
                        position: 'top',
                        labels: { usePointStyle: true, padding: 20 }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${this.formatNumber(context.raw.y)}`;
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    createTable() {
        const table = document.getElementById('populationTable');
        const thead = document.getElementById('tableHead');
        const tbody = document.getElementById('tableBody');
        
        // Clear existing content
        thead.innerHTML = '';
        tbody.innerHTML = '';
        
        // Get all unique years
        const allYears = new Set();
        Object.values(this.populationData).forEach(countryData => {
            countryData.data.forEach(item => allYears.add(item.year));
        });
        const sortedYears = Array.from(allYears).sort((a, b) => a - b);
        
        // Create header
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>Country</th>';
        sortedYears.forEach(year => {
            headerRow.innerHTML += `<th>${year}</th>`;
        });
        thead.appendChild(headerRow);
        
        // Create rows
        Object.entries(this.populationData).forEach(([countryId, countryData]) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${countryData.country}</td>`;
            
            sortedYears.forEach(year => {
                const dataPoint = countryData.data.find(item => item.year === year);
                const population = dataPoint ? this.formatNumber(dataPoint.population) : '-';
                row.innerHTML += `<td>${population}</td>`;
            });
            
            tbody.appendChild(row);
        });
    }

    createStatsSummary() {
        const summary = document.getElementById('statsSummary');
        summary.innerHTML = '';
        
        // Calculate statistics
        const stats = this.calculateStatistics();
        
        const statCards = [
            {
                title: 'Countries Selected',
                value: this.selectedCountries.size,
                description: 'Total countries in analysis'
            },
            {
                title: 'Most Populous (Latest)',
                value: stats.mostPopulous.name,
                description: `${this.formatNumber(stats.mostPopulous.population)} people`
            },
            {
                title: 'Fastest Growing',
                value: stats.fastestGrowing.name,
                description: `${stats.fastestGrowing.rate.toFixed(2)}% average annual growth`
            },
            {
                title: 'Total Population',
                value: this.formatNumber(stats.totalPopulation),
                description: 'Combined latest population'
            }
        ];
        
        statCards.forEach(stat => {
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <h4>${stat.title}</h4>
                <div class="value">${stat.value}</div>
                <div class="description">${stat.description}</div>
            `;
            summary.appendChild(card);
        });
    }

    calculateStatistics() {
        let mostPopulous = { name: '', population: 0 };
        let fastestGrowing = { name: '', rate: 0 };
        let totalPopulation = 0;
        
        Object.entries(this.populationData).forEach(([countryId, countryData]) => {
            const latestData = countryData.data[countryData.data.length - 1];
            
            // Most populous
            if (latestData && latestData.population > mostPopulous.population) {
                mostPopulous = {
                    name: countryData.country,
                    population: latestData.population
                };
            }
            
            // Total population
            if (latestData) {
                totalPopulation += latestData.population;
            }
            
            // Growth rate calculation
            if (countryData.data.length > 1) {
                const firstData = countryData.data[0];
                const years = latestData.year - firstData.year;
                const growthRate = (Math.pow(latestData.population / firstData.population, 1/years) - 1) * 100;
                
                if (growthRate > fastestGrowing.rate) {
                    fastestGrowing = {
                        name: countryData.country,
                        rate: growthRate
                    };
                }
            }
        });
        
        return { mostPopulous, fastestGrowing, totalPopulation };
    }

    toggleView() {
        const isChartVisible = this.chartContainer.style.display !== 'none';
        
        if (isChartVisible) {
            this.chartContainer.style.display = 'none';
            this.tableContainer.style.display = 'block';
            this.toggleBtn.textContent = 'Switch to Chart View';
        } else {
            this.chartContainer.style.display = 'block';
            this.tableContainer.style.display = 'none';
            this.toggleBtn.textContent = 'Switch to Table View';
        }
    }

    downloadData() {
        const csvData = this.convertToCSV();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `population_data_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        window.URL.revokeObjectURL(url);
    }

    convertToCSV() {
        const headers = ['Country', 'Year', 'Population'];
        const rows = [headers.join(',')];
        
        Object.entries(this.populationData).forEach(([countryId, countryData]) => {
            countryData.data.forEach(item => {
                rows.push(`"${countryData.country}",${item.year},${item.population}`);
            });
        });
        
        return rows.join('\n');
    }

    formatNumber(num) {
        if (num >= 1e9) {
            return (num / 1e9).toFixed(2) + 'B';
        } else if (num >= 1e6) {
            return (num / 1e6).toFixed(2) + 'M';
        } else if (num >= 1e3) {
            return (num / 1e3).toFixed(2) + 'K';
        }
        return num.toLocaleString();
    }

    showLoading() {
        this.loading.style.display = 'block';
    }

    hideLoading() {
        this.loading.style.display = 'none';
    }

    showResults() {
        this.resultsSection.style.display = 'block';
    }

    hideResults() {
        this.resultsSection.style.display = 'none';
    }

    showError(message) {
        alert(message); // In a production app, you'd want a more elegant error display
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopulationExplorer();
});
