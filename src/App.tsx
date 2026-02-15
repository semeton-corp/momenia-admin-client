import { RouterProvider } from "react-router-dom";
import { appRouter } from "@/router/appRouter";
import { ThemeProvider } from "./components/theme-provider";
import "./index.css";
import "./App.css";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <RouterProvider router={appRouter} />;
    </ThemeProvider>
  );
}

export default App;
