import { useState } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUp = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .catch(error => console.error(error.message));
  };

  const login = () => {
    signInWithEmailAndPassword(auth, email, password)
      .catch(error => console.error(error.message));
  };

  return (
    <div>
      <h3>Login / Signup</h3>
      <input type="email" placeholder="Email"
        onChange={(e) => setEmail(e.target.value)} />

      <input type="password" placeholder="Password"
        onChange={(e) => setPassword(e.target.value)} />

      <div>
        <button onClick={signUp}>Sign Up</button>
        <button onClick={login}>Login</button>
      </div>
    </div>
  );
}

export default Auth;
