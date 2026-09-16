import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Learn&Learn — Cohort Learning Platform",
  description: "Cohort-based courses with live classes and hands-on practice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.style.colorScheme=t;}catch(e){}})();`,
        }}
      />
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-black">
        <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <nav
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
            aria-label="Main"
          >
            <Link
              href="/"
              className="text-xl font-bold text-zinc-900 dark:text-zinc-100"
            >
              Learn&amp;Learn
            </Link>
            <div className="flex items-center gap-5">
              <Link
                href="/"
                className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
              >
                Home
              </Link>
              <Link
                href="/catalog"
                className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
              >
                Catalog
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium px-4 py-2 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90"
              >
                Login
              </Link>
              <ThemeToggle />
            </div>
          </nav>
        </header>
        <div className="flex-1 flex flex-col">{children}</div>
        <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 text-center text-sm text-zinc-500">
          Learn&amp;Learn — cohort learning platform
        </footer>
      </body>
    </html>
  );
}
