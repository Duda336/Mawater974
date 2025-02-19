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

// Script to handle initial language direction
const languageScript = `
  (function() {
    try {
      const savedLanguage = localStorage.getItem('language');
      const initialLanguage = savedLanguage || 'en';
      document.documentElement.lang = initialLanguage;
      document.documentElement.dir = initialLanguage === 'ar' ? 'rtl' : 'ltr';
    } catch (e) {}
  })()
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: languageScript }} />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <LanguageProvider>
            <Providers>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
                <AIChatButton />
              </div>
            </Providers>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
