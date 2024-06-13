import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import 'virtual:uno.css'
import axios from 'axios'
import App from './App.tsx'
import baseUrl from "./base-url.tsx";

axios.defaults.baseURL = baseUrl;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>,
)
