import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { SITE_URL } from '@/lib/constants';
import {GeistMono} from 'geist/font/mono';
import {DEFAULT_DESCRIPTION} from '@/lib/seo';
import {JsonLd} from '@/components/json-ld';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Liqpad — B20 launches on Base', template: '%s · Liqpad' },
  applicationName:'Liqpad',
  description:DEFAULT_DESCRIPTION,
  keywords:['Liqpad','B20','B20 launchpad','Base launchpad','VVV','Base tokens','Uniswap v4','crypto launchpad'],
  authors:[{name:'Liqpad',url:SITE_URL}],
  creator:'Liqpad',
  publisher:'Liqpad',
  category:'finance',
  alternates:{canonical:SITE_URL},
  formatDetection:{email:false,address:false,telephone:false},
  icons: { icon:'/icon.png', apple:'/icon.png' },
  manifest:'/manifest.webmanifest',
  openGraph: { url: SITE_URL, siteName: 'Liqpad', title:'Liqpad — B20 launches on Base',description:DEFAULT_DESCRIPTION,type: 'website',locale:'en_US', images:[{url:'/api/og/site',width:1200,height:630,alt:'Liqpad — B20 launches on Base'}] },
  twitter: { card: 'summary_large_image', site: '@liqpad',creator:'@liqpad',title:'Liqpad — B20 launches on Base',description:DEFAULT_DESCRIPTION,images:['/api/og/site'] },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const structuredData={'@context':'https://schema.org','@graph':[{'@type':'Organization','@id':`${SITE_URL}/#organization`,name:'Liqpad',url:SITE_URL,logo:`${SITE_URL}/logo.png`,sameAs:['https://x.com/liqpad']},{'@type':'WebSite','@id':`${SITE_URL}/#website`,url:SITE_URL,name:'Liqpad',description:DEFAULT_DESCRIPTION,publisher:{'@id':`${SITE_URL}/#organization`},inLanguage:'en'},{'@type':'WebApplication','@id':`${SITE_URL}/#app`,name:'Liqpad',url:SITE_URL,applicationCategory:'FinanceApplication',operatingSystem:'Web',description:DEFAULT_DESCRIPTION,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}}]};
  return <html lang="en" className={GeistMono.variable}><body className="font-sans"><JsonLd data={structuredData}/><Providers><Header/><main className="min-h-screen">{children}</main><Footer/></Providers></body></html>;
}
