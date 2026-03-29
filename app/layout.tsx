import type { Metadata } from "next";
import { Cinzel } from "next/font/google";
import Header from "@/components/layout/Header";
import FloatingAddButton from "@/components/layout/FloatingAddButton";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cinzel",
});

export const metadata: Metadata = {
  title: "CairoCore - Discover Cairo's Hidden Gems",
  description: "A platform for discovering and sharing historical places, museums, hidden gems, and famous spots in Cairo, Egypt.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cinzel.variable}>
      <body className="flex flex-col min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#e8ddd4] to-[#d4c4b0]">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <FloatingAddButton />
        </AuthProvider>
      </body>
    </html>
  );
}
