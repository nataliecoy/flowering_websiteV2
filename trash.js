import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import {
  getFirestore, collection, getDocs, deleteDoc, doc, setDoc
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import {
  getStorage, ref as storageRef, deleteObject
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBxnvHY7k8rvIBd5eRzroMeWqg1vYQ0vRo",
  authDomain: "seagrass-sex.firebaseapp.com",
  projectId: "seagrass-sex",
  storageBucket: "seagrass-sex.appspot.com",
  messagingSenderId: "762828890149",
  appId: "1:762828890149:web:e4776e300fb82a6cd1dfcc",
  measurementId: "G-7KTXD5P8ET"
};

// ✅ Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const tableBody = document.querySelector("#trash-table tbody");

// ✅ Auth check
onAuthStateChanged(auth, async (user) => {
  if (!user || user.email !== "n.coy@unsw.edu.au") {
    alert("Access denied. Only admin can view this page.");
    window.location.href = "index.html";
    return;
  }
  loadTrash();
});

// ✅ Load from deleted_sightings
async function loadTrash() {
  const snapshot = await getDocs(collection(db, "deleted_sightings"));
  tableBody.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.date || "-"}</td>
      <td>${data.estuary || "-"}</td>
      <td>${data.location || "-"}</td>
      <td>
        ${data.imageUrl ? `<a href="${data.imageUrl}" target="_blank"><img src="${data.imageUrl}" width="60" /></a>` : "—"}
      </td>
      <td>
        <button class="btn btn-restore" onclick="restoreEntry('${id}')">Restore</button>
        <button class="btn btn-delete" onclick="permanentlyDeleteEntry('${id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// ✅ Restore entry
window.restoreEntry = async (id) => {
  if (!confirm("Restore this entry?")) return;

  const fromDocRef = doc(db, "deleted_sightings", id);
  const toDocRef = doc(db, "sightings", id);

  try {
    const docSnap = await getDocs(collection(db, "deleted_sightings"));
    const data = docSnap.docs.find(doc => doc.id === id)?.data();

    if (!data) throw new Error("Data not found");

    await setDoc(toDocRef, data);
    await deleteDoc(fromDocRef);

    alert("✅ Entry restored!");
    loadTrash();
  } catch (err) {
    console.error("❌ Restore error:", err);
    alert("❌ Could not restore entry.");
  }
};

// ✅ Permanently delete
window.permanentlyDeleteEntry = async (id) => {
  if (!confirm("⚠️ This will permanently delete this entry and photo. Continue?")) return;

  try {
    await deleteDoc(doc(db, "deleted_sightings", id));
    const imgRef = storageRef(storage, `sightings/${id}.jpg`);

    try {
      await deleteObject(imgRef);
    } catch (imgErr) {
      console.warn("⚠️ Image may not exist:", imgErr.message);
    }

    alert("✅ Entry permanently deleted.");
    loadTrash();
  } catch (err) {
    console.error("❌ Permanent delete error:", err);
    alert("❌ Could not delete entry.");
  }
};
