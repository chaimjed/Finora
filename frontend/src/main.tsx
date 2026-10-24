
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import { LanguageProvider } from "./context/LanguageContext.tsx";
import "./index.css";
import { AppWrapper } from "./common/PageMeta.tsx";
import "./i18n";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});
createRoot(document.getElementById("root")!).render(
  <StrictMode>
      <LanguageProvider>
        <AppWrapper>
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
<QueryClientProvider client={queryClient}>

          <App />
          </QueryClientProvider>
         </GoogleOAuthProvider> 
        </AppWrapper>
      </LanguageProvider>
  </StrictMode>,
);
