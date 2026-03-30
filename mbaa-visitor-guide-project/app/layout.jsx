import "./globals.css";

export const metadata = {
  title: "Morro Bay Visitor Guide | MBAA",
  description:
    "Submit your business for the Art in the Park Visitor Guide. Produced by the Morro Bay Art Association.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
