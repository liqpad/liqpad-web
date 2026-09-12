import type {Metadata} from 'next';
import {LaunchWizard} from '@/components/launch-wizard';
import {pageMetadata} from '@/lib/seo';

export const metadata:Metadata=pageMetadata({title:'Launch a B20 Token',description:'Create a B20 token on Base with a VVV market, locked Uniswap v4 liquidity, IPFS metadata, and a branded 0xb07 address.',path:'/launch'});
export default function Page(){return <LaunchWizard/>}
