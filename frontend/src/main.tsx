import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import 'virtual:uno.css'
import axios from 'axios'
import App from './App.tsx'
import baseUrl from "./base-url.tsx";
import {withCurrentDocumentContext} from "./Contextes/CurrentDocumentContext.tsx";

axios.defaults.baseURL = baseUrl + "/api/v1";

const WrappedApp = withCurrentDocumentContext(App);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WrappedApp/>
  </React.StrictMode>
)
