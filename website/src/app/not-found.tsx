import NotFoundReport from "../components/NotFoundReport";

/**
 * Static-export 404 (emitted as 404.html). The fun lives in the client
 * component - it diffs the visitor's actual URL against the sitemap and
 * fails every gate.
 */
export default function NotFound() {
  return <NotFoundReport />;
}
