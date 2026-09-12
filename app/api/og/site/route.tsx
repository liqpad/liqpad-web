/* eslint-disable @next/next/no-img-element */
import {ImageResponse} from 'next/og';
import {SITE_URL} from '@/lib/constants';

export const runtime='edge';

export function GET(){return new ImageResponse(
  <div style={{width:'100%',height:'100%',display:'flex',position:'relative',overflow:'hidden',padding:'68px 76px',color:'white',background:'#080712',fontFamily:'monospace'}}>
    <div style={{position:'absolute',width:520,height:520,borderRadius:999,background:'rgba(64,232,255,.18)',filter:'blur(60px)',right:-130,top:-220}}/>
    <div style={{position:'absolute',width:460,height:460,borderRadius:999,background:'rgba(255,58,167,.16)',filter:'blur(55px)',left:-180,bottom:-260}}/>
    <div style={{display:'flex',width:'100%',flexDirection:'column',justifyContent:'space-between'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><div style={{display:'flex',alignItems:'center'}}><img src={`${SITE_URL}/logo.png`} width="74" height="74" alt="" style={{width:74,height:74,objectFit:'contain',marginRight:22}}/><span style={{fontSize:35,fontWeight:800,letterSpacing:3}}>LIQPAD</span><span style={{marginLeft:18,padding:'7px 14px',border:'1px solid rgba(64,232,255,.5)',borderRadius:999,color:'#40e8ff',fontSize:16}}>BETA</span></div><span style={{fontSize:22,color:'#aca4bc'}}>BASE · B20 × VVV</span></div>
      <div style={{display:'flex',flexDirection:'column',maxWidth:980}}><span style={{fontSize:70,fontWeight:900,lineHeight:1.05}}>Launch into the liquid night.</span><span style={{marginTop:25,fontSize:27,lineHeight:1.45,color:'#c9c3d4'}}>Create and trade B20 tokens with locked Uniswap v4 liquidity and transparent fee flows.</span></div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:20}}><span style={{color:'#40e8ff'}}>liqpad.com</span><span style={{color:'#aca4bc'}}>1% fee · B20 burned · 70% creator / 30% protocol</span></div>
    </div>
  </div>,{width:1200,height:630,headers:{'Cache-Control':'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'}}
)}
