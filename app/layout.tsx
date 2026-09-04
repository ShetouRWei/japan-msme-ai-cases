import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://japan-msme-ai-cases.sweet-iris-5365.chatgpt.site"),
  title: "日本中小微企業 AI 應用案例庫",
  description: "日本中小微製造業的 AI 導入方式、成果與政府補助案例。",
  icons: { icon: "/favicon.svg" },
  openGraph: { title: "日本中小微企業 AI 應用案例庫", description: "21 個日本中小微製造業 AI 導入案例，附成果、補助資訊與查證來源。", type: "website", images: [{ url: "/og.png", width: 1536, height: 1024, alt: "日本中小微企業 AI 應用案例庫" }] },
  twitter: { card: "summary_large_image", title: "日本中小微企業 AI 應用案例庫", description: "21 個日本中小微製造業 AI 導入案例。", images: ["/og.png"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant"><body>{children}</body></html>
  );
}
