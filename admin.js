import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
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
    <td>
      <a href="${data.imageUrl}" target="_blank">
        <img src="${data.imageUrl}" alt="seagrass photo" width="60" style="border-radius: 4px;">
      </a>
    </td>
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
  if (!confirm("Are you sure you want to move this to trash?")) return;

  try {
    // Get the original document first
    const originalDoc = doc(db, "sightings", id);
    const docSnap = await getDoc(originalDoc);

    if (!docSnap.exists()) {
      alert("❌ Entry not found.");
      return;
    }

    const data = docSnap.data();

    // ✅ Move to "deleted_sightings"
    await setDoc(doc(db, "deleted_sightings", id), {
      ...data,
      deletedAt: new Date()
    });

    // ✅ Try deleting from original collection
    await deleteDoc(originalDoc);
    console.log("✅ Firestore entry moved and deleted");

    // ✅ Try deleting from Storage
    if (data.imageUrl) {
      const imageRef = ref(storage, `sightings/${id}.jpg`);
      try {
        await deleteObject(imageRef);
        console.log("✅ Image deleted");
      } catch (imgErr) {
        console.warn("⚠️ Image might not exist:", imgErr.message);
      }
    } else {
      console.log("ℹ️ No image attached to this entry.");
    }
    

    alert("✅ Entry moved to trash.");
    loadData();
  } catch (error) {
    console.error("❌ Something went wrong in deleteEntry:");
    console.error("→ Error message:", error.message);
    console.error("→ Error object:", error);
    alert(`❌ Error: ${error.message}`);
  }
  
};



// 📤 Export to CSV
window.downloadCSV = () => {
  if (!window.allData || window.allData.length === 0) {
    alert("No data to download.");
    return;
  }

  // ✅ Column Headers
  const csvRows = [
    ["Date", "Time", "Estuary", "Latitude", "Longitude", "Weather", "Tide", "Image URL", "Submitted At"]
  ];

  // ✅ Loop through each entry
  window.allData.forEach((d) => {
    // Split location
    let lat = "";
    let lng = "";
    if (d.location && d.location.includes(",")) {
      [lat, lng] = d.location.split(",").map(coord => coord.trim());
    }

    // Format timestamp
    let submittedAt = "";
    if (d.timestamp?.toDate) {
      submittedAt = d.timestamp.toDate().toISOString(); // e.g. 2025-03-28T04:15:00Z
    }

    // Add row to CSV
    csvRows.push([
      d.date || "",
      d.time || "",
      d.estuary || "",
      lat,
      lng,
      d.weather || "",
      d.tide || "",
      d.imageUrl || "",
      submittedAt
    ]);
  });

  // ✅ Convert to CSV string
  const csvContent = csvRows.map(row => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  // ✅ Trigger download
  const link = document.createElement("a");
  link.href = url;
  link.download = "seagrass_sightings.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
