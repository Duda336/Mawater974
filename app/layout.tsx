import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import AIChatButton from '../components/AIChatButton'

// Initialize Font Awesome
config.autoAddCss = false

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'Mawater974',
  description: 'Your premium destination for luxury cars in Qatar.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-gray-50 dark:bg-gray-900">
        <Providers>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <AIChatButton />
        </Providers>
      </body>
    </html>
  )
}
