import "~/styles/globals.css";

import { Roboto } from "next/font/google";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";

import { theme } from "~/styles/theme";
import { TRPCReactProvider } from "~/trpc/react";
import ToastProvider from "~/client/providers/ToastProvider";

const roboto = Roboto({
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata = {
  title: "Consultorios",
  description: "Gestion de Consultorios",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`font-sans ${roboto.className}`}>
      <body>
        <TRPCReactProvider>
          <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <ThemeProvider theme={theme}>
              <ToastProvider>
                {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon.
                (tailwind preflight is false) */}
                <CssBaseline />
                {children}
              </ToastProvider>
            </ThemeProvider>
          </AppRouterCacheProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
