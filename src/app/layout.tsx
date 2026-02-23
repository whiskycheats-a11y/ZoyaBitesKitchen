import type { Metadata } from "next";
import { Inter, Playfair_Display, Montserrat } from "next/font/google";
import "@/index.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export const metadata: Metadata = {
    title: "ZoyaBites - Authentic Traditional Flavors",
    description: "Experience the finest traditional dishes with ZoyaBites. Order now for a taste of tradition, passion, and quality.",
    keywords: ["ZoyaBites", "Traditional Food", "Indian Cuisine", "Food Delivery", "Lucknow Food"],
    authors: [{ name: "ZoyaBites Team" }],
    openGraph: {
        title: "ZoyaBites - Authentic Traditional Flavors",
        description: "Experience the finest traditional dishes with ZoyaBites.",
        url: "https://zoyabites.com",
        siteName: "ZoyaBites",
        locale: "en_US",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${inter.variable} ${playfair.variable} ${montserrat.variable}`}>
            <body className="antialiased font-sans">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
