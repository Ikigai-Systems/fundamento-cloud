import {useContext, useState} from 'react'
import axios, {HttpStatusCode, isAxiosError} from 'axios'
import './App.css'
import '@blocknote/mantine/style.css';
import {User} from "./types.ts";
import Editor from "./Editor/Editor.tsx";
import {useAsyncOnMountUnsafe} from "./utils/hooks.ts";
import DocumentLayout from "./Layouts/DocumentLayout.tsx";
import {CurrentDocumentContext, CurrentDocumentContextType} from "./Contextes/CurrentDocumentContext.tsx";

function App() {
  const {documentId, setDocumentId}: CurrentDocumentContextType = useContext<CurrentDocumentContextType>(CurrentDocumentContext);
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
      } else {
        throw err;
      }
    }
  }, []);

  console.log("documentId::::", documentId);
  return <DocumentLayout>
    {documentContent === undefined
      ? <div>Loading...</div>
      : <Editor
        initialContent={documentContent}
        user={user}
      />
    }
  </DocumentLayout>
}

export default App