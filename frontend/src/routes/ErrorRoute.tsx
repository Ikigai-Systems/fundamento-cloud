import {isRouteErrorResponse, useRouteError} from "react-router-dom";

export default function ErrorRoute() {
  const error = useRouteError();
  console.error(error);

  let errorMessage: string;
  if (isRouteErrorResponse(error)) {
    // @ts-expect-error ErrorResponse has missing annotations
    errorMessage = error.error?.message || error.statusText;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = 'Unknown error';
  }

  return (
    <div className="flex flex-justify-center flex-items-center h-vh">
      <div id="error-page" className="text-center">
        <h1 className="m-t-0">Oops!</h1>
        <p>Sorry, an unexpected error has occurred.</p>
        <p>
          {isRouteErrorResponse(error) && <i>{errorMessage}</i>}
        </p>
      </div>
    </div>
  );
}