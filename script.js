import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================
FIREBASE CONFIG
PASTE YOUR FIREBASE CONFIG HERE
========================= */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

/* ========================= */

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const email = document.getElementById("email");
const password = document.getElementById("password");

const productName = document.getElementById("productName");
const productPrice = document.getElementById("productPrice");
const productStock = document.getElementById("productStock");

const addProductBtn = document.getElementById("addProductBtn");

const productTableBody = document.getElementById("productTableBody");

const totalProducts = document.getElementById("totalProducts");
const totalSold = document.getElementById("totalSold");
const totalEarned = document.getElementById("totalEarned");

/* LOGIN */

loginBtn.addEventListener("click", async () => {

  try{

    await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );

  }catch(error){
    alert(error.message);
  }

});

/* AUTH STATE */

onAuthStateChanged(auth, (user)=>{

  if(user){

    loginScreen.classList.add("hidden");
    dashboard.classList.remove("hidden");

    loadProducts();

  }else{

    loginScreen.classList.remove("hidden");
    dashboard.classList.add("hidden");

  }

});

/* LOGOUT */

logoutBtn.addEventListener("click", async ()=>{

  await signOut(auth);

});

/* ADD PRODUCT */

addProductBtn.addEventListener("click", async ()=>{

  if(
    !productName.value ||
    !productPrice.value ||
    !productStock.value
  ){
    alert("Fill all fields");
    return;
  }

  await addDoc(collection(db,"products"),{

    name: productName.value,
    price: Number(productPrice.value),
    stock: Number(productStock.value),
    initialStock: Number(productStock.value),
    totalSold: 0,
    totalEarned: 0

  });

  productName.value = "";
  productPrice.value = "";
  productStock.value = "";

});

/* LOAD PRODUCTS */

function loadProducts(){

  onSnapshot(collection(db,"products"), (snapshot)=>{

    productTableBody.innerHTML = "";

    let totalProductsCount = 0;
    let totalSoldCount = 0;
    let totalEarnedAmount = 0;

    snapshot.forEach((docSnap)=>{

      totalProductsCount++;

      const data = docSnap.data();

      totalSoldCount += data.totalSold;
      totalEarnedAmount += data.totalEarned;

      const status =
        data.stock < 3
        ? `<span class="low-stock">Low Stock</span>`
        : `<span class="good-stock">Good</span>`;

      const row = `
        <tr>

          <td>${data.name}</td>

          <td>${data.price}/-</td>

          <td>
            <input
              type="number"
              value="${data.stock}"
              class="stock-input"
              id="stock-${docSnap.id}"
            >
          </td>

          <td>${data.totalSold}</td>

          <td>${data.totalEarned}/-</td>

          <td>${status}</td>

          <td>

            <button
              class="action-btn save-btn"
              onclick="updateStock(
                '${docSnap.id}',
                ${data.stock},
                ${data.price}
              )"
            >
              Save
            </button>

            <button
              class="action-btn delete-btn"
              onclick="deleteProduct('${docSnap.id}')"
            >
              Delete
            </button>

          </td>

        </tr>
      `;

      productTableBody.innerHTML += row;

    });

    totalProducts.innerText = totalProductsCount;
    totalSold.innerText = totalSoldCount;
    totalEarned.innerText = `${totalEarnedAmount}/-`;

  });

}

/* UPDATE STOCK */

window.updateStock = async (
  id,
  oldStock,
  price
)=>{

  const newStock = Number(
    document.getElementById(`stock-${id}`).value
  );

  let soldDifference = 0;

  if(newStock < oldStock){
    soldDifference = oldStock - newStock;
  }

  const productRef = doc(db,"products",id);

  const row = document.getElementById(`stock-${id}`)
    .closest("tr");

  const currentSold =
    Number(row.children[3].innerText);

  const currentEarned =
    Number(
      row.children[4]
      .innerText.replace("/-","")
    );

  await updateDoc(productRef,{

    stock: newStock,
    totalSold: currentSold + soldDifference,
    totalEarned:
      currentEarned +
      (soldDifference * price)

  });

};

/* DELETE PRODUCT */

window.deleteProduct = async (id)=>{

  if(confirm("Delete product?")){

    await deleteDoc(doc(db,"products",id));

  }

};
