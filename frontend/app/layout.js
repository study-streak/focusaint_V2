import './globals.css'

export const metadata = {
  title: 'Focusaint — Learn, Don\'t Just Watch',
  description: 'The structured learning system that replaces passive watching with proven active recall.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Outfit:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[var(--black)] text-[var(--white)] transition-colors duration-300" suppressHydrationWarning>{children}</body>
    </html>
  )
}
