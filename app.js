const API_KEY = "bee161f638857c8d53330dca1d83fea3";

const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

const HISTORY_KEY = "weatherHistory";

const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const weatherResult = document.getElementById("weatherResult");

const cityName = document.getElementById("cityName");
const weatherIcon = document.getElementById("weatherIcon");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const humidity = document.getElementById("humidity");

const historyList = document.getElementById("historyList");
const forecastList = document.getElementById("forecastList");

const celsiusBtn = document.getElementById("celsiusBtn");
const fahrenheitBtn = document.getElementById("fahrenheitBtn");

let currentUnit = "C";
let currentTemperature = null;
let forecastData = [];

const getWeather = async (city) => {
    loading.style.display = "block";
    error.style.display = "none";
    weatherResult.style.display = "none";

    try {
        const weatherUrl =
            `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=id`;

        const forecastUrl =
            `${FORECAST_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=id`;

        const response = await fetch(weatherUrl);
        const forecastResponse = await fetch(forecastUrl);

        if (response.status === 404 || forecastResponse.status === 404) {
            throw new Error("Kota tidak ditemukan. Coba periksa nama kota.");
        }

        if (!response.ok || !forecastResponse.ok) {
            throw new Error("Terjadi kesalahan pada server.");
        }

        const data = await response.json();
        const forecast = await forecastResponse.json();

        displayWeather(data);

        forecastData = forecast.list;
        displayForecast();

        saveHistory(data.name);
        displayHistory();

    } catch (err) {
        if (err instanceof TypeError) {
            showError("Tidak dapat terhubung ke internet. Periksa koneksi kamu.");
        } else {
            showError(err.message);
        }
    } finally {
        loading.style.display = "none";
    }
};

const displayWeather = (data) => {
    const weatherDescriptions = data.weather.map(
        (item) => item.description
    );

    cityName.textContent = data.name;

    weatherIcon.src =
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    weatherIcon.alt = weatherDescriptions.join(", ");

    currentTemperature = data.main.temp;
    updateTemperature();

    description.textContent = weatherDescriptions.join(", ");
    humidity.textContent = `Kelembapan ${data.main.humidity}%`;

    weatherResult.style.display = "block";
};

const updateTemperature = () => {
    if (currentTemperature === null) {
        return;
    }

    let temperatureValue = currentTemperature;

    if (currentUnit === "F") {
        temperatureValue = (currentTemperature * 9 / 5) + 32;
    }

    temperature.textContent =
        `${Math.round(temperatureValue)}°${currentUnit}`;
};

const displayForecast = () => {
    forecastList.innerHTML = "";

    const days = {};

    forecastData.forEach((item) => {
        const date = item.dt_txt.split(" ")[0];

        if (!days[date]) {
            days[date] = [];
        }

        days[date].push(item);
    });

    const fiveDays = Object.values(days).slice(0, 5);

    fiveDays.forEach((day) => {
        const middayData = day.reduce((closest, item) => {
            const itemHour = Math.abs(
                new Date(item.dt_txt).getHours() - 12
            );

            const closestHour = Math.abs(
                new Date(closest.dt_txt).getHours() - 12
            );

            return itemHour < closestHour ? item : closest;
        });

        const temperatures = day.map((item) => item.main.temp);

        const minTemperature = Math.min(...temperatures);
        const maxTemperature = Math.max(...temperatures);

        const date = new Date(middayData.dt_txt);

        const formattedDate = date.toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short"
        });

        const card = document.createElement("div");

        card.classList.add("forecast-card");

        card.innerHTML = `
            <p class="forecast-date">${formattedDate}</p>

            <img
                class="forecast-icon"
                src="https://openweathermap.org/img/wn/${middayData.weather[0].icon}@2x.png"
                alt="${middayData.weather[0].description}"
            >

            <p class="forecast-temp">
                ${formatTemperature(maxTemperature)} /
                ${formatTemperature(minTemperature)}
            </p>

            <p class="forecast-description">
                ${middayData.weather[0].description}
            </p>
        `;

        forecastList.appendChild(card);
    });
};

const formatTemperature = (value) => {
    if (currentUnit === "F") {
        value = (value * 9 / 5) + 32;
    }

    return `${Math.round(value)}°`;
};

const showError = (message) => {
    error.textContent = message;
    error.style.display = "block";
};

const saveHistory = (city) => {
    let history =
        JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];

    history = history.filter(
        (item) => item.toLowerCase() !== city.toLowerCase()
    );

    history.unshift(city);
    history = history.slice(0, 5);

    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
    );
};

const displayHistory = () => {
    const history =
        JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];

    historyList.innerHTML = "";

    history.forEach((city) => {
        const button = document.createElement("button");

        button.classList.add("history-item");
        button.textContent = city;

        button.addEventListener("click", () => {
            getWeather(city);
        });

        historyList.appendChild(button);
    });
};

celsiusBtn.addEventListener("click", () => {
    currentUnit = "C";

    celsiusBtn.classList.add("unit-active");
    fahrenheitBtn.classList.remove("unit-active");

    updateTemperature();
    displayForecast();
});

fahrenheitBtn.addEventListener("click", () => {
    currentUnit = "F";

    fahrenheitBtn.classList.add("unit-active");
    celsiusBtn.classList.remove("unit-active");

    updateTemperature();
    displayForecast();
});

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (city !== "") {
        getWeather(city);
    }
});

displayHistory();