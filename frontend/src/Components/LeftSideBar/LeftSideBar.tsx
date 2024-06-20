import CenteredSpinnerCover from "../Spinners/CenteredSpinnerCover.tsx";
import {useContext, useState} from "react";
import {Document} from "../../types.ts";
import {useAsyncOnMountUnsafe} from "../../utils/hooks.ts";
import axios from "axios";
import {CurrentDocumentContext} from "../../Contextes/CurrentDocumentContext.tsx";

type LeftSideBarProps = {

}

const LeftSideBar = ({} : LeftSideBarProps) => {
  const {documentId, setDocumentId} = useContext(CurrentDocumentContext);
  const [documents, setDocuments] = useState<Document[] | undefined>(undefined)

  useAsyncOnMountUnsafe(async () => {
    const documents = await axios.get('/documents');
    setDocuments(documents.data);
  }, []);

  if (documents === undefined) {
    return <CenteredSpinnerCover/>
  }

  return <div className="text-left m-x-4 c-gray-6">
    <div className="p-4 font-bold">Documents</div>
    {documents.map((document: Document) => {
      return <div
        key={document.id}
        className={`${document.id === documentId ? " bg-blue-1 hover:bg-blue-2 active:bg-blue-3" : "hover:bg-gray-1 active:bg-gray-2"} p-1 cursor-pointer`}
        onClick={() => {
          setDocumentId(document.id);
        }}
      >
        {document.id}
      </div>
    })}
  </div>
}

export default LeftSideBar;