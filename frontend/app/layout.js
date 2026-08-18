import { Caveat, Patrick_Hand } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { WaitlistProvider } from "../context/WaitlistContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./globals.css";

const caveat = Caveat({
  weight: "600",
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const patrickHand = Patrick_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-patrick",
  display: "swap",
});

export const metadata = {
  title: "QAHWA SUPPLY",
  description: "Yemeni-lineage coffee, roasted weekly",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${caveat.variable} ${patrickHand.variable}`}
    >
      <body>
        <AuthProvider>
          <WishlistProvider>
            <WaitlistProvider>
              <CartProvider>
                <Header />
                {children}
                <Footer />
              </CartProvider>
            </WaitlistProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
