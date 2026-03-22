import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "KrishiMane — Pure Natural Oils & Farm Products",
  description:
    "KrishiMane offers premium cold-pressed natural oils — Safflower, Sunflower, Groundnut & Coconut — sourced directly from Indian farms. Healthy, pure, and traditionally crafted.",
  keywords: [
    "natural oils",
    "cold pressed oil",
    "safflower oil",
    "sunflower oil",
    "groundnut oil",
    "coconut oil",
    "organic farm products",
    "KrishiMane",
  ],
  openGraph: {
    title: "KrishiMane — Pure Natural Oils",
    description:
      "Premium cold-pressed oils sourced directly from Indian farms.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
