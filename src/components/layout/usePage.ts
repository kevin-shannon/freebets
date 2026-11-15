import { useEffect, useRef, useState } from "react";
import { pageFromHash } from "../../navigation";

export default function usePage() {
  const [hash, setHash] = useState(() => window.location.hash);
  const page = pageFromHash(hash);
  const previousPage = useRef(page);
  useEffect(() => {
    const update = () => setHash(window.location.hash);
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    document.title = page === "home" ? "Freebets" : `${page.charAt(0).toUpperCase() + page.slice(1)} · Freebets`;
    if (previousPage.current !== page) {
      window.scrollTo(0, 0);
      document.getElementById("main")?.focus({ preventScroll: true });
      previousPage.current = page;
    }
    const section = new URLSearchParams(hash.split("?")[1]).get("section");
    if (page === "learn" && section) document.getElementById(`learn-${section}`)?.scrollIntoView();
  }, [page, hash]);
  return page;
}
