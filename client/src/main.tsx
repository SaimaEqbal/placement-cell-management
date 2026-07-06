import { createRoot } from "react-dom/client";

import App from "./App";
/** index.css is the single style entry: Tailwind + the black/white theme tokens,
 *  with the legacy monolith and shared-state CSS pulled in under a lower cascade
 *  layer so not-yet-migrated pages keep their original look. */
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
