import { useState, useRef } from "react";
import { storage, auth } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

function FileUpload({ totalSize, MAX_STORAGE, onUploadFinished }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

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

  const handleFiles = (f) => {
    setError("");
    setSuccess("");
    if (!f) return;
    const first = f[0];
    if (!first) return;
    if (totalSize + first.size > MAX_STORAGE) {
      setError("This file would exceed your storage limit.");
      return;
    }
    setFile(first);
  };

  const onInputChange = (e) => handleFiles(e.target.files);

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dtFiles = e.dataTransfer?.files;
    handleFiles(dtFiles);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">Upload file</label>

      {/* modern drag/drop + clickable area */}
      <div
        className={`relative border-2 rounded-md p-6 text-center transition-colors
          ${dragActive ? "border-indigo-500 bg-indigo-50" : "border-dashed border-gray-300 bg-white"}`}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        aria-label="Select or drag and drop a file to upload"
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={onInputChange}
        />

        <div className="flex flex-col items-center justify-center">
          <img src="/cloud-upload.svg" alt="" className="w-10 h-10 mb-2" />
          <div className="text-sm text-gray-700 font-medium">
            {file ? (
              <span className="inline-flex items-center gap-2">
                <span className="truncate max-w-xs">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-xs text-gray-500 hover:text-gray-700 ml-2"
                  aria-label="Remove selected file"
                >
                  Remove
                </button>
              </span>
            ) : (
              <>
                <span>Drag & drop a file here or <span className="text-indigo-600 underline">browse</span></span>
                <div className="text-xs text-gray-500 mt-1">Max: {Math.round((MAX_STORAGE - totalSize) / (1024 * 1024))} MB remaining</div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-3 items-center">
        <button
          onClick={uploadFile}
          disabled={uploading || !file || totalSize >= MAX_STORAGE}
          className={`px-4 py-2 rounded-md text-white text-sm
            ${!file || totalSize >= MAX_STORAGE ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <div className="text-sm text-gray-600">{file ? `${Math.round(file.size / (1024 * 1024) * 100) / 100} MB` : null}</div>
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