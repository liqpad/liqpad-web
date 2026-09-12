import type {MetadataRoute} from 'next';
import {ADDRESSES,SITE_URL} from '@/lib/constants';
import {hasSupabase,supabaseBrowser} from '@/lib/supabase';

type SitemapRow={address:string;creator:string;block_timestamp:string|null};
export const revalidate=3600;

async function indexedLaunches(){
  if(!hasSupabase)return [] as SitemapRow[];
  const db=supabaseBrowser();if(!db)return [] as SitemapRow[];
  const query=db.from('tokens').select('address,creator,block_timestamp').eq('factory_address',ADDRESSES.factory.toLowerCase()).eq('is_legacy',false).order('block_number',{ascending:false}).limit(5000);
  const timeout=new Promise<null>(resolve=>setTimeout(()=>resolve(null),5000));
  const result=await Promise.race([query,timeout]);
  if(!result||result.error)return [] as SitemapRow[];
  return (result.data||[]) as SitemapRow[];
}

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const now=new Date();
  const staticPages=[
    {path:'',priority:1,changeFrequency:'hourly' as const},
    {path:'/launch',priority:.9,changeFrequency:'monthly' as const},
    {path:'/transparency',priority:.8,changeFrequency:'daily' as const},
    {path:'/docs',priority:.8,changeFrequency:'monthly' as const},
  ].map(page=>({url:`${SITE_URL}${page.path}`,lastModified:now,changeFrequency:page.changeFrequency,priority:page.priority}));
  try{
    const launches=await indexedLaunches();
    const tokenPages=launches.map(item=>({url:`${SITE_URL}/token/${item.address}`,lastModified:item.block_timestamp?new Date(item.block_timestamp):now,changeFrequency:'hourly' as const,priority:.8}));
    const creators=[...new Set(launches.map(item=>item.creator.toLowerCase()))].map(address=>({url:`${SITE_URL}/creator/${address}`,lastModified:now,changeFrequency:'daily' as const,priority:.6}));
    return [...staticPages,...tokenPages,...creators];
  }catch{return staticPages}
}
