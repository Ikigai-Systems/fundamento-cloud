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

  // Set up global DOM objects
  (global as any).window = window;
  (global as any).document = window.document;
  (global as any).navigator = window.navigator;
  (global as any).HTMLElement = window.HTMLElement;
  (global as any).Element = window.Element;
  (global as any).Node = window.Node;
  (global as any).DocumentFragment = window.DocumentFragment;
  (global as any).Text = window.Text;
  (global as any).Comment = window.Comment;

  // Mock requestIdleCallback and cancelIdleCallback for React
  (global as any).requestIdleCallback = (cb: any) => {
    return setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 1);
  };
  (global as any).cancelIdleCallback = clearTimeout;

  isSetup = true;
}
