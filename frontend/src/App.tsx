import {useState} from 'react'
import axios, {HttpStatusCode, isAxiosError} from 'axios'
import './App.css'
import '@blocknote/mantine/style.css';
import {User} from "./types.ts";
import Editor from "./Editor/Editor.tsx";
import {useAsyncOnMountUnsafe} from "./utils/hooks.ts";

function App() {

  const [documentId, setDocumentId] = useState<string | undefined>(location.pathname.match(/\/documents\/(.*)/)?.[1]);
  const [documentContent, setDocumentContent] = useState<string | undefined>(undefined);

  const urlParams = new URLSearchParams(window.location.search);
  const [user] = useState<User>({
    displayName: urlParams.get("displayName") || "unknown user",
    color: '#' + (urlParams.get("color") || (Math.random()*0xFFFFFF<<0).toString(16)),
  });

  useAsyncOnMountUnsafe(async () => {
    try {
      const response = await axios.get(`/documents/${documentId}`);
      setDocumentContent(response.data.content);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === HttpStatusCode.NotFound) {
        const {content, id} = (await axios.post('/documents')).data;
        setDocumentContent(content);
        setDocumentId(id);
        window.history.replaceState(null, "", `/documents/${id}?${urlParams}`);
      } else {
        throw err;
      }
    }
  }, []);

  if (documentContent === undefined) {
    return <div>Loading...</div>;
  }

  return <Editor
    documentId={documentId || ""}
    initialContent={documentContent}
    user={user}
  />;
}

export default App