const API_BASE_URL = 'http://localhost:3000/api';

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
}

// Trip Planner
document.getElementById('tripPlannerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const resultsDiv = document.getElementById('trip-results');
    resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Planning your perfect trip...</p></div>';
    
    const data = {
        origin: document.getElementById('trip-origin').value.toUpperCase(),
        destination: document.getElementById('trip-destination').value.toUpperCase(),
        departureDate: document.getElementById('trip-departure').value,
        returnDate: document.getElementById('trip-return').value,
        budget: parseFloat(document.getElementById('trip-budget').value),
        passengers: parseInt(document.getElementById('trip-passengers').value),
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/trip-planner/plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayTripPlan(result, resultsDiv);
        } else {
            resultsDiv.innerHTML = `<div class="error">${result.message}</div>`;
        }
    } catch (error) {
        resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
});

function displayTripPlan(plan, container) {
    let html = '<div class="results">';
    
    // Budget breakdown
    html += `
        <div class="result-card">
            <h3>💰 Budget Breakdown</h3>
            <div class="detail-row">
                <span>Total Budget:</span>
                <span class="price">$${plan.budget.total}</span>
            </div>
            <div class="detail-row">
                <span>Flights:</span>
                <span>$${plan.budget.flights.toFixed(2)}</span>
            </div>
            <div class="detail-row">
                <span>Accommodation Budget:</span>
                <span>$${plan.budget.accommodation.toFixed(2)}</span>
            </div>
            <div class="detail-row">
                <span>Estimated Total:</span>
                <span class="price">$${plan.budget.estimated.toFixed(2)}</span>
            </div>
            <div class="detail-row">
                <span>Number of Nights:</span>
                <span>${plan.nights}</span>
            </div>
        </div>
    `;
    
    // AI Recommendation
    if (plan.aiRecommendation) {
        html += `
            <div class="result-card">
                <h3>🤖 AI Travel Advisor</h3>
                <div class="ai-recommendation">${plan.aiRecommendation}</div>
            </div>
        `;
    }
    
    // Top Flights
    html += '<h3 style="margin: 20px 0;">✈️ Recommended Flights</h3>';
    plan.flights.slice(0, 3).forEach((flight, index) => {
        html += `
            <div class="result-card">
                <h3>Flight Option ${index + 1}</h3>
                <div class="price">$${flight.price.total} ${flight.price.currency}</div>
                <div class="flight-details">
                    ${flight.itineraries.map((itinerary, i) => `
                        <div>
                            <strong>${i === 0 ? 'Outbound' : 'Return'}:</strong>
                            ${itinerary.segments.map(seg => `
                                <div class="detail-row">
                                    <span>${seg.departure.airport} → ${seg.arrival.airport}</span>
                                    <span>${seg.carrier} ${seg.flightNumber}</span>
                                </div>
                            `).join('')}
                            <div class="detail-row">
                                <span>Duration:</span>
                                <span>${itinerary.duration}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    // Top Accommodations
    if (plan.accommodations && plan.accommodations.length > 0) {
        html += '<h3 style="margin: 20px 0;">🏠 Recommended Stays</h3>';
        plan.accommodations.slice(0, 3).forEach((acc, index) => {
            html += `
                <div class="result-card">
                    <h3>${acc.name}</h3>
                    <div class="price">$${acc.price.rate}/night (Total: $${(acc.price.rate * plan.nights).toFixed(2)})</div>
                    <div class="accommodation-details">
                        <div class="detail-row">
                            <span>Type:</span>
                            <span>${acc.type}</span>
                        </div>
                        <div class="detail-row">
                            <span>Rating:</span>
                            <span>⭐ ${acc.rating} (${acc.reviewsCount} reviews)</span>
                        </div>
                        <div class="detail-row">
                            <span>Bedrooms:</span>
                            <span>${acc.bedrooms} bedroom(s), ${acc.beds} bed(s)</span>
                        </div>
                        <div class="detail-row">
                            <span>Location:</span>
                            <span>${acc.location.city}, ${acc.location.country}</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Flight Search
document.getElementById('flightSearchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const resultsDiv = document.getElementById('flight-results');
    resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Searching for flights...</p></div>';
    
    const data = {
        origin: document.getElementById('flight-origin').value.toUpperCase(),
        destination: document.getElementById('flight-destination').value.toUpperCase(),
        departureDate: document.getElementById('flight-departure').value,
        returnDate: document.getElementById('flight-return').value || null,
        passengers: parseInt(document.getElementById('flight-passengers').value),
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/flights/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayFlights(result.data, resultsDiv);
        } else {
            resultsDiv.innerHTML = `<div class="error">${result.error}</div>`;
        }
    } catch (error) {
        resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
});

function displayFlights(flights, container) {
    if (flights.length === 0) {
        container.innerHTML = '<div class="error">No flights found. Try different dates or airports.</div>';
        return;
    }
    
    let html = '<div class="results"><h3>Found ' + flights.length + ' flights</h3>';
    
    flights.slice(0, 10).forEach((flight, index) => {
        html += `
            <div class="result-card">
                <h3>Flight ${index + 1}</h3>
                <div class="price">$${flight.price.total} ${flight.price.currency}</div>
                <div class="flight-details">
                    ${flight.itineraries.map((itinerary, i) => `
                        <div>
                            <strong>${i === 0 ? 'Outbound' : 'Return'}:</strong>
                            ${itinerary.segments.map(seg => `
                                <div class="detail-row">
                                    <span>${seg.departure.airport} → ${seg.arrival.airport}</span>
                                    <span>${new Date(seg.departure.time).toLocaleString()}</span>
                                </div>
                                <div class="detail-row">
                                    <span>Flight:</span>
                                    <span>${seg.carrier} ${seg.flightNumber}</span>
                                </div>
                            `).join('')}
                            <div class="detail-row">
                                <span>Duration:</span>
                                <span>${itinerary.duration}</span>
                            </div>
                        </div>
                    `).join('')}
                    <div class="detail-row">
                        <span>Available Seats:</span>
                        <span>${flight.numberOfBookableSeats}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Last-Minute Deals
document.getElementById('lastMinuteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const resultsDiv = document.getElementById('lastminute-results');
    resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Finding last-minute deals...</p></div>';
    
    const origin = document.getElementById('lastminute-origin').value.toUpperCase();
    const maxPrice = document.getElementById('lastminute-maxprice').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/flights/last-minute-deals?origin=${origin}&maxPrice=${maxPrice}`);
        const result = await response.json();
        
        if (result.success) {
            displayLastMinuteDeals(result.data, resultsDiv);
        } else {
            resultsDiv.innerHTML = `<div class="error">${result.error}</div>`;
        }
    } catch (error) {
        resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
});

function displayLastMinuteDeals(deals, container) {
    if (deals.length === 0) {
        container.innerHTML = '<div class="error">No last-minute deals found. Try increasing your max price.</div>';
        return;
    }
    
    let html = '<div class="results"><h3>🎉 Found ' + deals.length + ' last-minute deals!</h3>';
    
    deals.forEach((deal, index) => {
        html += `
            <div class="result-card">
                <h3>Deal ${index + 1}: ${deal.destination}</h3>
                <div class="price">$${deal.price.total}</div>
                <div class="detail-row">
                    <span>Departure:</span>
                    <span>${deal.departureDate}</span>
                </div>
                <div class="detail-row">
                    <span>Return:</span>
                    <span>${deal.returnDate || 'One-way'}</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Accommodations Search
document.getElementById('accommodationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const resultsDiv = document.getElementById('accommodation-results');
    resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Searching for accommodations...</p></div>';
    
    const data = {
        location: document.getElementById('acc-location').value,
        checkIn: document.getElementById('acc-checkin').value,
        checkOut: document.getElementById('acc-checkout').value,
        guests: parseInt(document.getElementById('acc-guests').value),
        maxPrice: document.getElementById('acc-maxprice').value ? parseFloat(document.getElementById('acc-maxprice').value) : null,
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/accommodation/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayAccommodations(result.data, resultsDiv);
        } else {
            resultsDiv.innerHTML = `<div class="error">${result.error}</div>`;
        }
    } catch (error) {
        resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
});

function displayAccommodations(accommodations, container) {
    if (accommodations.length === 0) {
        container.innerHTML = '<div class="error">No accommodations found. Try adjusting your search criteria.</div>';
        return;
    }
    
    let html = '<div class="results"><h3>Found ' + accommodations.length + ' stays</h3>';
    
    accommodations.forEach((acc, index) => {
        html += `
            <div class="result-card">
                <h3>${acc.name}</h3>
                <div class="price">$${acc.price.rate}/night</div>
                <div class="accommodation-details">
                    <div class="detail-row">
                        <span>Type:</span>
                        <span>${acc.type}</span>
                    </div>
                    <div class="detail-row">
                        <span>Rating:</span>
                        <span>⭐ ${acc.rating} (${acc.reviewsCount} reviews)</span>
                    </div>
                    <div class="detail-row">
                        <span>Bedrooms:</span>
                        <span>${acc.bedrooms} bedroom(s), ${acc.beds} bed(s), ${acc.bathrooms} bathroom(s)</span>
                    </div>
                    <div class="detail-row">
                        <span>Location:</span>
                        <span>${acc.location.city}, ${acc.location.country}</span>
                    </div>
                    ${acc.amenities && acc.amenities.length > 0 ? `
                        <div class="detail-row">
                            <span>Amenities:</span>
                            <span>${acc.amenities.slice(0, 5).join(', ')}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Set minimum dates to today
const today = new Date().toISOString().split('T')[0];
document.querySelectorAll('input[type="date"]').forEach(input => {
    input.min = today;
});
