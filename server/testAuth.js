import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Your Firebase config (from console)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const login = async () => {
  try {
    const userCred = await signInWithEmailAndPassword(
      auth,
      "test@gmail.com",   // create this user in Firebase console
      "12345678"
    );

    const token = await userCred.user.getIdToken();

    console.log("TOKEN:\n", token);
  } catch (err) {
    console.log(err.message);
  }
};

login();