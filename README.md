# 🌤️ Weather App - Echtzeit Temperaturabfrage

Eine moderne, responsive Webanwendung zur Abfrage der aktuellen Temperatur in Städten weltweit, basierend auf der **Open-Meteo API**.

## ✨ Features

🎯 **Kernfunktionalitäten:**
- 🌍 Temperaturabfrage für beliebige Städte weltweit
- 🔄 Asynchrone API-Anfragen mit async/await
- ✅ Intelligente Fehlerbehandlung bei falschen Eingaben
- 🎨 Modernes, benutzerfreundliches UI
- ⌨️ Enter-Taste Unterstützung für schnelle Suche
- 📱 Responsive Design für alle Geräte
- 🌐 Zweistufige API-Integration (Geocoding + Wetter)

## 🌐 API-Integration

Die App nutzt zwei APIs für präzise Ergebnisse:

1. **Geocoding API** (Open-Meteo)
   - Konvertiert Stadtnamen in Koordinaten (Latitude/Longitude)
   - Unterstützt internationale Städte

2. **Weather Forecast API** (Open-Meteo)
   - Liefert aktuelle Wetterdaten basierend auf Koordinaten
   - Temperatur in Celsius

```
Benutzer-Input → Geocoding API → Koordinaten → Weather API → Temperatur
```

## 🚀 Verwendung
### im browser 

[matthiaskahlert.github.io/weather_app/](https://matthiaskahlert.github.io/weather_app/)

### Lokal starten:

```bash
# 1. index.html im Browser öffnen
# 2. Stadt eingeben (z.B. "Berlin", "Paris", "New York")
# 3. "Temperatur holen" klicken oder Enter drücken
# 4. Ergebnis wird angezeigt
```

### Mit Live Server (VS Code):
```bash
# Rechtsklick auf index.html
# → "Open with Live Server"
```

## 📁 Projektstruktur

```
weather-app/
├── index.html      # HTML-Struktur & Markup
├── style.css       # Styling & Responsive Design
├── main.js         # API-Logik & Event-Handler
└── README.md       # Diese Datei
```

## 💻 Technologien

| Technologie | Verwendung |
|-------------|-----------|
| **HTML5** | Semantische Struktur |
| **CSS3** | Modern Styling, Flexbox |
| **JavaScript ES6+** | Async/Await, Fetch API |
| **Open-Meteo API** | Geocoding & Weather Data |

## 🔍 Code-Übersicht

### API-Anfrage mit Fehlerbehandlung

```javascript
async function getTemperature(city) {
  try {
    // 1. Stadt zu Koordinaten konvertieren
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}`
    );
    const geoData = await geoResponse.json();
    
    if (!geoData.results) {
      throw new Error("Stadt nicht gefunden");
    }
    
    // 2. Wetter für Koordinaten abrufen
    const { latitude, longitude } = geoData.results[0];
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`
    );
    const weatherData = await weatherResponse.json();
    
    return weatherData.current.temperature_2m;
  } catch (error) {
    throw error;
  }
}
```

### Event-Handler

```javascript
// Button-Klick & Enter-Taste unterstützt
button.addEventListener("click", handleRequest);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") handleRequest();
});
```

## 🎓 Lernziele

Dieses Projekt demonstriert:

| Konzept | Umsetzung |
|---------|-----------|
| **Async/Await** | Moderne asynchrone Programmierung |
| **Fetch API** | HTTP-Requests zu externen APIs |
| **Error Handling** | Try/Catch für robuste Fehlerbehandlung |
| **DOM Manipulation** | Dynamische UI-Updates |
| **Event-Listener** | Click & Keyboard-Events |
| **API-Chaining** | Mehrere API-Calls verketten |
| **JSON Parsing** | Response-Daten verarbeiten |

## 📊 Browser-Kompatibilität

| Browser | Support |
|---------|---------|
| Chrome | ✅ Ab v55 |
| Firefox | ✅ Ab v52 |
| Safari | ✅ Ab v11 |
| Edge | ✅ Ab v15 |

## 🌍 Beispiel-Städte zum Testen

```
✅ Berlin, Hamburg, München
✅ London, Paris, Madrid
✅ New York, Los Angeles, Tokyo
✅ Sydney, Dublin, Stockholm
```

## ⚠️ Bekannte Einschränkungen

- Nur aktuelle Temperatur (keine Vorhersage)
- Keine Wettersymbole/Icons
- Keine Mehrsprachigkeit für Ergebnisse
- Keine Speicherung von Such-Historie

## 🔒 Datenschutz

- ✅ Keine API-Keys erforderlich (Open-Meteo ist frei verfügbar)
- ✅ Keine Benutzer-Daten werden gespeichert
- ✅ Direkte API-Calls ohne Backend

## 🛠️ Geplante Features

- [ ] 7-Tage Wettervorhersage
- [ ] Wettersymbole/Icons
- [ ] Zusätzliche Daten (Luftfeuchtigkeit, Wind, etc.)
- [ ] Such-Historie mit LocalStorage
- [ ] Favoriten-Städte speichern
- [ ] Automatische Standorterkennung (Geolocation API)
- [ ] Unit-Umschaltung (Celsius/Fahrenheit)

## 📝 Lizenz

MIT - Gerne zum Lernen und Weiterentwickeln verwenden!

## 👤 Autor

Entwickelt als JavaScript-Lernprojekt

---

**Viel Spaß beim Wetter checken! ☀️🌧️❄️**
