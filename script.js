// ✅ 1. Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";

// ✅ Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBxnvHY7k8rvIBd5eRzroMeWqg1vYQ0vRo", authDomain: "seagrass-sex.firebaseapp.com", projectId: "seagrass-sex", storageBucket: "seagrass-sex.firebasestorage.app", messagingSenderId: "762828890149", appId: "1:762828890149:web:e4776e300fb82a6cd1dfcc", measurementId: "G-7KTXD5P8ET" };


// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
console.log("✅ Firebase Initialized.");

// ✅ 2. Initialize Leaflet Map
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Initializing Leaflet Map...");

    if (typeof L === "undefined") {
        console.error("❌ Leaflet.js is NOT loaded!");
        return;
    }

    const map = L.map("map").setView([-33.867, 151.207], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    let marker;

    // ✅ Add Geocoder Search Bar
    if (typeof L.Control.Geocoder !== "undefined") {
        L.Control.geocoder({
            defaultMarkGeocode: false,
        })
        .on("markgeocode", function (e) {
            const latlng = e.geocode.center;
            map.setView(latlng, 12);
            if (marker) map.removeLayer(marker);

            marker = L.marker(latlng)
                .addTo(map)
                .bindPopup(e.geocode.name)
                .openPopup();

            document.getElementById("location").value = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
        })
        .addTo(map);
        console.log("✅ Geocoder (Search Bar) Initialized.");
    } else {
        console.error("❌ Leaflet Geocoder Plugin is NOT Loaded!");
    }

    // ✅ Click on Map to Set Location
    map.on("click", function (event) {
        const lat = event.latlng.lat.toFixed(6);
        const lng = event.latlng.lng.toFixed(6);

        if (marker) map.removeLayer(marker);

        marker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`📍 ${lat}, ${lng}`)
            .openPopup();

        document.getElementById("location").value = `${lat}, ${lng}`;
    });

    console.log("✅ Map Click Event Added.");
});

// ✅ 3. Handle Form Submission
document.getElementById("upload-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    console.log("✅ Form submitted!");

    const submitButton = document.querySelector("button[type='submit']");
    submitButton.disabled = true;

    // ✅ Get Form Data
    const file = document.getElementById("photo").files[0];
    const date = document.getElementById("date").value.trim();
    let estuaryName = document.getElementById("estuary").value.trim();
    const location = document.getElementById("location").value.trim();
    const weather = document.getElementById("weather").value.trim();
    const tide = document.getElementById("tide").value.trim();

    if (!file || !date || !estuaryName) {
        alert("❌ Please fill out all required fields.");
        submitButton.disabled = false;
        return;
    }

    // ✅ Format Estuary Name (Remove Spaces & Special Characters)
    estuaryName = estuaryName.replace(/\s+/g, "").replace(/[^a-zA-Z0-9-_]/g, "");

    // ✅ Generate Unique ID (YYYY-MM-DD_Estuary_RandomNumber)
    const randomNum = Math.floor(1000 + Math.random() * 9000); // Generates a 4-digit number
    const submissionID = `${date}_${estuaryName}_${randomNum}`;
    
    console.log("✅ Generated Submission ID:", submissionID);

    try {
        // ✅ Upload Image to Firebase Storage with Submission ID as Filename
        const fileExtension = file.name.split('.').pop(); // Get the original file extension
        const storageRef = ref(storage, `sightings/${submissionID}.${fileExtension}`); 
        await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(storageRef);

        // ✅ Save Data to Firestore with Submission ID
        await setDoc(doc(db, "sightings", submissionID), {
            date,
            estuary: estuaryName,
            location,
            weather,
            tide,
            imageUrl,
            submissionID, // Store ID in Firestore for easy reference
            timestamp: new Date(),
        });

        console.log("✅ Data Successfully Saved!");

        // ✅ Show Success Message
        document.getElementById("response-message").textContent = `✅ Sighting submitted successfully!`;
        document.getElementById("response-message").style.color = "green";

        // ✅ Reset Form & Enable Button
        document.getElementById("upload-form").reset();
        submitButton.disabled = false;
    } catch (error) {
        console.error("❌ Error Saving Data:", error);
        document.getElementById("response-message").textContent = "❌ Error submitting data.";
        document.getElementById("response-message").style.color = "red";
        submitButton.disabled = false;
    }
});
