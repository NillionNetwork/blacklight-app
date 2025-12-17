import type { Metadata } from "next";
import { Toaster } from 'sonner';
import { Providers } from './providers';
import { LayoutWrapper } from '@/components/layout';
import "./globals.css";

export const metadata: Metadata = {
  title: "nilUV Dashboard",
  description: "Set up and manage your Nillion universal verifier nodes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/nillion.css" />
      </head>
      <body>
        <Providers>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </Providers>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#1a1a6e',
              border: '1px solid #4746a7',
              color: 'white',
            },
          }}
        />
      </body>
    </html>
  );
}
