import "./globals.css";

export const metadata = {
  title: "股票数据分析",
  description: "股票数据分析",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
