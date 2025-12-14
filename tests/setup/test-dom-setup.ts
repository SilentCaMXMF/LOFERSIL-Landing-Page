/**
 * DOM Test Setup
 * Sets up DOM environment for browser-based tests
 */

import { JSDOM } from "jsdom";

// Set up JSDOM environment
const dom = new JSDOM(
  "<!DOCTYPE html><html><head></head><body></body></html>",
  {
    url: "http://localhost:3000",
    pretendToBeVisual: true,
    resources: "usable",
    runScripts: "dangerously",
  },
);

// Make DOM globals available
global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.NodeList = dom.window.NodeList;
global.HTMLCollection = dom.window.HTMLCollection;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.FocusEvent = dom.window.FocusEvent;
global.FormEvent = dom.window.FormEvent;
global.Storage = dom.window.Storage;
global.localStorage = dom.window.localStorage;
global.sessionStorage = dom.window.sessionStorage;
global.URL = dom.window.URL;
global.URLSearchParams = dom.window.URLSearchParams;
global.Blob = dom.window.Blob;
global.File = dom.window.File;
global.FileReader = dom.window.FileReader;
global.FormData = dom.window.FormData;
global.Headers = dom.window.Headers;
global.Request = dom.window.Request;
global.Response = dom.window.Response;
global.fetch = dom.window.fetch;
global.WebSocket = dom.window.WebSocket;
global.Worker = dom.window.Worker;
global.Image = dom.window.Image;
global.CanvasRenderingContext2D = dom.window.CanvasRenderingContext2D;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.HTMLImageElement = dom.window.HTMLImageElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
global.HTMLSelectElement = dom.window.HTMLSelectElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;
global.HTMLFormElement = dom.window.HTMLFormElement;
global.HTMLAnchorElement = dom.window.HTMLAnchorElement;
global.HTMLDivElement = dom.window.HTMLDivElement;
global.HTMLSpanElement = dom.window.HTMLSpanElement;
global.HTMLHeadingElement = dom.window.HTMLHeadingElement;
global.HTMLParagraphElement = dom.window.HTMLParagraphElement;
global.HTMLUListElement = dom.window.HTMLUListElement;
global.HTMLOListElement = dom.window.HTMLOListElement;
global.HTMLLIElement = dom.window.HTMLLIElement;

// Mock browser APIs that aren't available in JSDOM
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
global.scrollTo = dom.window.scrollTo;
global.scrollBy = dom.window.scrollBy;
global.scrollIntoView = dom.window.Element.prototype.scrollIntoView;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  root = null;
  rootMargin = "";
  thresholds = [];
} as any;

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
  constructor(private callback: MutationCallback) {}
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as any;

// Mock Performance API
global.performance = {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
  getEntriesByName: () => [],
  getEntriesByType: () => [],
  clearMarks: () => {},
  clearMeasures: () => {},
} as any;

// Mock Screen API
global.screen = {
  width: 1920,
  height: 1080,
  availWidth: 1920,
  availHeight: 1040,
  colorDepth: 24,
  pixelDepth: 24,
} as any;

// Mock Visual Viewport API
(global as any).visualViewport = {
  width: 1920,
  height: 1080,
  offsetLeft: 0,
  offsetTop: 0,
  pageLeft: 0,
  pageTop: 0,
  scale: 1,
};

// Mock Clipboard API
Object.defineProperty(global.navigator, "clipboard", {
  value: {
    writeText: () => Promise.resolve(),
    readText: () => Promise.resolve(""),
    write: () => Promise.resolve(),
    read: () => Promise.resolve([]),
  },
  writable: true,
});

// Mock Geolocation API
if (!global.navigator.geolocation) {
  Object.defineProperty(global.navigator, "geolocation", {
    value: {
      getCurrentPosition: (success: Function) => {
        setTimeout(
          () =>
            success({
              coords: { latitude: 0, longitude: 0, accuracy: 100 },
              timestamp: Date.now(),
            }),
          0,
        );
      },
      watchPosition: () => 1,
      clearWatch: () => {},
    },
    writable: true,
  });
}

// Mock MediaDevices API
Object.defineProperty(global.navigator, "mediaDevices", {
  value: {
    getUserMedia: () =>
      Promise.resolve({
        getTracks: () => [],
        getAudioTracks: () => [],
        getVideoTracks: () => [],
      }),
    enumerateDevices: () => Promise.resolve([]),
  },
  writable: true,
});

// Mock Notification API
global.Notification = class Notification {
  static permission = "default";
  static requestPermission = () => Promise.resolve("default");
  title: string;
  options: any;

  constructor(title: string, options?: any) {
    this.title = title;
    this.options = options;
  }

  close() {}
} as any;

// Mock Service Worker API
Object.defineProperty(global.navigator, "serviceWorker", {
  value: {
    register: () =>
      Promise.resolve({
        installing: null,
        waiting: null,
        active: null,
        scope: "/",
        update: () => Promise.resolve(),
        unregister: () => Promise.resolve(true),
      }),
    controller: null,
    ready: Promise.resolve({
      active: null,
    }),
  },
  writable: true,
});

// Mock Geolocation API
if (!(global.navigator as any).geolocation) {
  Object.defineProperty(global.navigator, "geolocation", {
    value: {
      getCurrentPosition: (success: Function) => {
        setTimeout(
          () =>
            success({
              coords: { latitude: 0, longitude: 0, accuracy: 100 },
              timestamp: Date.now(),
            }),
          0,
        );
      },
      watchPosition: () => 1,
      clearWatch: () => {},
    },
    writable: true,
    configurable: true,
  });
}

// Mock MediaDevices API
if (!global.navigator.mediaDevices) {
  Object.defineProperty(global.navigator, "mediaDevices", {
    value: {
      getUserMedia: () =>
        Promise.resolve({
          getTracks: () => [],
          getAudioTracks: () => [],
          getVideoTracks: () => [],
        }),
      enumerateDevices: () => Promise.resolve([]),
    },
    writable: true,
    configurable: true,
  });
}

// Mock Notification API
global.Notification = class Notification {
  static permission = "default";
  static requestPermission = () => Promise.resolve("default");
  title: string;
  options: any;

  constructor(title: string, options?: any) {
    this.title = title;
    this.options = options;
  }

  close() {}
} as any;

// Mock Service Worker API
if (!global.navigator.serviceWorker) {
  Object.defineProperty(global.navigator, "serviceWorker", {
    value: {
      register: () =>
        Promise.resolve({
          installing: null,
          waiting: null,
          active: null,
          scope: "/",
          update: () => Promise.resolve(),
          unregister: () => Promise.resolve(true),
        }),
      controller: null,
      ready: Promise.resolve({
        active: null,
      }),
    },
    writable: true,
    configurable: true,
  });
}

// Export DOM utilities for tests
export const domUtils = {
  createElement: (
    tagName: string,
    attributes: Record<string, string> = {},
    children: string = "",
  ) => {
    const element = document.createElement(tagName);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    if (children) {
      element.innerHTML = children;
    }
    return element;
  },

  createInput: (type: string, name: string, value: string = "") => {
    const input = document.createElement("input");
    input.type = type;
    input.name = name;
    input.value = value;
    return input;
  },

  createForm: (action: string = "", method: string = "POST") => {
    const form = document.createElement("form");
    form.action = action;
    form.method = method;
    return form;
  },

  addStyles: (styles: string) => {
    const style = document.createElement("style");
    style.textContent = styles;
    document.head.appendChild(style);
  },

  clearDOM: () => {
    document.body.innerHTML = "";
    document.head.innerHTML = "";
  },
};
