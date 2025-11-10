import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Auth from "./components/auth/Auth";
import FileUpload from "./components/FileUpload";
import FileList from "./components/FileList";

function App() {
  const [user, setUser] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <div className="py-10 px-4 max-w-5xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                AD
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Anand Drive</h1>
                <p className="text-sm text-gray-500">Store and share your files</p>
              </div>
            </div>

            {user && (
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-700 mr-2 hidden sm:block">
                  Signed in as <span className="font-medium">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={signingOut}
                  className="px-3 py-2 rounded-md bg-white border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-60"
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            )}
          </header>

          <main>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <FileUpload onUploadFinished={() => {}} />
              </div>

              <div>
                <FileList />
              </div>
            </div>
          </main>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="w-full max-w-4xl">
            <Auth />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;