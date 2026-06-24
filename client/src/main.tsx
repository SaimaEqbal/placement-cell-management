import { createRoot } from "react-dom/client";

import App from "./App";
import "./styles.css";
/* states.css styles the shared LoadingState/ErrorState/EmptyState components (src/components/ui.tsx). It was previously never imported anywhere, so those components rendered unstyled (icon/title/description ran together inline) on every page that used them - e.g. the "No placement drives yet" empty state. Imported once here so the styling applies app-wide. */
import "./styles/states.css";

createRoot(document.getElementById("root")!).render(<App />);
