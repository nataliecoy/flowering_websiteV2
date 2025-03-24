import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getStorage, ref, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";

// 🔥 Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBxnvHY7k8rvIBd5eRzroMeWqg1vYQ0vRo", authDomain: "seagrass-sex.firebaseapp.com", projectId: "seagrass-sex", storageBucket: "seagrass-sex.firebasestorage.app", messagingSenderId: "762828890149", appId: "1:762828890149:web:e4776e300fb82a6cd1dfcc", measurementId: "G-7KTXD5P8ET" };


// 🔧 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const loginError = document.getElementById("login-error");

// 🔐 Login function
window.login = () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      loginError.textContent = "";
    })
    .catch((error) => {
      loginError.textContent = "❌ Login failed. Check credentials.";
      console.error("Login error:", error);
    });
};

// 🚪 Logout function
window.logout = () => {
  signOut(auth).then(() => {
    location.reload();
  });
};

// 🔄 Check login state
onAuthStateChanged(auth, async (user) => {
  if (user && user.email === "n.coy@unsw.edu.au") {
    loginSection.classList.add("hidden");
    dashboard.classList.remove("hidden");
    loadData(); // 👇 Load submissions
  } else {
    loginSection.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }
});

// 📥 Load Data From Firestore
async function loadData() {
  const tableBody = document.querySelector("#data-table tbody");
  tableBody.innerHTML = "";

  const snapshot = await getDocs(collection(db, "sightings"));
  const rows = [];

  snapshot.forEach(async (docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${data.date}</td>
      <td>${data.time}</td>
      <td>${data.estuary}</td>
      <td>${data.location}</td>
      <td>${data.weather}</td>
      <td>${data.tide}</td>
      <td><a href="${data.imageUrl}" target="_blank">📷 View</a></td>
      <td><button onclick="deleteEntry('${id}')">🗑️</button></td>
    `;

    row.dataset.date = data.date;
    row.dataset.estuary = data.estuary.toLowerCase();

    tableBody.appendChild(row);
    rows.push({ ...data, id });
  });

  // Save data for CSV export
  window.allData = rows;
}

// ❌ Delete Entry from Firestore + Storage
window.deleteEntry = async (id) => {
  if (!confirm("Are you sure you want to delete this entry?")) return;

  try {
    await deleteDoc(doc(db, "sightings", id));
    const imageRef = ref(storage, `sightings/${id}.jpg`);
    await deleteObject(imageRef);
    alert("✅ Entry deleted.");
    loadData(); // Refresh table
  } catch (error) {
    console.error("Delete error:", error);
    alert("❌ Error deleting entry.");
  }
};

// 📤 Export to CSV
window.downloadCSV = () => {
  const csvRows = [
    ["Date", "Time", "Estuary", "Location", "Weather", "Tide", "ImageURL"],
    ...window.allData.map(d =>
      [d.date, d.time, d.estuary, d.location, d.weather, d.tide, d.imageUrl]
    )
  ];

  const csvContent = csvRows.map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "seagrass_sightings.csv";
  link.click();
};

// 🔍 Filters
document.getElementById("filter-estuary").addEventListener("input", () => {
  filterTable();
});

document.getElementById("filter-date").addEventListener("input", () => {
  filterTable();
});

function filterTable() {
  const estuaryFilter = document.getElementById("filter-estuary").value.toLowerCase();
  const dateFilter = document.getElementById("filter-date").value;

  const rows = document.querySelectorAll("#data-table tbody tr");
  rows.forEach(row => {
    const matchEstuary = estuaryFilter === "" || row.dataset.estuary.includes(estuaryFilter);
    const matchDate = dateFilter === "" || row.dataset.date === dateFilter;
    row.style.display = (matchEstuary && matchDate) ? "" : "none";
  });
}
