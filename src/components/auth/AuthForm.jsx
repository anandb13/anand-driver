import { useState } from "react";
import { auth } from "../../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

export default function AuthForm({ mode }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const buttonText = mode === "signup" ? "Create account" : "Sign in";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const authAction =
        mode === "signup"
          ? createUserWithEmailAndPassword
          : signInWithEmailAndPassword;
      await authAction(auth, form.email, form.password);
    } catch (err)
     {
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <p className="mb-4 text-sm text-red-700 bg-red-50 px-3 py-2 rounded">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="space-y-4">
        {["email", "password"].map((field) => (
          <label className="block" key={field}>
            <span className="text-xs font-medium text-gray-600 capitalize">
              {field}
            </span>
            <input
              type={field}
              name={field}
              required
              value={form[field]}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={
                field === "email" ? "you@example.com" : "•••••••"
              }
            />
          </label>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Please wait…" : buttonText}
        </button>
      </form>
    </>
  );
}
