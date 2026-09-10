import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { SITE_URL } from '@/lib/constants';
import {GeistMono} from 'geist/font/mono';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Liqpad — B20 launches on Base', template: '%s · Liqpad' },
  description: 'Launch and trade B20 tokens against VVV with locked liquidity.',
  icons: { icon:'/icon.png', apple:'/icon.png' },
  openGraph: { url: SITE_URL, siteName: 'Liqpad', type: 'website', images:[{url:'/og-image.jpg',width:1248,height:832,alt:'Liqpad — Liquid Launchpad'}] },
  twitter: { card: 'summary_large_image', site: 'https://liqpad.com', images:['/og-image.jpg'] },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={GeistMono.variable}><body className="font-sans"><Providers><Header/><main className="min-h-screen">{children}</main><Footer/></Providers></body></html>;
}
