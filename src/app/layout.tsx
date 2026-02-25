import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web3 小白问答 MVP",
  description: "面向 Web3 初学者的学习型问答助手（RAG）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-dvh bg-zinc-950 text-zinc-50 antialiased">
        {children}
      </body>
    </html>
  );
}
