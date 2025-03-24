// ✅ 1. Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// ✅ Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBxnvHY7k8rvIBd5eRzroMeWqg1vYQ0vRo",
    authDomain: "seagrass-sex.firebaseapp.com",
    projectId: "seagrass-sex",
    storageBucket: "seagrass-sex.appspot.com",
    messagingSenderId: "762828890149",
    appId: "1:762828890149:web:e4776e300fb82a6cd1dfcc",
    measurementId: "G-7KTXD5P8ET",
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("✅ Firebase Initialized.");

// ✅ 2. Initialize Leaflet Map
document.addEventListener("DOMContentLoaded", async function () {
    console.log("✅ Initializing Leaflet Map...");

    if (typeof L === "undefined") {
        console.error("❌ Leaflet.js is NOT loaded!");
        return;
    }

    const map = L.map("map").setView([-33.867, 151.207], 7);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    console.log("✅ Map Initialized. Fetching data...");

    // ✅ 3. Fetch Sightings Data from Firestore
    try {
        const sightingsRef = collection(db, "sightings");
        const querySnapshot = await getDocs(sightingsRef);
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (!data.location) return;

            const [lat, lng] = data.location.split(",").map(Number);

            // ✅ Create a marker for each sighting
            const marker = L.marker([lat, lng]).addTo(map);

            // ✅ Create a popup with sighting details
            let popupContent = `
                <strong>${data.date}</strong> - ${data.estuary} <br>
                🌊 <strong>Tide:</strong> ${data.tide} <br>
                ⛅ <strong>Weather:</strong> ${data.weather} <br>
            `;

            // ✅ If there's an image, display it
            if (data.imageUrl) {
                popupContent += `<br><img src="${data.imageUrl}" alt="Sighting Photo" width="150">`;
            }

            marker.bindPopup(popupContent);
        });

        console.log("✅ Sightings Loaded!");
    } catch (error) {
        console.error("❌ Error Fetching Sightings:", error);
    }
});
