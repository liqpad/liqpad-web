import type {MetadataRoute} from 'next';

export default function manifest():MetadataRoute.Manifest{return {
  name:'Liqpad — B20 Launchpad on Base',short_name:'Liqpad',description:'Launch and trade B20 tokens against VVV with locked liquidity on Base.',start_url:'/',display:'standalone',background_color:'#090812',theme_color:'#090812',orientation:'portrait-primary',categories:['finance','web3'],icons:[{src:'/icon.png',sizes:'1024x1024',type:'image/png'},{src:'/icon.svg',sizes:'any',type:'image/svg+xml'}],
}}
