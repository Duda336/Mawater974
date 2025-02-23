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

// Initialize Font Awesome
config.autoAddCss = false

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

// Hotjar Tracking Code
const hotjarScript = `
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:5314941,hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
`;

export const metadata = {
  title: 'Mawater974',
  description: 'Your premier destination for cars in Qatar',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: languageScript }} />
        <script dangerouslySetInnerHTML={{ __html: hotjarScript }} />
      </head>
      <body className={`${inter.className} antialiased`}>
        <LanguageProvider>
          <ThemeProvider>
            <Providers>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
                <AIChatButton />
                <GoogleAnalytics gaId="G-W1GHWG1R13" />
              </div>
            </Providers>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
