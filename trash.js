import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBxnvHY7k8rvIBd5eRzroMeWqg1vYQ0vRo",
  authDomain: "seagrass-sex.firebaseapp.com",
  projectId: "seagrass-sex",
  storageBucket: "seagrass-sex.firebasestorage.app",
  messagingSenderId: "762828890149",
  appId: "1:762828890149:web:e4776e300fb82a6cd1dfcc",
  measurementId: "G-7KTXD5P8ET"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ Format timestamp to readable date
function formatDate(timestamp) {
  try {
    if (timestamp?.toDate) return timestamp.toDate().toLocaleString();
    if (timestamp?.seconds) return new Date(timestamp.seconds * 1000).toLocaleString();
    return "Unknown";
  } catch {
    return "Unknown";
  }
}

// ✅ Load deleted sightings
async function loadDeletedSightings() {
  const table = document.querySelector("#sightings-trash-table tbody");
  table.innerHTML = "";

  const snapshot = await getDocs(collection(db, "deleted_sightings"));
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.date || ""}</td>
      <td>${data.estuary || ""}</td>
      <td>${data.location || ""}</td>
      <td>${data.time || ""}</td>
      <td>${data.imageUrl ? `<a href="${data.imageUrl}" target="_blank"><img src="${data.imageUrl}" /></a>` : "No image"}</td>
      <td>${formatDate(data.deletedAt)}</td>
      <td>
        <button onclick="restoreEntry('sightings', 'deleted_sightings', '${id}')">♻️ Restore</button>
        <button onclick="permanentlyDelete('deleted_sightings', '${id}', true)">🗑️ Delete</button>
      </td>
    `;
    table.appendChild(row);
  });
}

// ✅ Load deleted inquiries
async function loadDeletedInquiries() {
  const table = document.querySelector("#inquiries-trash-table tbody");
  table.innerHTML = "";

  const snapshot = await getDocs(collection(db, "deleted_inquiries"));
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.name || ""}</td>
      <td>${data.email || ""}</td>
      <td>${data.subject || ""}</td>
      <td>${data.message || ""}</td>
      <td>${formatDate(data.deletedAt)}</td>
      <td>
        <button onclick="restoreEntry('inquiries', 'deleted_inquiries', '${id}')">♻️ Restore</button>
        <button onclick="permanentlyDelete('deleted_inquiries', '${id}', false)">🗑️ Delete</button>
      </td>
    `;
    table.appendChild(row);
  });
}

// ✅ Restore entry back to main collection
window.restoreEntry = async (toCollection, fromCollection, id) => {
  try {
    const fromRef = doc(db, fromCollection, id);
    const docSnap = await getDocs(collection(db, fromCollection));
    const restoreSnap = docSnap.docs.find((d) => d.id === id);
    if (!restoreSnap) throw new Error("Document not found.");

    const data = restoreSnap.data();
    delete data.deletedAt;

    await setDoc(doc(db, toCollection, id), data);
    await deleteDoc(fromRef);
    alert("✅ Restored!");
    refreshTab();
  } catch (err) {
    console.error("❌ Error restoring:", err);
    alert("❌ Error restoring item.");
  }
};

// ✅ Permanently delete entry
window.permanentlyDelete = async (collectionName, id, hasImage) => {
  if (!confirm("⚠️ Permanently delete this entry? This cannot be undone.")) return;

  try {
    if (hasImage) {
      const imageRef = storageRef(storage, `sightings/${id}.jpg`);
      try {
        await deleteObject(imageRef);
      } catch (err) {
        console.warn("⚠️ Could not delete image (may not exist):", err.message);
      }
    }

    await deleteDoc(doc(db, collectionName, id));
    alert("✅ Permanently deleted.");
    refreshTab();
  } catch (err) {
    console.error("❌ Error deleting permanently:", err);
    alert("❌ Something went wrong. Check console.");
  }
};

// ✅ Refresh current tab view
function refreshTab() {
  const activeTab = document.querySelector(".tab-button.active")?.dataset.tab;
  if (activeTab === "deleted-sightings") {
    loadDeletedSightings();
  } else {
    loadDeletedInquiries();
  }
}

// ✅ Load data on start
loadDeletedSightings();
loadDeletedInquiries();
