import { Link } from "react-router-dom";

/**
 * Shown at the bottom of every page. Canonical copy lives in
 * shared-ui/react/DemoDisclaimer.tsx - see shared-ui/README.md before editing
 * this file directly, since it's duplicated (not imported) across every app.
 */
export default function DemoDisclaimer() {
  return (
    <footer className="demo-disclaimer">
      <span>⚠️ This is a demo application with fake data - not for production use.</span>{" "}
      <Link to="/about-demo">Why?</Link>
    </footer>
  );
}
