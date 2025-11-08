import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Auth from "./components/Auth";
import FileUpload from "./components/FileUpload";
import FileList from "./components/FileList";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, setUser);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>My Cloud Drive</h1>

      {user ? (
        <>
          <p>Welcome: {user.email}</p>
          <button onClick={() => signOut(auth)}>Logout</button>
          <hr />
          <FileUpload onUploadFinished={() => {}} />
          <FileList />
        </>
      ) : (
        <Auth />
      )}
    </div>
  );
}

export default App;
