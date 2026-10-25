import {SpinnerIcon} from "../spinners/Spinner.tsx";

export const LoadingContent = () => {
  return <div className="pl-[3.4rem] pb-1 mt-5 flex gap-2">
    <SpinnerIcon/>
    Loading content...
  </div>;
}

export default LoadingContent;
