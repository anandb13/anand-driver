import { useEffect, useState } from "react";
import { auth, storage } from "../firebase";
import { ref, listAll, getDownloadURL, deleteObject, getMetadata } from "firebase/storage";

function FileList({ onStorageUpdate, MAX_STORAGE }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState({});
  const [totalSize, setTotalSize] = useState(0);

  const getProgressColor = (percentage) => {
    if (percentage > 90) return "bg-red-600";
    if (percentage > 70) return "bg-yellow-500";
    return "bg-green-600";
  };

  const fetchFiles = async () => {
    setError("");
    if (!auth.currentUser) {
      setFiles([]);
      setTotalSize(0);
      return;
    }

    setLoading(true);
    try {
      const userFolderRef = ref(storage, `files/${auth.currentUser.uid}`);
      const result = await listAll(userFolderRef);

      let total = 0;
      const fileList = await Promise.all(
        result.items.map(async (item) => {
          const [url, meta] = await Promise.all([getDownloadURL(item), getMetadata(item)]);
          total += meta.size || 0;
          return {
            name: item.name,
            fullPath: item.fullPath,
            size: meta.size || 0,
            updated: meta.updated,
            url,
          };
        })
      );

      setFiles(fileList);
      setTotalSize(total);
      if (onStorageUpdate) {
        onStorageUpdate(total);
      }
    } catch (err) {
      console.error(err);
      setError("Could not load files.");
      setFiles([]);
      setTotalSize(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
    if (!auth.currentUser) return setError("Not authenticated.");

    setDeleting((s) => ({ ...s, [file.name]: true }));
    setError("");
    try {
      const fileRef = ref(storage, `files/${auth.currentUser.uid}/${file.name}`);
      await deleteObject(fileRef);
      await fetchFiles();
      try {
        window.dispatchEvent(new Event("files-changed"));
      } catch (e) {}
    } catch (err) {
      console.error(err);
      setError("Could not delete file. Try again.");
    } finally {
      setDeleting((s) => ({ ...s, [file.name]: false }));
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 MB";
    const units = ["Bytes", "KB", "MB", "GB", "TB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
  };

  useEffect(() => {
    fetchFiles();
    const handler = () => {
      fetchFiles();
    };
    window.addEventListener("files-changed", handler);
    return () => window.removeEventListener("files-changed", handler);
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm w-full max-w-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-800">Your files</h3>
        <button
          onClick={fetchFiles}
          className="text-sm px-3 py-1"
          disabled={loading}
        >
          <img
            src="/refresh.svg"
            alt="Refresh"
            className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700">
          Storage Used: {formatBytes(totalSize)} / {formatBytes(MAX_STORAGE)}
        </p>

        <div className="w-full h-3 bg-gray-200 rounded-full mt-1">
          <div
            className={`h-3 rounded-full ${getProgressColor(
              (totalSize / MAX_STORAGE) * 100
            )}`}
            style={{ width: `${(totalSize / MAX_STORAGE) * 100}%` }}
          ></div>
        </div>

        {totalSize >= MAX_STORAGE && (
          <p className="text-xs text-red-600 mt-1 font-medium">
            Storage limit reached — please delete files to upload more.
          </p>
        )}
      </div>

      {error && <div className="mb-3 text-sm text-red-700 bg-red-50 px-3 py-2 rounded">{error}</div>}

      {!loading && files.length === 0 && <div className="text-sm text-gray-500">No files uploaded yet.</div>}

      <ul className="space-y-2">
        {files.map((f, idx) => (
          <li key={idx} className="flex items-center justify-between p-2">
            <p className="text-sm cursor-default text-indigo-600 truncate">{f.name}</p>

            <div className="flex items-center gap-2">
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 ml-3 px-2 py-1 hover:bg-gray-100 rounded inline-flex items-center"
                aria-label={`Open ${f.name}`}
                title={`Open ${f.name}`}
              >
                <img src="/download.svg" alt="" className="w-5 h-5" />
              </a>

              <button
                type="button"
                onClick={() => handleDelete(f)}
                disabled={!!deleting[f.name]}
                aria-label={`Delete ${f.name}`}
                title={`Delete ${f.name}`}
                className="text-sm text-red-600 px-2 py-1 hover:bg-red-50 rounded inline-flex items-center"
              >
                <img src="/delete-red.svg" alt="" className="w-5 h-5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FileList;