import {useState, useEffect} from 'react'
import axios from 'axios'
import './App.css'
import {BlockNoteView} from "@blocknote/mantine";
import {useCreateBlockNote} from "@blocknote/react";
import '@blocknote/mantine/style.css';
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import {Post} from "./types.ts";

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

  useEffect(() => {
    axios.get('/posts').then(response => setPosts(response.data)).catch(console.error)
  }, [])

  const editor = useCreateBlockNote({
    collaboration: {
      provider: wsProvider,
      fragment: doc.getXmlFragment("document-store"),
      user: {
        name: "Stefan",
        color: "#ff0000",
      }
    }
  });

  return <>
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