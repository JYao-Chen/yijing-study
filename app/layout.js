// 页面本身是 build/standalone.html，由 app/route.js 直接返回；这里只为满足 App Router 的根布局要求。
export const metadata = { title: '易经六阶' };
export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
