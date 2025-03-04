let __atomicGuard: Promise<void> | null = null;

function atomic(fn: () => Promise<void>) {
  __atomicGuard = __atomicGuard?.then(fn, fn) ?? fn();
}

export interface PreparedPage {
  document: Document;
  modules: string[];
  isReloadRequired: boolean;
}

const pageCache: Record<string, PreparedPage | Promise<PreparedPage>> = Object
  .create(null);

export function clearCache() {
  for (const k in pageCache) {
    delete pageCache[k];
  }
}

export function fetchDocument(url: string) {
  url = url.replace(/\/+(#|$)/, "$1");
  
  if (url in pageCache) return pageCache[url]!;

  const promise = new Promise<PreparedPage>((resolve, reject) => {
    // XHR のほうが fetch より HTML のパースにおいて高速に処理できる見込みがある
    const xhr = new XMLHttpRequest();
    xhr.responseType = "document";

    xhr.addEventListener("load", () => {
      if (xhr.responseXML) {
        const prepared = prepareDocument(url, xhr.responseXML);

        pageCache[url] = prepared;
        resolve(prepared);
      } else {
        reject();
      }
    });

    xhr.addEventListener("error", reject);

    xhr.open("GET", url, true);
    xhr.send();
  });

  pageCache[url] = promise;

  return promise;
}

export function prepareDocument(
  href: string,
  document: Document,
): PreparedPage {
  const modules: string[] = [];
  const preloads = document.createDocumentFragment();

  const addModule = (src: string) => {    
    const modulePath = new URL(src, href).href + "#";

    modules.push(modulePath);

    addPreload(modulePath);
  }
  
  const addPreload = (src: string) => {
    const path = new URL(src, href).href;
    const link = document.createElement("link");
    link.rel = "modulepreload";
    link.href = path;

    preloads.append(link);
  };

  const head = document.head;
  const nextHeadChildren = Array.from(head.childNodes);

  for (let i = 0; i < nextHeadChildren.length; i++) {
    const child = nextHeadChildren[i];

    if (child instanceof HTMLScriptElement) {
      // 'var pageDirectory = ".";var projectRoot = "."'
      const m = child.innerText.match(
        /^var pageDirectory = ([^;]+);var projectRoot = ([^;]+)$/,
      );

      if (m) {
        globalThis.pageDirectory = JSON.parse(m[1]);
        globalThis.projectRoot = JSON.parse(m[2]);
      } else if (child.id == "__DJM_PRELOADS__") {
        const content = JSON.parse(child.innerHTML);

        for (const path of content) {
          addPreload(path);
        }
      } else if (child.hasAttribute("src")) {
        addModule(child.src);
      }

      head.replaceChild(document.createComment("ignored"), child);
    } else if (child instanceof HTMLLinkElement) {
      if (child.getAttribute("onload") == "this.media='all'") {
        child.removeAttribute("onload");
        child.setAttribute("media", "all");
      }
    }
  }

  globalThis.document.head.append(preloads);

  return { document, modules, isReloadRequired: document.body.querySelector("script") != null };
}

function replaceNode(a: Node, b: Node) {
  return a.parentNode?.replaceChild(b.cloneNode(true), a);
}

const baseLocation = location.href;

function diffUpdate(a: Node, b: Node) {
  if (a instanceof Element && b instanceof Element) {
    if (
      a.tagName != b.tagName ||
      a.tagName == "NOSCRIPT" || b.tagName == "NOSCRIPT"
    ) {
      return replaceNode(a, b);
    }

    a.removeAttribute("onload");

    const aKey = a.getAttribute("x-key");
    const bKey = b.getAttribute("x-key");
    
    if (aKey && bKey) {
      if (aKey != bKey) {
        return replaceNode(a, b);
      } else {
        return;
      }
    }
    if (a.attributes.length != b.attributes.length) return replaceNode(a, b);

    for (let i = 0; i < b.attributes.length; i++) {
      const { name, value } = b.attributes[i];

      if (
        a.tagName != "A" && name == "href" && a.hasAttribute(name) &&
        "href" in a && "href" in b
      ) {
        const href = new URL(a.getAttribute(name)!, baseLocation).href;

        if (href != b.href) {
          a.setAttribute(name, b.href as string);
          a.href = b.href;
        }
      } else if (
        name == "src" && a.hasAttribute(name) &&
        "src" in a && "src" in b
      ) {
        const src = new URL(a.getAttribute(name)!, baseLocation).href;

        if (src != b.src) {
          a.setAttribute(name, b.src as string);
          a.src = b.src;
        }
      } else if (a.getAttribute(name) != value) {
        a.setAttribute(name, value);
      }
    }

    const aChildren = Array.from(a.childNodes);
    const bChildren = Array.from(b.childNodes);

    let i = 0;
    let isPhBlock = false;

    for (; i < aChildren.length && i < bChildren.length; i++) {
      if (aChildren[i] instanceof Comment) {
        if (aChildren[i].textContent?.startsWith("djm-ph")) {
          isPhBlock = true;
          continue;
        } else if (aChildren[i].textContent?.startsWith("/djm-ph")) {
          isPhBlock = false;
          continue;
        }
      }

      if (!isPhBlock) {
        diffUpdate(aChildren[i], bChildren[i]);
      }
    }

    if (i < aChildren.length) {
      for (const child of aChildren.slice(i)) {
        child.remove();
      }
    }

    if (i < bChildren.length) {
      a.append(...bChildren.slice(i).map((x) => x.cloneNode(true)));
    }
  } else if (a instanceof Text && b instanceof Text) {
    if (a.data != b.data) a.data = b.data;
  } else if (a instanceof Comment && b instanceof Comment) {
    if (a.data != b.data) a.data = b.data;
  } else {
    return replaceNode(a, b);
  }
}

type HookedListener = Parameters<typeof globalThis["addEventListener"]>;
const eventCache: Record<string, HookedListener[]> = {};

function useGlobalThisEventHook(href: string) {
  const isCached = eventCache[href] != null;
  const listeners: HookedListener[] = eventCache[href] ??= [];
  if (isCached) return () => [isCached, listeners] as const;

  const previous = globalThis.addEventListener;

  globalThis.addEventListener = function (
    ...args: Parameters<typeof globalThis["addEventListener"]>
  ) {
    listeners.push(args);
    return previous.call(this, ...args);
  };

  return () => {
    globalThis.addEventListener = previous;

    return [isCached, listeners] as const;
  };
}

export async function move(href: string, pushState = true) {
  const { document: nextDocument, modules, isReloadRequired } = await fetchDocument(href);

  if (isReloadRequired) {
    location.href = href;
    return;
  }

  const url = new URL(href);
  const getListeners = useGlobalThisEventHook(url.pathname);

  const modulePromises = modules.map((x) => import(x));

  diffUpdate(document.head, nextDocument.head);
  diffUpdate(document.body, nextDocument.body);

  await Promise.all(modulePromises);

  const [isCached, listeners] = getListeners();

  if (isCached) {
    for (const args of listeners) {
      globalThis.addEventListener(...args);
    }
  }

  if (pushState) {
    history.pushState(null, "", href);
  } else {
    history.replaceState(null, "", href);
  }

  return new Promise<void>((resolve) => {
    const controller = new AbortController();

    controller.signal.addEventListener("abort", () => resolve());

    setTimeout(() => controller.abort(), 500);

    globalThis.addEventListener("load", () => {
      controller.abort();
    }, controller);

    globalThis.dispatchEvent(new Event("load"));
  });
}

const baseOrigin = location.origin;

let isAdapted = false;
export function adaptRouter() {
  if (isAdapted) return;

  let controller = new AbortController();

  isAdapted = true;

  globalThis.addEventListener("popstate", () => {
    if (location.origin == baseOrigin) {
      atomic(() => move(location.href, false));
    }
  });

  function handlePreFetch(this: HTMLAnchorElement) {
    const url = new URL(this.href, location.href);
    if (url.origin == location.origin) {
      fetchDocument(url.href);
    }
  }

  function handleMove(this: HTMLAnchorElement, ev: Event) {
    const url = new URL(this.href, location.href);
    if (url.origin == location.origin) {
      ev.preventDefault();
      atomic(() => move(url.href, location.href != url.href));
    }
  }

  function listen() {
    controller.abort();
    controller = new AbortController();

    for (const a of Array.from(document.querySelectorAll("a"))) {
      a.addEventListener("pointerover", handlePreFetch.bind(a), controller);
      a.addEventListener("click", handleMove.bind(a), controller);
    }
  }

  globalThis.addEventListener("load", () => listen());

  listen();
}
