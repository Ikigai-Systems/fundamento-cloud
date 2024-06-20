import TopHeader from "../Components/TopHeader/TopHeader.tsx";
import LeftSideBar from "../Components/LeftSideBar/LeftSideBar.tsx";
import {PropsWithChildren} from "react";

type DocumentPageProps = {
}

const DocumentLayout = ({children} : PropsWithChildren<DocumentPageProps>) => {
  return <div className="h-vh grid grid-cols-[minmax(10px,300px)_minmax(10px,_3fr)] grid-rows-[min-content_min-content_1fr_min-content]">
    <header className="col-start-1 col-end--1
      border-b-solid border-b-1 border-b-gray-3
      flex justify-center items-center"
    >
      <TopHeader></TopHeader>
    </header>
    <aside className="col-start-1 col-end-2 row-start-2 row-end-4
      border-r-solid border-r-1 border-r-gray-3
      overflow-auto"
    >
      <LeftSideBar></LeftSideBar>
    </aside>
    <article className="col-start-2 col-end-3 row-start-2 row-end-4
      overflow-auto"
    >
      {children}
    </article>
  </div>
}

export default DocumentLayout;