import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Mail Delivery System',
  description: 'Secure temporary email service',
  generator: 'v0.dev',
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
        </AuthProvider>
      </body>
    </html>
  )
}
