import { useState } from "react";
import { storage, auth } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

function FileUpload({ totalSize, MAX_STORAGE, onUploadFinished }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const uploadFile = () => {
    if (!file) return setError("Please select a file.");
    if (totalSize + file.size > MAX_STORAGE) {
      return setError("Storage limit reached. Please delete files to upload more.");
    }

    setUploading(true);
    setProgress(0);

    const userId = auth.currentUser.uid;
    const filePath = `files/${userId}/${file.name}`;
    const fileRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(percent));
      },
      (error) => {
        console.error(error);
        setUploading(false);
        setError("Upload failed, try again.");
      },
      () => {
        setUploading(false);
        setProgress(100);
        setFile(null);
        setError("");
        setSuccess("Upload completed!");
        if (onUploadFinished) onUploadFinished();
      }
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">Upload file</label>

      <div className="flex items-center gap-16">
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
          disabled={uploading || totalSize >= MAX_STORAGE}
          className={`px-4 py-2 rounded-md text-white text-sm w-24
            ${totalSize >= MAX_STORAGE
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"}
          `}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {uploading && (
        <div className="mt-5">
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="h-2 bg-indigo-600"
              style={{ width: `${progress}%` }}
            />
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