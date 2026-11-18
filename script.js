// ===== EventCast: script.js =====

// ----- SECTION 1: API KEY -----
// Holds the key in memory only. It is erased when the page reloads.
let apiKey = "";

// Elements from index.html (names match the ids there)
const keyInput = document.getElementById("api-key");
const saveKeyBtn = document.getElementById("save-key-btn");
const messageEl = document.getElementById("message");

// When Save Key is clicked: check the key, store it, clear the box
saveKeyBtn.addEventListener("click", function () {
  const typedKey = keyInput.value.trim(); // remove extra spaces

  if (typedKey === "") {
    messageEl.textContent = "Please paste your API key first.";
    return; // stop here if the box is empty
  }

  apiKey = typedKey;
  keyInput.value = ""; // clear the box so the key is not on screen
  messageEl.textContent = "API key saved for this visit.";
});

// ----- SECTION 2: MAP (coming in Piece C) -----

// Center of the Philippines (latitude, longitude) and starting zoom level
const PH_CENTER = [12.88, 121.77];
const START_ZOOM = 6;

// Create the map inside <div id="map">
const map = L.map("map").setView(PH_CENTER, START_ZOOM);

// Satellite pictures from Esri (replaces the OpenStreetMap tiles)
L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 17,
    attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics"
  }
).addTo(map);

// ----- SECTION 3: PICK A SPOT ON THE MAP -----
let selectedMarker = null; // the pin on the map (none yet)
let selectedLat = null;    // chosen latitude
let selectedLon = null;    // chosen longitude

// When the user clicks the map: save the spot and drop a pin
map.on("click", function (event) {
  selectedLat = event.latlng.lat;
  selectedLon = event.latlng.lng;

  if (selectedMarker !== null) {
    map.removeLayer(selectedMarker); // remove the old pin first
  }

  selectedMarker = L.marker([selectedLat, selectedLon]).addTo(map);
  messageEl.textContent =
    "Selected spot: " + selectedLat.toFixed(4) + ", " + selectedLon.toFixed(4);
});

// ----- SECTION 4: GET WEATHER -----
async function getWeather(lat, lon) {
  if (apiKey === "") {
    messageEl.textContent = "Please save your API key first.";
    return null;
  }

  const url = "https://api.openweathermap.org/data/2.5/weather" +
    "?lat=" + lat + "&lon=" + lon +
    "&units=metric&appid=" + apiKey;

  try {
    const response = await fetch(url);
    if (response.status === 401) {
      messageEl.textContent = "Invalid API key. Check it and save again.";
      return null;
    }
    if (!response.ok) {
      messageEl.textContent = "Weather error: " + response.status;
      return null;
    }
    return await response.json();
  } catch (error) {
    messageEl.textContent = "Cannot reach the weather service.";
    return null;
  }
}