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
import AnalyticsProvider from '../components/AnalyticsProvider'

// Initialize Font Awesome
config.autoAddCss = false

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

// Google Analytics Debug Script
const gaDebugScript = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-VPGL3CMS1K');

    window.addEventListener('load', function() {
        console.log('Checking GA status...');
        if (window.gtag) {
            console.log('Google Analytics is loaded and ready');
            window.gtag('event', 'test_event', {
                'event_category': 'test',
                'event_label': 'test'
            });
        } else {
            console.log('Google Analytics is not loaded');
        }
    });
`;

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
        <script dangerouslySetInnerHTML={{ __html: gaDebugScript }} />
        <GoogleAnalytics gaId="G-BB130CTM44" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <LanguageProvider>
          <ThemeProvider>
            <Providers>
              <AnalyticsProvider>
                <div className="flex flex-col min-h-screen">
                  <Navbar />
                  <main className="flex-grow">
                    {children}
                  </main>
                  <Footer />
                  <AIChatButton />
                </div>
              </AnalyticsProvider>
            </Providers>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
