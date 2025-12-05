import type { Metadata } from "next";
import Header from "../components/header";
import Footer from "../components/footer";
import "./globals.css"; // Ensure CSS is imported here

export const metadata: Metadata = {
  title: "Synagogue For Jesus",
  description: "Charity Organization",
};

export function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="website-wrapper">
      <Header />
      
      <main className="min-h-screen">
         {children}
      </main>
      
      {/* No props needed anymore! */}
      <Footer />
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}