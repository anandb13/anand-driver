import { useEffect, useState } from "react";
import { auth, storage } from "../firebase";
import { ref, listAll, getDownloadURL } from "firebase/storage";

function FileList() {
  const [files, setFiles] = useState([]);

  const fetchFiles = () => {
    if (!auth.currentUser) return;

    const listRef = ref(storage, `files/${auth.currentUser.uid}/`);

    listAll(listRef).then((res) => {
      const fileData = [];
      res.items.forEach((item) => {
        getDownloadURL(item).then((url) => {
          fileData.push({ name: item.name, url });
          setFiles([...fileData]);
        });
      });
    });
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div>
      <h3>Your Files</h3>
      <button onClick={fetchFiles}>Refresh</button>
      <ul>
        {files.map((f, idx) => (
          <li key={idx}>
            <a href={f.url} target="_blank" rel="noopener noreferrer">
              {f.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FileList;
