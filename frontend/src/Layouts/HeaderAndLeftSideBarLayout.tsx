import {PropsWithChildren, ReactNode} from "react";

type HeaderAndLeftSideBarLayoutProps = {
  topHeaderContent?: ReactNode,
  leftSideBarContent?: ReactNode,
}

const HeaderAndLeftSideBarLayout = ({children, topHeaderContent, leftSideBarContent} : PropsWithChildren<HeaderAndLeftSideBarLayoutProps>) => {
  return <div className="h-vh grid grid-cols-[minmax(10px,300px)_minmax(10px,_3fr)] grid-rows-[min-content_min-content_1fr_min-content]">
    <header className="col-start-1 col-end--1
      border-b-solid border-b-1 border-b-gray-3
      flex justify-center items-center min-h-12"
    >
      {topHeaderContent || <div className="p-xy">"Top Header"</div>}
    </header>
    <aside className="col-start-1 col-end-2 row-start-2 row-end-4
      border-r-solid border-r-1 border-r-gray-3
      overflow-auto"
    >
      {leftSideBarContent || <div className="text-left m-x-4 c-gray-6">LeftSideBar</div>}
    </aside>
    <article className="col-start-2 col-end-3 row-start-2 row-end-4
      overflow-auto"
    >
      {children}
    </article>
  </div>
}

export default HeaderAndLeftSideBarLayout;