import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import { AnnouncementPopup } from '@/components/announcement-popup'

export const metadata: Metadata = {
  title: 'Mail Delivery System',
  description: 'Secure temporary email service',
  generator: 'v0.dev',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster />
          <AnnouncementPopup />
        </AuthProvider>
      </body>
    </html>
  )
}
