/**
 * Initialize basic DOM structure for tests
 */
const initializeDOM = () => {
  // Check if DOM environment is properly initialized
  if (typeof document === "undefined" || !document.createElement) {
    throw new Error(
      "DOM environment not properly initialized. Make sure jsdom environment is active.",
    );
  }

  // Ensure document body exists before setting innerHTML
  if (!document.body) {
    // Create body element if it doesn't exist
    const body = document.createElement("body");
    document.appendChild(body);
  }

  // Set up the basic HTML structure required by tests
  document.body.innerHTML = `
    <div id="app">
      <header>
        <nav>
          <a href="#contact-form">Contacto</a>
        </nav>
      </header>
      <main>
        <section id="contact-form">
          <h2>Contact Form</h2>
          <form id="contact-form-element" name="contactForm" novalidate>
            <div class="form-group">
              <label for="name">Nome *</label>
              <input type="text" id="name" name="name" required aria-required="true" />
              <div id="name-error" role="alert" class="error-message" aria-live="polite"></div>
            </div>
            <div class="form-group">
              <label for="email">Email *</label>
              <input type="email" id="email" name="email" required aria-required="true" />
              <div id="email-error" role="alert" class="error-message" aria-live="polite"></div>
            </div>
            <div class="form-group">
              <label for="message">Mensagem *</label>
              <textarea id="message" name="message" required aria-required="true" rows="4"></textarea>
              <div id="message-error" role="alert" class="error-message" aria-live="polite"></div>
            </div>
            <button type="submit" aria-label="Enviar formulário de contacto">Enviar</button>
          </form>
        </section>
      </main>
      <footer>
        <div id="notification-container" class="notification-container" aria-live="polite"></div>
        <div id="modal-container" class="modal-container" role="dialog" aria-hidden="true"></div>
      </footer>
    </div>
  `;

  // Add required CSS classes for testing
  document.body.classList.add("test-environment");
  document.documentElement.classList.add("test-mode");

  // Add some basic styles for layout calculations
  const style = document.createElement("style");
  style.setAttribute("data-test", "true");
  style.textContent = `
    .test-environment {
      font-family: Arial, sans-serif;
      line-height: 1.6;
    }
    .hidden { display: none !important; }
    .visible { display: block !important; }
    .loading { opacity: 0.5; }
    .error-message { 
      color: #d32f2f; 
      font-size: 0.8em; 
      margin-top: 0.25rem;
      min-height: 1.2em;
    }
    .notification-container { 
      position: fixed; 
      top: 20px; 
      right: 20px; 
      z-index: 1000;
    }
    .modal-container { 
      position: fixed; 
      top: 0; 
      left: 0; 
      width: 100%; 
      height: 100%;
      z-index: 999;
      background: rgba(0,0,0,0.5);
    }
    .form-group { 
      margin-bottom: 1rem; 
    }
    label { 
      display: block; 
      margin-bottom: 0.5rem; 
      font-weight: 500;
    }
    input, textarea { 
      width: 100%; 
      padding: 0.5rem; 
      border: 1px solid #ccc;
      border-radius: 4px;
      font-family: inherit;
    }
    input:focus, textarea:focus {
      outline: 2px solid #007bff;
      outline-offset: 2px;
    }
    button[type="submit"] {
      padding: 0.75rem 1.5rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
    }
    button[type="submit"]:hover {
      background: #0056b3;
    }
  `;
  document.head.appendChild(style);

  // Add meta tags for better test environment
  const metaCharset = document.createElement("meta");
  metaCharset.setAttribute("charset", "UTF-8");
  document.head.appendChild(metaCharset);

  const metaViewport = document.createElement("meta");
  metaViewport.setAttribute("name", "viewport");
  metaViewport.setAttribute("content", "width=device-width, initial-scale=1");
  document.head.appendChild(metaViewport);
};

// Initialize DOM immediately after setup
initializeDOM();

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
    // Ensure we don't clear if document.body doesn't exist
    if (document && document.body) {
      document.body.innerHTML = "";
    }
    if (document && document.head) {
      // Keep styles that we've added
      document.head.querySelectorAll("style").forEach((style) => {
        if (!style.textContent?.includes(".test-environment")) {
          style.remove();
        }
      });
    }
  },

  // Re-initialize DOM structure (useful between tests)
  resetDOM: () => {
    // Check if DOM environment is ready before proceeding
    if (typeof document === "undefined" || !document.createElement) {
      console.warn("DOM environment not ready, skipping reset");
      return;
    }

    domUtils.clearDOM();
    initializeDOM();
  },

  // Wait for elements to be available
  waitForElement: (
    selector: string,
    timeout: number = 1000,
  ): Promise<Element | null> => {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        return resolve(element);
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  },
};
