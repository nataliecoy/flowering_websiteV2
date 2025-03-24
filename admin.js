// 🔥 Firebase Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBxnvHY7k8rvIBd5eRzroMeWqg1vYQ0vRo",
  authDomain: "seagrass-sex.firebaseapp.com",
  projectId: "seagrass-sex",
  storageBucket: "seagrass-sex.firebasestorage.app",
  messagingSenderId: "762828890149",
  appId: "1:762828890149:web:e4776e300fb82a6cd1dfcc",
  measurementId: "G-7KTXD5P8ET",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const loginError = document.getElementById("login-error");

// 🔐 LOGIN
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

// 🚪 LOGOUT
window.logout = () => {
  signOut(auth).then(() => {
    location.reload();
  });
};

// 🔄 LOGIN STATE CHECK
onAuthStateChanged(auth, async (user) => {
  if (user && user.email === "n.coy@unsw.edu.au") {
    loginSection.classList.add("hidden");
    dashboard.classList.remove("hidden");
    loadData();
    loadInquiries();
  } else {
    loginSection.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }
});


// 🌿 LOAD SIGHTINGS
async function loadData() {
  const table = document.getElementById("submissions-table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>Estuary</th>
        <th>Location</th>
        <th>Weather</th>
        <th>Tide</th>
        <th>Photo</th>
        <th>Delete</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");
  const snapshot = await getDocs(collection(db, "sightings"));
  const rows = [];

  snapshot.forEach(async (docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

    const row = document.createElement("tr");
    row.dataset.date = data.date;
    row.dataset.estuary = (data.estuary || "").toLowerCase();

    row.innerHTML = `
      <td>${data.date}</td>
      <td>${data.time}</td>
      <td>${data.estuary}</td>
      <td>${data.location}</td>
      <td>${data.weather}</td>
      <td>${data.tide}</td>
      <td>
        ${data.imageUrl
          ? `<a href="${data.imageUrl}" target="_blank"><img src="${data.imageUrl}" width="60"></a>`
          : "No image"}
      </td>
      <td><button onclick="deleteEntry('${id}')">🗑️</button></td>
    `;

    tbody.appendChild(row);
    rows.push({ ...data, id });
  });

  window.allData = rows;
}

// ❌ SOFT DELETE SIGHTING
window.deleteEntry = async (id) => {
  if (!confirm("Are you sure you want to move this to trash?")) return;

  try {
    const originalDoc = doc(db, "sightings", id);
    const docSnap = await getDoc(originalDoc);

    if (!docSnap.exists()) return alert("❌ Entry not found.");

    const data = docSnap.data();

    await setDoc(doc(db, "deleted_sightings", id), {
      ...data,
      deletedAt: new Date(),
    });

    await deleteDoc(originalDoc);

    if (data.imageUrl) {
      const imageRef = ref(storage, `sightings/${id}.jpg`);
      try {
        await deleteObject(imageRef);
      } catch (e) {
        console.warn("⚠️ Could not delete image:", e.message);
      }
    }

    alert("✅ Entry moved to trash.");
    loadData();
  } catch (error) {
    console.error("❌ Error deleting entry:", error);
    alert("❌ Something went wrong. Check console.");
  }
};

// 📤 EXPORT SIGHTINGS CSV
window.downloadCSV = () => {
  if (!window.allData || window.allData.length === 0) {
    alert("No data to download.");
    return;
  }

  const csvRows = [
    ["Date", "Time", "Estuary", "Latitude", "Longitude", "Weather", "Tide", "Image URL", "Submitted At"]
  ];

  window.allData.forEach((d) => {
    let [lat, lng] = ["", ""];
    if (d.location?.includes(",")) {
      [lat, lng] = d.location.split(",").map((s) => s.trim());
    }

    const submittedAt = d.timestamp?.toDate?.().toISOString() || "";

    csvRows.push([
      d.date || "", d.time || "", d.estuary || "", lat, lng,
      d.weather || "", d.tide || "", d.imageUrl || "", submittedAt
    ]);
  });

  const csvContent = csvRows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "seagrass_sightings.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 🔍 FILTERING
document.getElementById("filter-estuary")?.addEventListener("input", filterTable);
document.getElementById("filter-date")?.addEventListener("input", filterTable);

function filterTable() {
  const estuary = document.getElementById("filter-estuary").value.toLowerCase();
  const date = document.getElementById("filter-date").value;
  const rows = document.querySelectorAll("#submissions-table tbody tr");

  rows.forEach((row) => {
    const matchEstuary = estuary === "" || row.dataset.estuary.includes(estuary);
    const matchDate = date === "" || row.dataset.date === date;
    row.style.display = matchEstuary && matchDate ? "" : "none";
  });
}

// 💌 LOAD INQUIRIES
async function loadInquiries() {
  const table = document.getElementById("inquiries-table");
  if (!table) return;

  table.innerHTML = `
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Subject</th>
        <th>Message</th>
        <th>Submitted At</th>
        <th>Responded</th>
        <th>Delete</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");
  const snapshot = await getDocs(collection(db, "inquiries"));
  const allInquiries = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

    const submittedAt = data.submittedAt?.toDate().toLocaleString() || "";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.name || ""}</td>
      <td>${data.email || ""}</td>
      <td>${data.subject || ""}</td>
      <td>${data.message || ""}</td>
      <td>${submittedAt}</td>
      <td><input type="checkbox" data-id="${id}" class="responded-checkbox" ${data.responded ? "checked" : ""}></td>
      <td><button onclick="deleteInquiry('${id}')">🗑️</button></td>
    `;

    tbody.appendChild(row);
    allInquiries.push({ ...data, id, submittedAt });
  });

  window.allInquiries = allInquiries;

  document.querySelectorAll(".responded-checkbox").forEach((cb) => {
    cb.addEventListener("change", async (e) => {
      const id = e.target.dataset.id;
      const responded = e.target.checked;
      await setDoc(doc(db, "inquiries", id), { responded }, { merge: true });
    });
  });

  document.getElementById("export-inquiries")?.addEventListener("click", () => {
    const rows = [["Name", "Email", "Subject", "Message", "Submitted At", "Responded"]];
    allInquiries.forEach((i) => {
      rows.push([
        i.name || "", i.email || "", i.subject || "", i.message || "",
        i.submittedAt || "", i.responded ? "Yes" : "No"
      ]);
    });

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "inquiries.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

// 🗑️ DELETE INQUIRY TO TRASH
window.deleteInquiry = async (id) => {
  if (!confirm("Delete this inquiry?")) return;

  try {
    const ref = doc(db, "inquiries", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return alert("Inquiry not found.");

    const data = snap.data();
    await setDoc(doc(db, "deleted_inquiries", id), {
      ...data,
      deletedAt: new Date(),
    });

    await deleteDoc(ref);
    alert("Inquiry moved to trash.");
    loadInquiries();
  } catch (err) {
    console.error("❌ Error deleting inquiry:", err.message);
    alert("Something went wrong.");
  }
};
