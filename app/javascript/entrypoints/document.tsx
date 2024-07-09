import React from 'react'
import ReactDOM from 'react-dom/client'
import EditDocumentPage from "../components/EditDocumentPage";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EditDocumentPage document={JSON.parse(document.getElementById('document').getAttribute('data'))}/>
  </React.StrictMode>
)
