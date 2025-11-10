import { useState } from "react";
import AuthIllustration from "./AuthIllustration";
import AuthForm from "./AuthForm";

export default function Auth() {
  const [mode, setMode] = useState("login");

  const titleText =
    mode === "signup" ? "Create your account" : "Welcome back";

  const subtitleText =
    mode === "signup"
      ? "Start uploading and managing your files."
      : "Sign in to access your cloud drive.";

  const toggleText =
    mode === "signup"
      ? "Have an account? Sign in"
      : "New here? Create account";

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <AuthIllustration />

        <section className="bg-white px-6 py-8 md:px-10 md:py-12">
          <div className="max-w-md mx-auto">
            <header className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {titleText}
              </h3>
              <p className="text-sm text-gray-500">{subtitleText}</p>
            </header>

            <AuthForm mode={mode} />

            <button
              type="button"
              onClick={() =>
                setMode(mode === "signup" ? "login" : "signup")
              }
              className="mt-5 text-sm text-indigo-600 hover:underline"
            >
              {toggleText}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
