import './globals.css'

export const metadata = {
  title: 'Agency Desk',
  description: 'Simple project management MVP built with Next.js and Supabase'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
