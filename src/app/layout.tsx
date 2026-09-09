import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "HSC Question Bank",
  description: "A shared bank of hard HSC questions, organised by subject and module.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f5f7fa] text-[#202631]">
        <NavBar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
