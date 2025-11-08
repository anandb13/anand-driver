import { useState } from "react";
import { storage, auth } from "../firebase";
import { ref, uploadBytes } from "firebase/storage";

function FileUpload({ onUploadFinished }) {
  const [file, setFile] = useState(null);

  const uploadFile = () => {
    if (!file || !auth.currentUser) return;
    const fileRef = ref(storage, `files/${auth.currentUser.uid}/${file.name}`);
    uploadBytes(fileRef, file).then(() => {
      onUploadFinished();
      alert("Uploaded ✅");
    });
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={uploadFile}>Upload</button>
    </div>
  );
}

export default FileUpload;
