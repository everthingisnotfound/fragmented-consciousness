import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Launcher from "./pages/Launcher";
import WindowBody from "./pages/WindowBody";
import WindowVision from "./pages/WindowVision";
import WindowMemory from "./pages/WindowMemory";
import WindowTouch from "./pages/WindowTouch";
import WindowHearing from "./pages/WindowHearing";
import WindowEmotion from "./pages/WindowEmotion";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Launcher} />
      <Route path="/window/body" component={WindowBody} />
      <Route path="/window/vision" component={WindowVision} />
      <Route path="/window/memory" component={WindowMemory} />
      <Route path="/window/touch" component={WindowTouch} />
      <Route path="/window/hearing" component={WindowHearing} />
      <Route path="/window/emotion" component={WindowEmotion} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
