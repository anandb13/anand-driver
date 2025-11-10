import { useState } from "react";
import { storage, auth } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

function FileUpload({ onUploadFinished }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const uploadFile = () => {
    setError("");
    setSuccess("");
    if (!file) return setError("Please choose a file to upload.");
    if (!auth.currentUser) return setError("You must be signed in to upload.");

    const path = `files/${auth.currentUser.uid}/${file.name}`;
    const fileRef = ref(storage, path);
    const task = uploadBytesResumable(fileRef, file);

    setUploading(true);
    setProgress(0);

    task.on(
      "state_changed",
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(pct);
      },
      (err) => {
        console.error(err);
        setError("Upload failed. Try again.");
        setUploading(false);
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          setSuccess("Upload complete");
          setUploading(false);
          setProgress(100);
          setFile(null);
          onUploadFinished?.(url);
          try {
            window.dispatchEvent(new Event("files-changed"));
          } catch (e) {
            console.warn("Could not dispatch files-changed event", e);
          }
        } catch (e) {
          console.error(e);
          setError("Could not get file URL after upload.");
          setUploading(false);
        }
      }
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">Upload file</label>

      <div className="flex items-center gap-3">
        <input
          type="file"
          onChange={(e) => {
            setError("");
            setSuccess("");
            setFile(e.target.files?.[0] ?? null);
          }}
          className="text-sm text-gray-600"
        />

        <button
          onClick={uploadFile}
          disabled={uploading}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>

      {uploading && (
        <div className="mt-5">
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="h-2 bg-indigo-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs text-gray-500 mt-1">{progress}%</div>
        </div>
      )}

      {error && <div className="mt-3 text-sm text-red-700 bg-red-50 px-3 py-2 rounded">{error}</div>}
      {success && <div className="mt-3 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">{success}</div>}
    </div>
  );
}

export default FileUpload;