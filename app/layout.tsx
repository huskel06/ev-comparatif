import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '600', '700', '800'],
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500'],
})

export const metadata: Metadata = {
  title: 'Mon Garage Électrique — Comparatif VE',
  description: 'Comparatif personnel véhicules électriques avec offres commerciales',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${syne.variable} ${dmSans.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  )
}
