import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCE33k3B7QmA5Rv_UPirsSmMpUkD2iMTpE",
  authDomain: "anand-drive.firebaseapp.com",
  projectId: "anand-drive",
  storageBucket: "anand-drive.firebasestorage.app",
  messagingSenderId: "677116994195",
  appId: "1:677116994195:web:29ed5c920cf554325aa366",
  measurementId: "G-H1FMS0LSR4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");