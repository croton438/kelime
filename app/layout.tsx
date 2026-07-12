import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Kelime Oyunu", description: "Gerçek zamanlı Türkçe kelime yarışması" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
