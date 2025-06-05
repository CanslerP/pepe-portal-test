import type { Metadata } from 'next'
import './globals.css'
import Navbar from './components/Navbar'
import Web3Provider from './providers/Web3Provider'
import WalletGate from './components/WalletGate'
import SchedulerInit from './components/SchedulerInit'
import MusicPlayer from './components/MusicPlayer'

export const metadata: Metadata = {
  title: 'Pepe Portal 2000 🐸',
  description: 'Ultimate Pepe Community Portal - Where Frogs Unite!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <WalletGate>
            <div className="min-h-screen">
              <Navbar />
              <main className="main-content px-6 pb-12">
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </WalletGate>
          <SchedulerInit />
          <MusicPlayer />
        </Web3Provider>
      </body>
    </html>
  )
} 