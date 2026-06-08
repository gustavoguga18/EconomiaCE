// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// 🔥 CONFIG FIREBASE (SEU PROJETO)
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "economiace-e03e2.firebaseapp.com",
  projectId: "economiace-e03e2",
  storageBucket: "economiace-e03e2.appspot.com",
  messagingSenderId: "896818010082",
  appId: "1:896818010082:web:1e9e61dcc5162db2328bbb",
  measurementId: "G-J6X9DVLYNY"
};

// Inicialização
const app = initializeApp(firebaseConfig);

// Serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

// Firebase tools export (opcional mas útil)
export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc
};