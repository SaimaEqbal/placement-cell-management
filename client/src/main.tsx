import { createRoot } from "react-dom/client";

import App from "./App";
import "./styles.css";
/** states.css styles the shared LoadingState/ErrorState/EmptyState components (src/components/ui.tsx). Imported once here so the styling applies app-wide. */
import "./styles/states.css";

createRoot(document.getElementById("root")!).render(<App />);
