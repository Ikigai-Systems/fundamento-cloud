import {useEffect, useMemo, useState} from 'react'
import axios from 'axios'
import './App.css'
import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import * as Y from 'yjs'
import {WebsocketProvider} from 'y-websocket'
import {Post} from "./types.ts";
import {BlockNoteEditor, PartialBlock} from "@blocknote/core";
import useAsyncEffect from "use-async-effect";

const doc = new Y.Doc()
const wsProvider = new WebsocketProvider('ws://localhost:1234', 'my-roomname', doc)

type Event = {
  status: string
}

wsProvider.on('status', (event: Event) => {
  console.log(event.status) // logs "connected" or "disconnected"
})

function App() {
  const [posts, setPosts] = useState<Post[]>([])

  const [documentId, setDocumentId] = useState<string>("");

  const [initialContent, setInitialContent] = useState<PartialBlock[] | undefined | "loading">("loading");

  useEffect(() => {
    axios.get('/posts').then(response => setPosts(response.data)).catch(console.error)
  }, [])

  /*
  const editor = useCreateBlockNote({
    collaboration: {
      provider: wsProvider,
      fragment: doc.getXmlFragment("document-store"),
      user: {
        name: "Stefan",
        color: "#ff0000",
      }
    }
  });*/

  useAsyncEffect(async () => {
    const documentIdFromUrl = location.pathname.split("/")?.[1];
    if (documentIdFromUrl) {
      const response = await axios.get(`/documents/${documentIdFromUrl}`);
      setInitialContent(JSON.parse(response.data.content));
    } else {
      setInitialContent(undefined);
    }
  }, ["hot"]);

  // Loads the previously stored editor contents.
  useEffect(() => {
    // loadFromStorage().then((content) => {
    //   setInitialContent(content);
    // });
  }, []);

  const editor = useMemo(() => {
    if (initialContent === "loading") {
      return undefined;
    }
    return BlockNoteEditor.create({ initialContent });
  }, [initialContent]);

  if (editor === undefined) {
    return "Loading content...";
  }

  return <>
    <div className="flex justify-end">
      <label className="flex flex-col justify-center mr-1">
        Document id:
      </label>
      <input type="text"
        className="mr-2"
        onChange={(e) => {
          setDocumentId(e.target.value);
        }}
        value={documentId}
      >
      </input>
      <button
        className="bg-blue-5 hover:bg-blue-6 active:bg-blue-7 c-white"
        onClick={async () => {
          if (documentId) {
            await axios.put(`/documents/${documentId}`, {document: {
              content: JSON.stringify(editor.document),
            }});
          } else {
            const response = await axios.post('/documents', {document: {
              content: JSON.stringify(editor.document),
            }});
            setDocumentId(response.data.id);
          }
        }}>
        Save
      </button>
    </div>
    <div
      border="solid 2"
    >
      teste 2
    </div>
    <div
      className="min-w-2xl min-h-xl border-dashed"
    >
      <BlockNoteView editor={editor}/>
    </div>
    <div>
      {posts.length === 0
        ? <p>No posts</p>
        : (<>
          <h1>Posts</h1>
          {posts.map(post => (
            <>
              <h2>{post.title}</h2>
              <p>{post.content}</p>
            </>
          ))}
        </>)}
    </div>
  </>

  return (
    posts.length === 0
      ? <p>No posts</p>
      : (<>
        <h1>Posts</h1>
        {posts.map(post => (
          <>
            <h2>{post.title}</h2>
            <p>{post.content}</p>
          </>
        ))}
      </>)


  )
}

export default App