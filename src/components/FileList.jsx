import { useEffect, useState } from "react";
import { auth, storage } from "../firebase";
import { ref, listAll, getDownloadURL, deleteObject, getMetadata } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import ConfirmationModal from "./Modal";

function FileList({ onStorageUpdate, MAX_STORAGE }) {
  const PAGE_SIZE = 10;
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState({});
  const [sending, setSending] = useState({});
  const [confirm, setConfirm] = useState({ open: false, type: null, file: null });
  const [processing, setProcessing] = useState(false);
  const [totalSize, setTotalSize] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

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

      const sortedFiles = fileList.sort((a, b) => {
        const aTime = a.updated ? new Date(a.updated).getTime() : 0;
        const bTime = b.updated ? new Date(b.updated).getTime() : 0;
        return bTime - aTime;
      });

      setFiles(sortedFiles);
      setCurrentPage(1);
      setTotalSize(total);
      if (onStorageUpdate) {
        onStorageUpdate(total);
      }
    } catch (err) {
      console.error(err);
      setError("Could not load files.");
      setFiles([]);
      setCurrentPage(1);
      setTotalSize(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file) => {
    // now driven by confirmation modal; this function performs the delete
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

  const sendToEmail = async (file) => {
    setError("");
    if (!auth.currentUser) return setError("You must be signed in to email files.");
    setSending((s) => ({ ...s, [file.name]: true }));
    try {
      const sendEmail = httpsCallable(functions, "emailFileAttachment");
      await sendEmail({
        fullPath: file.fullPath,
        fileName: file.name,
      });
      // minimal success feedback
      window.dispatchEvent(new CustomEvent("notify", { detail: { type: "success", message: `Sent ${file.name} to your email.` } }));
    } catch (err) {
      console.error("sendToEmail error:", err);
      setError(err?.message || "Failed to send email.");
    } finally {
      setSending((s) => ({ ...s, [file.name]: false }));
    }
  };

  const openConfirm = (type, file) => {
    setConfirm({ open: true, type, file });
  };

  const closeConfirm = () => setConfirm({ open: false, type: null, file: null });

  const handleConfirm = async () => {
    const { type, file } = confirm;
    if (!file || !type) return closeConfirm();
    setProcessing(true);
    try {
      if (type === "delete") {
        await handleDelete(file);
      } else if (type === "email") {
        await sendToEmail(file);
      }
    } finally {
      setProcessing(false);
      closeConfirm();
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 MB";
    const units = ["Bytes", "KB", "MB", "GB", "TB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
  };

  const totalPages = Math.ceil(files.length / PAGE_SIZE);
  const paginatedFiles = files.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

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
      <ConfirmationModal
        open={confirm.open}
        title={confirm.type === "delete" ? "Delete file" : "Send file by email"}
        message={
          confirm.type === "delete"
            ? `Delete "${confirm.file?.name}"? This cannot be undone.`
            : `Send "${confirm.file?.name}" to your registered email?`
        }
        confirmLabel={confirm.type === "delete" ? "Delete" : "Send"}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
        loading={processing || (!!confirm.file && (deleting[confirm.file.name] || sending[confirm.file.name]))}
      />
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
        {paginatedFiles.map((f) => (
          <li key={f.fullPath} className="flex items-center justify-between p-2 gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm cursor-default text-indigo-600 truncate">{f.name}</p>
            </div>

            <div className="flex flex-none items-center space-x-2">
              <button
                onClick={() => openConfirm("email", f)}
                className="text-sm text-gray-600 px-2 py-1 hover:bg-gray-100 rounded inline-flex items-center"
                title="Email File"
              >
                <img src="/email.svg" alt="Email" className="w-5 h-5" />
              </button>

              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 px-2 py-1 hover:bg-gray-100 rounded inline-flex items-center"
                aria-label={`Open ${f.name}`}
                title={`Download ${f.name}`}
              >
                <img src="/download.svg" alt="Download" className="w-5 h-5" />
              </a>

              <button
                type="button"
                onClick={() => openConfirm("delete", f)}
                disabled={!!deleting[f.name]}
                aria-label={`Delete ${f.name}`}
                title={`Delete ${f.name}`}
                className="text-sm text-red-600 px-2 py-1 hover:bg-red-50 rounded inline-flex items-center"
              >
                <img src="/delete-red.svg" alt="Delete" className="w-5 h-5" />
              </button>
            </div>

          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={currentPage === 1 || loading}
            className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
            disabled={currentPage === totalPages || loading}
            className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default FileList;