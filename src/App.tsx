import { RouterProvider } from "react-router-dom";
import { appRouter } from "@/router/appRouter";
import { ThemeProvider } from "./components/theme-provider";
import { QueryProvider } from "./providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import "./index.css";
import "./App.css";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryProvider>
        <RouterProvider router={appRouter} />
        <Toaster />
      </QueryProvider>
    </ThemeProvider>
  );
}

export default App;
