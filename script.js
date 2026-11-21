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

// ----- SECTION 2: MAP -----

// Center of the Philippines (latitude, longitude) and starting zoom level
const PH_CENTER = [12.88, 121.77];
const START_ZOOM = 6;

// Box around the whole world: [south-west corner, north-east corner]
const WORLD_BOUNDS = [
  [-85, -180],
  [85, 180]
];

// Create the map inside <div id="map">
const map = L.map("map", {
  minZoom: 3,                  // cannot zoom out past one copy of the world
  maxBounds: WORLD_BOUNDS,     // cannot drag the map past the world's edges
  maxBoundsViscosity: 1.0      // makes the edge solid (no bouncing past it)
}).setView(PH_CENTER, START_ZOOM);

// Layer 1: satellite pictures from Esri
L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    noWrap: true,              // do NOT repeat the world left and right
    bounds: WORLD_BOUNDS,
    attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics"
  }
).addTo(map);

// Layer 2: country names, city names and borders on top of the satellite
L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 17,
    noWrap: true,
    bounds: WORLD_BOUNDS
  }
).addTo(map);

// ----- SECTION 3: PICK A SPOT ON THE MAP -----
let selectedMarker = null; // the pin on the map (none yet)
let selectedLat = null;    // chosen latitude
let selectedLon = null;    // chosen longitude

// When the user clicks the map: save the spot, drop a pin, get the weather
map.on("click", async function (event) {
  selectedLat = event.latlng.lat;
  selectedLon = event.latlng.lng;

  if (selectedMarker !== null) {
    map.removeLayer(selectedMarker); // remove the old pin first
  }

  selectedMarker = L.marker([selectedLat, selectedLon]).addTo(map);
  messageEl.textContent =
    "Selected spot: " + selectedLat.toFixed(4) + ", " + selectedLon.toFixed(4);

  const weather = await getWeather(selectedLat, selectedLon);

  if (weather === null) {
    return; // getWeather already showed the error message
  }

  showWeather(weather);
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

// ----- SECTION 5: SHOW WEATHER CARD -----
function showWeather(data) {
  document.getElementById("weather-place").textContent = data.name || "Selected spot";
  document.getElementById("weather-temp").textContent = Math.round(data.main.temp);
  document.getElementById("weather-humidity").textContent = data.main.humidity;
  document.getElementById("weather-wind").textContent = data.wind.speed;

  const iconEl = document.getElementById("weather-icon");
  iconEl.src = "https://openweathermap.org/img/wn/" + data.weather[0].icon + "@2x.png";
  iconEl.alt = data.weather[0].description;
}
// ----- RESET WEATHER CARD -----
// Clears the card. Used for "Loading..." and for errors.
// placeText = the message to show in the place line
function resetWeatherCard(placeText) {
  // Show the message in the place line (id="weather-place")
  document.getElementById("weather-place").textContent = placeText;

  // Put "--" back so old numbers never stay on the card
  document.getElementById("weather-temp").textContent = "--";
  document.getElementById("weather-humidity").textContent = "--";
  document.getElementById("weather-wind").textContent = "--";

  // Hide the icon picture until new weather arrives
  document.getElementById("weather-icon").hidden = true;
}