import { useState } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8"
        aria-labelledby="auth-heading"
      >
        <h2 id="auth-heading" className="text-2xl font-semibold text-gray-800 mb-4">
          {mode === "signup" ? "Create account" : "Welcome"}
        </h2>

        <label className="block mb-3 text-sm text-gray-600">
          <span className="sr-only">Email</span>
          <input
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="block mb-2 text-sm text-gray-600">
          <span className="sr-only">Password</span>
          <input
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            required
          />
        </label>

        {error && (
          <div className="mt-3 text-sm text-red-700 bg-red-50 px-3 py-2 rounded">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {mode === "signup" ? "Sign up" : "Login"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          >
            {mode === "signup" ? "Have an account? Login" : "New here? Create account"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Auth;