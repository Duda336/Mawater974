import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import AIChatButton from '../components/AIChatButton'
import { ThemeProvider } from '../contexts/ThemeContext'
import { LanguageProvider } from '../contexts/LanguageContext'

// Initialize Font Awesome
config.autoAddCss = false

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata = {
  title: 'Mawater974',
  description: 'Your destination for Premium cars in Qatar.',
}

// Script to prevent theme flash and handle initial theme
const themeScript = `
  (function() {
    try {
      const savedTheme = localStorage.getItem('theme');
      const initialTheme = savedTheme || 'dark';
      document.documentElement.classList.add(initialTheme);
    } catch (e) {}
  })()
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <LanguageProvider>
            <Providers>
              <Navbar />
              <main className="min-h-screen">
                {children}
              </main>
              <Footer />
              <AIChatButton />
            </Providers>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
