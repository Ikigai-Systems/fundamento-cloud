import { Window } from "happy-dom";

let isSetup = false;

export function setupDOM() {
  if (isSetup) {
    return;
  }

  const window = new Window({
    url: "http://localhost",
    width: 1024,
    height: 768,
  });

  const globalObj = global as unknown as Record<string, unknown>;

  // Set up global DOM objects
  globalObj.window = window;
  globalObj.document = window.document;
  Object.defineProperty(global, "navigator", {value: window.navigator, writable: true, configurable: true});
  globalObj.HTMLElement = window.HTMLElement;
  globalObj.Element = window.Element;
  globalObj.Node = window.Node;
  globalObj.DocumentFragment = window.DocumentFragment;
  globalObj.Text = window.Text;
  globalObj.Comment = window.Comment;

  // Mock requestIdleCallback and cancelIdleCallback for React
  globalObj.requestIdleCallback = (cb: (deadline: {didTimeout: boolean; timeRemaining: () => number}) => void) => {
    return setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 1);
  };
  globalObj.cancelIdleCallback = clearTimeout;

  isSetup = true;
}
