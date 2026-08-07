import { useState, useRef, useEffect } from "react";
import { storage, auth } from "../firebase";
import { ref, uploadBytesResumable } from "firebase/storage";

const formatSize = (bytes) => `${Math.round((bytes / (1024 * 1024)) * 100) / 100} MB`;

function FileUpload({ totalSize, MAX_STORAGE, onUploadFinished }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const progressRef = useRef([]);

  const totalSelectedSize = files.reduce((sum, file) => sum + file.size, 0);
  const remainingBytes = MAX_STORAGE - totalSize;

  const uploadFiles = () => {
    if (!files.length) return setError("Please select at least one file.");
    if (totalSelectedSize > remainingBytes) {
      return setError("Selected files exceed available storage.");
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      setError("No authenticated user found.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");
    setProgress(0);

    const totalBytes = totalSelectedSize;
    progressRef.current = new Array(files.length).fill(0);
    let completedCount = 0;
    let failed = false;

    const finishUpload = () => {
      setUploading(false);
      if (!failed) {
        setProgress(100);
        setSuccess(`${files.length} file${files.length > 1 ? "s" : ""} uploaded successfully!`);
        setFiles([]);
        if (onUploadFinished) onUploadFinished();
      }
    };

    files.forEach((file, index) => {
      const filePath = `files/${userId}/${file.name}`;
      const fileRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          progressRef.current[index] = snapshot.bytesTransferred;
          const bytesTransferred = progressRef.current.reduce((sum, value) => sum + value, 0);
          setProgress(Math.round((bytesTransferred / totalBytes) * 100));
        },
        (uploadError) => {
          console.error(uploadError);
          if (!failed) {
            failed = true;
            setError("Upload failed, try again.");
            setUploading(false);
          }
        },
        () => {
          completedCount += 1;
          if (completedCount === files.length && !failed) {
            finishUpload();
          }
        }
      );
    });
  };

  const handleFiles = (fileList) => {
    setError("");
    setSuccess("");
    if (!fileList) return;

    const incomingFiles = Array.from(fileList);
    if (!incomingFiles.length) return;

    const addedFiles = [];
    let usedBytes = 0;
    let skipped = false;
    const existingIds = files.map((file) => `${file.name}-${file.size}`);

    for (const file of incomingFiles) {
      if (remainingBytes - usedBytes < file.size) {
        skipped = true;
        continue;
      }
      const id = `${file.name}-${file.size}`;
      if (!existingIds.includes(id)) {
        addedFiles.push(file);
        usedBytes += file.size;
      }
    }

    if (skipped) {
      setError("Some files were skipped because they exceed your remaining storage.");
    }

    if (!addedFiles.length) {
      if (!skipped) {
        setError("No new files were added.");
      }
      return;
    }

    setFiles((prevFiles) => [...prevFiles, ...addedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
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

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(t);
  }, [success]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">Upload files</label>

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
        aria-label="Select or drag and drop files to upload"
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          onChange={onInputChange}
        />

        <div className="flex flex-col items-center justify-center">
          <img src="/cloud-upload.svg" alt="" className="w-10 h-10 mb-2" />
          <div className="text-sm text-gray-700 font-medium">
            {files.length ? (
              <div className="space-y-1 text-left">
                <div className="font-semibold">{files.length} selected file{files.length > 1 ? "s" : ""}</div>
                <div className="text-xs text-gray-500">Click here to add more files or drag more files onto the box.</div>
              </div>
            ) : (
              <>
                <span>Drag & drop files here or <span className="text-indigo-600 underline">browse</span></span>
                <div className="text-xs text-gray-500 mt-1">{formatSize(remainingBytes)} remaining</div>
              </>
            )}
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
            <span>Selected files</span>
            <span>{formatSize(totalSelectedSize)}</span>
          </div>
          <ul className="space-y-2 max-h-40 overflow-auto">
            {files.map((file, index) => (
              <li key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 shadow-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium text-gray-800">{file.name}</div>
                  <div className="text-xs text-gray-500">{formatSize(file.size)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex gap-3 items-center">
        <button
          onClick={uploadFiles}
          disabled={uploading || !files.length || totalSize >= MAX_STORAGE}
          className={`px-4 py-2 rounded-md text-white text-sm
            ${!files.length || totalSize >= MAX_STORAGE ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <div className="text-sm text-gray-600">{files.length ? `${files.length} file${files.length > 1 ? "s" : ""} selected` : null}</div>
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