import { createRoot } from "react-dom/client";
import { Suspense } from "react";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <Suspense fallback={null}>
    <App />
  </Suspense>
);
