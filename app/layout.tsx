import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import AIChatButton from '../components/AIChatButton'
import { GoogleAnalytics } from '@next/third-parties/google'
import { ThemeProvider } from '../contexts/ThemeContext'
import { LanguageProvider } from '../contexts/LanguageContext'
import { CountryProvider } from '../contexts/CountryContext'
import AnalyticsProvider from '../components/AnalyticsProvider'
import { SupabaseProvider } from '@/contexts/SupabaseContext'
import { Toaster } from 'react-hot-toast'

// Initialize Font Awesome
config.autoAddCss = false

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

// Script to prevent theme flash and handle initial theme
const themeScript = `
  (function() {
    document.documentElement.classList.add('js')
    var darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    function getThemePreference() {
      if(typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
        return localStorage.getItem('theme')
      }
      return darkQuery.matches ? 'dark' : 'light'
    }
    
    var theme = getThemePreference()
    
    if(theme === 'dark') {
      document.documentElement.classList.add('dark')
    }
  })()
`

// Script to handle initial language
const languageScript = `
  (function() {
    var lang = localStorage.getItem('language') || 'en'
    document.documentElement.setAttribute('lang', lang)
    if(lang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl')
    }
  })()
`

export const metadata = {
  title: 'Mawater974',
  description: 'Your premier destination for cars in Qatar',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: languageScript }} />
        <GoogleAnalytics gaId="G-VPPL3CMS1K" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <SupabaseProvider>
          <LanguageProvider>
            <ThemeProvider>
              <CountryProvider>
                <Providers>
                  <AnalyticsProvider>
                    <div className="flex flex-col min-h-screen">
                      <Navbar />
                      <main className="flex-grow">
                        {children}
                      </main>
                      <Footer />
                      <AIChatButton />
                      <Toaster position="bottom-center" />
                    </div>
                  </AnalyticsProvider>
                </Providers>
              </CountryProvider>
            </ThemeProvider>
          </LanguageProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
