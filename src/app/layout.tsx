import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LegaliQ - AI-Powered Legal Assistant | Get Instant Legal Advice",
  description: "Get instant legal guidance, generate professional documents, and connect with affordable legal professionals. No more expensive lawyers or complex legal jargon.",
  keywords: "legal advice, AI legal assistant, legal documents, legal consultation, consumer rights, tenant rights, employment law",
  authors: [{ name: "LegaliQ Team" }],
  openGraph: {
    title: "LegaliQ - AI-Powered Legal Assistant",
    description: "Get instant legal guidance and professional document generation",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
