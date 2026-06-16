"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export const NAVIGATION_START_EVENT = "furax:navigation-start";

export function startNavigationProgress() {
  window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
}

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function shouldStartNavigation(anchor: HTMLAnchorElement, pathname: string) {
  const href = anchor.getAttribute("href");

  if (!href || href.startsWith("#") || href.startsWith("mailto:")) {
    return false;
  }

  if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return false;
  }

  if (href.startsWith("http://") || href.startsWith("https://")) {
    return false;
  }

  const nextUrl = new URL(href, window.location.origin);

  if (nextUrl.origin !== window.location.origin) {
    return false;
  }

  return (
    nextUrl.pathname !== pathname || nextUrl.search !== window.location.search
  );
}

export function NavigationProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    const handleNavigationStart = () => {
      setIsNavigating(true);
    };

    window.addEventListener(NAVIGATION_START_EVENT, handleNavigationStart);

    return () => {
      window.removeEventListener(NAVIGATION_START_EVENT, handleNavigationStart);
    };
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedClick(event)) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest("a");

      if (!anchor || !shouldStartNavigation(anchor, pathnameRef.current)) {
        return;
      }

      setIsNavigating(true);
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  if (!isNavigating) {
    return null;
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-primary/15"
    >
      <div className="navigation-progress-bar h-full w-1/3 bg-primary" />
    </div>
  );
}
