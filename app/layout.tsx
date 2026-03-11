import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { WalletProvider } from '@/components/WalletProvider'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Typestamp',
  description: 'Create a timestamped, identity-bound typestamp on any text by recording it on the BSV blockchain.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark')})()`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-th-bg text-th-text`}>
        <WalletProvider>
          <Header />
          <main className="mx-auto max-w-5xl px-4 py-8">
            {children}
          </main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  )
}
