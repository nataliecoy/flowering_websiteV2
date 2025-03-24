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

const firebaseConfig = {
    apiKey: "AIzaSyBxnvHY7k8rvIBd5eRzroMeWqg1vYQ0vRo", authDomain: "seagrass-sex.firebaseapp.com", projectId: "seagrass-sex", storageBucket: "seagrass-sex.firebasestorage.app", messagingSenderId: "762828890149", appId: "1:762828890149:web:e4776e300fb82a6cd1dfcc", measurementId: "G-7KTXD5P8ET" };


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Helper: Format timestamp
function formatDate(timestamp) {
  try {
    return timestamp?.toDate ? timestamp.toDate().toLocaleString() : "Unknown";
  } catch {
    return "Unknown";
  }
}

// Load Deleted Sightings
export async function loadDeletedSightings() {
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
      <td class="action-btns">
        <button onclick="restoreEntry('sightings', 'deleted_sightings', '${id}')">♻️ Restore</button>
        <button onclick="permanentlyDelete('deleted_sightings', '${id}', true)">🗑️ Delete</button>
      </td>
    `;
    table.appendChild(row);
  });
}

// Load Deleted Inquiries
export async function loadDeletedInquiries() {
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
      <td class="action-btns">
        <button onclick="restoreEntry('inquiries', 'deleted_inquiries', '${id}')">♻️ Restore</button>
        <button onclick="permanentlyDelete('deleted_inquiries', '${id}', false)">🗑️ Delete</button>
      </td>
    `;
    table.appendChild(row);
  });
}

// Restore
window.restoreEntry = async (toCol, fromCol, id) => {
  const fromRef = doc(db, fromCol, id);
  const dataSnap = await getDocs(collection(db, fromCol));
  const docSnap = dataSnap.docs.find(d => d.id === id);

  if (!docSnap) return alert("❌ Entry not found.");
  const data = docSnap.data();
  delete data.deletedAt;

  await setDoc(doc(db, toCol, id), data);
  await deleteDoc(fromRef);
  alert("✅ Restored.");
  refreshTab();
};

// Delete Permanently
window.permanentlyDelete = async (collectionName, id, hasImage) => {
  if (!confirm("⚠️ Permanently delete this entry?")) return;

  try {
    if (hasImage) {
      const imgRef = storageRef(storage, `sightings/${id}.jpg`);
      await deleteObject(imgRef);
    }
  } catch (err) {
    console.warn("⚠️ Image delete error:", err.message);
  }

  await deleteDoc(doc(db, collectionName, id));
  alert("✅ Deleted permanently.");
  refreshTab();
};

// Refresh
function refreshTab() {
  const active = document.querySelector(".tab-button.active").dataset.tab;
  active === "deleted-inquiries" ? loadDeletedInquiries() : loadDeletedSightings();
}

// Initial Load
loadDeletedSightings();
loadDeletedInquiries();
