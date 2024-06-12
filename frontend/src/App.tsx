import {useState, useEffect} from 'react'
import axios from 'axios'
import './App.css'

type Post = {
  id: number,
  title: string,
  content: string,
}

function App() {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    axios.get('/posts').then(response => setPosts(response.data)).catch(console.error)
  }, [])

  return (
    posts.length === 0
      ? <p>No posts</p>
      : (
        <>
          <h1>Posts</h1>
          {posts.map(post => (
            <>
              <h2>{post.title}</h2>
              <p>{post.content}</p>
            </>
          ))}
        </>
      )
  )
}

export default App