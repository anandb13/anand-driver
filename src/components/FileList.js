import { useEffect, useState } from "react";
import { auth, storage } from "../firebase";
import { ref, listAll, getDownloadURL } from "firebase/storage";

function FileList() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchFiles = async () => {
    setError("");
    if (!auth.currentUser) {
      setFiles([]);
      return;
    }

    setLoading(true);
    try {
      const listRef = ref(storage, `files/${auth.currentUser.uid}/`);
      const res = await listAll(listRef);
      const items = await Promise.all(
        res.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return { name: item.name, url };
        })
      );
      setFiles(items);
    } catch (err) {
      console.error(err);
      setError("Could not load files.");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm w-full max-w-lg mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-800">Your files</h3>
        <button
          onClick={fetchFiles}
          className="text-sm px-3 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <div className="mb-3 text-sm text-red-700 bg-red-50 px-3 py-2 rounded">{error}</div>}

      {!loading && files.length === 0 && <div className="text-sm text-gray-500">No files uploaded yet.</div>}

      <ul className="space-y-2">
        {files.map((f, idx) => (
          <li key={idx} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
            <a className="text-sm text-indigo-600 hover:underline truncate" href={f.url} target="_blank" rel="noopener noreferrer">
              {f.name}
            </a>
            <a
              href={f.url}
              download
              className="text-sm text-gray-600 ml-3 px-2 py-1 border border-gray-200 rounded hover:bg-gray-50"
            >
              Download
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FileList;