/**
 * ============================================
 * WEATHER APP - Open-Meteo API Integration
 * ============================================
 * Temperaturabfrage für Städte weltweit
 */

// ============================================
// KONFIGURATION
// ============================================
const CONFIG = {
    GEOCODING_API: 'https://geocoding-api.open-meteo.com/v1/search',
    WEATHER_API: 'https://api.open-meteo.com/v1/forecast',
    CACHE_DURATION: 5 * 60 * 1000, // 5 Minuten
    DEBOUNCE_DELAY: 300 // ms
};

// ============================================
// DOM ELEMENTE
// ============================================
const DOM = {
    form: document.getElementById('weatherForm'),
    input: document.getElementById('cityInput'),
    button: document.getElementById('getTempButton'),
    result: document.getElementById('result'),
    error: document.getElementById('error'),
    loading: document.getElementById('loading'),
    mapWrapper: document.getElementById('mapWrapper'),
    mapFrame: document.getElementById('mapFrame'),
    locationMeta: document.getElementById('locationMeta')
};

// ============================================
// CACHE FÜR API-REQUESTS
// ============================================
const Cache = {
    data: new Map(),

    set(key, value) {
        this.data.set(key, {
            value,
            timestamp: Date.now()
        });
    },

    get(key) {
        const item = this.data.get(key);
        if (!item) return null;

        // Cache expired?
        if (Date.now() - item.timestamp > CONFIG.CACHE_DURATION) {
            this.data.delete(key);
            return null;
        }

        return item.value;
    },

    clear() {
        this.data.clear();
    }
};

// ============================================
// UI HELPER
// ============================================
const UI = {
    /**
     * Loading-State anzeigen
     */
    showLoading() {
        DOM.loading?.classList.remove('hidden');
        DOM.result.textContent = '';
        DOM.error?.classList.add('hidden');
        DOM.mapWrapper?.classList.add('hidden');
        DOM.button.disabled = true;
    },

    /**
     * Loading-State verbergen
     */
    hideLoading() {
        DOM.loading?.classList.add('hidden');
        DOM.button.disabled = false;
    },

    /**
     * Erfolgreiche Temperatur anzeigen
     */
    showResult(city, temperature, country = '') {
        this.hideLoading();
        const countryFlag = country ? ` (${country})` : '';
        DOM.result.innerHTML = `
            <div class="weather-icon">🌡️</div>
            <p>Die aktuelle Temperatur in <strong>${this.escapeHtml(city)}${countryFlag}</strong></p>
            <p style="font-size: 2.5rem; margin: 1rem 0;">${temperature}°C</p>
            <small style="color: var(--text-muted);">Daten von Open-Meteo API</small>
        `;
        DOM.result.classList.remove('hidden');
    },

     /**
     * OSM-Karte mit Marker anzeigen
     */
    showMap(location) {
        if (!DOM.mapWrapper || !DOM.mapFrame || !DOM.locationMeta) {
            return;
        }

        const lat = Number(location.latitude);
        const lon = Number(location.longitude);

        if (Number.isNaN(lat) || Number.isNaN(lon)) {
            DOM.mapWrapper.classList.add('hidden');
            return;
        }

        const delta = 0.05;
        const left = lon - delta;
        const right = lon + delta;
        const top = lat + delta;
        const bottom = lat - delta;

        const bbox = `${left},${bottom},${right},${top}`;
        const marker = `${lat},${lon}`;
        const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(marker)}`;

        DOM.mapFrame.src = mapUrl;
        DOM.locationMeta.textContent = `Gefundener Ort: ${location.name}${location.country ? ` (${location.country})` : ''} | Koordinaten: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        DOM.mapWrapper.classList.remove('hidden');
    },
    
    /**
     * Fehler anzeigen
     */
    showError(message) {
        this.hideLoading();
        DOM.result.textContent = '';
        DOM.mapWrapper?.classList.add('hidden');
        if (DOM.error) {
            DOM.error.textContent = `⚠️ ${message}`;
            DOM.error.classList.remove('hidden');
        } else {
            DOM.result.textContent = `⚠️ ${message}`;
        }
    },

    /**
     * HTML-Escaping gegen XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ============================================
// INPUT VALIDIERUNG
// ============================================
const Validation = {
    /**
     * Stadt-Input validieren
     */
    validateCity(city) {
        const trimmed = city.trim();

        if (!trimmed) {
            throw new Error('Bitte eine Stadt eingeben');
        }

        if (trimmed.length < 2) {
            throw new Error('Stadt muss mindestens 2 Zeichen haben');
        }

        if (trimmed.length > 50) {
            throw new Error('Stadt darf maximal 50 Zeichen haben');
        }

        // Nur Buchstaben, Leerzeichen, Bindestriche erlaubt
        if (!/^[a-zA-ZäöüÄÖÜß\s\-]+$/.test(trimmed)) {
            throw new Error('Ungültige Zeichen im Stadtnamen');
        }

        return trimmed;
    }
};

// ============================================
// API CALLS
// ============================================
const API = {
    /**
     * Koordinaten für Stadt abrufen (Geocoding)
     */
    async getCoordinates(city) {
        const response = await fetch(
            `${CONFIG.GEOCODING_API}?name=${encodeURIComponent(city)}&count=1&language=de&format=json`
        );

        if (!response.ok) {
            throw new Error(`Geocoding API Fehler: ${response.status}`);
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            throw new Error(`Stadt "${city}" wurde nicht gefunden`);
        }

        return {
            latitude: data.results[0].latitude,
            longitude: data.results[0].longitude,
            name: data.results[0].name,
            country: data.results[0].country || ''
        };
    },

    /**
     * Wetter für Koordinaten abrufen
     */
    async getWeather(latitude, longitude) {
        const response = await fetch(
            `${CONFIG.WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`
        );

        if (!response.ok) {
            throw new Error(`Weather API Fehler: ${response.status}`);
        }

        const data = await response.json();

        if (!data.current || data.current.temperature_2m === undefined) {
            throw new Error('Keine Wetterdaten verfügbar');
        }

        return data.current.temperature_2m;
    },

    /**
     * Kompletter Weather-Request mit Caching
     */
    async getTemperature(city) {
        // Cache prüfen
        const cached = Cache.get(city.toLowerCase());
        if (cached) {
            console.log('📦 Daten aus Cache:', city);
            return cached;
        }

        try {
            // 1. Koordinaten abrufen
            const location = await this.getCoordinates(city);
            console.log('📍 Koordinaten:', location);

            // 2. Wetter abrufen
            const temperature = await this.getWeather(
                location.latitude,
                location.longitude
            );
            console.log('🌡️ Temperatur:', temperature);

            const result = {
                city: location.name,
                country: location.country,
                latitude: location.latitude,
                longitude: location.longitude,
                temperature
            };

            // In Cache speichern
            Cache.set(city.toLowerCase(), result);

            return result;

        } catch (error) {
            console.error('❌ API-Fehler:', error);
            throw error;
        }
    }
};

// ============================================
// EVENT HANDLER
// ============================================
let debounceTimer;

/**
 * Hauptfunktion: Temperatur abrufen
 */
async function handleRequest(event) {
    if (event) event.preventDefault();

    try {
        // Input validieren
        const city = Validation.validateCity(DOM.input.value);

        // Loading anzeigen
        UI.showLoading();

        // API-Request
        const data = await API.getTemperature(city);

        // Ergebnis anzeigen
        UI.showResult(data.city, data.temperature, data.country);

    } catch (error) {
        UI.showError(error.message);
        UI.showMap(data);
    }
}

/**
 * Debounced Input Handler (für Autocomplete später)
 */
function handleInputChange() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        // Hier könnte Autocomplete implementiert werden
        console.log('🔍 Input:', DOM.input.value);
    }, CONFIG.DEBOUNCE_DELAY);
}

// ============================================
// INIT - EVENT LISTENER
// ============================================
function initApp() {
    console.log('🚀 Weather App startet...');

    // Form Submit
    DOM.form?.addEventListener('submit', handleRequest);

    // Button Click (falls kein Form)
    DOM.button?.addEventListener('click', handleRequest);

    // Enter-Taste im Input
    DOM.input?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleRequest();
        }
    });

    // Input-Änderungen (für spätere Features)
    DOM.input?.addEventListener('input', handleInputChange);

    // Cache bei Seitenverlassen leeren (optional)
    window.addEventListener('beforeunload', () => {
        Cache.clear();
    });

    console.log('✅ App bereit!');
}

// App starten
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}




//## ✨ Zusätzliche Features (optional)

//### 1. **Autocomplete für Städte**

async function getCitySuggestions(query) {
    const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5`
    );
    const data = await response.json();
    return data.results || [];
}


//### 2. **Erweiterte Wetterdaten**

// Mehr Daten abrufen
`...&current=temperature_2m,relative_humidity_2m,windspeed_10m`


//### 3. **7-Tage-Vorhersage**

//`...&daily=temperature_2m_max,temperature_2m_min&timezone=Europe/Berlin`


//### 4. **Geolocation (aktueller Standort)**

function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            pos => resolve([pos.coords.latitude, pos.coords.longitude]),
            error => reject(error)
        );
    });
}


//### 5. **Favoriten speichern (LocalStorage)**

const Favorites = {
    get() {
        return JSON.parse(localStorage.getItem('favorites') || '[]');
    },
    add(city) {
        const favs = this.get();
        if (!favs.includes(city)) {
            favs.push(city);
            localStorage.setItem('favorites', JSON.stringify(favs));
        }
    }
};
