export type SocialKind='website'|'x'|'telegram'|'farcaster'|'discord';

const allowedHosts:Record<Exclude<SocialKind,'website'>,string[]>={
  x:['x.com','www.x.com','twitter.com','www.twitter.com'],
  telegram:['t.me','telegram.me','www.telegram.me'],
  farcaster:['warpcast.com','www.warpcast.com','farcaster.xyz','www.farcaster.xyz'],
  discord:['discord.gg','www.discord.gg','discord.com','www.discord.com'],
};

export function normalizeSocialUrl(kind:SocialKind,input:string){
  const value=input.trim();if(!value)return null;
  if(/^[a-z][a-z0-9+.-]*:/i.test(value)&&!/^https?:/i.test(value))return null;
  let candidate=value;
  if(kind==='x'&&!value.includes('.')&&!value.includes('/'))candidate=`https://x.com/${value.replace(/^@/,'')}`;
  else if(kind==='telegram'&&!value.includes('.')&&!value.includes('/'))candidate=`https://t.me/${value.replace(/^@/,'')}`;
  else if(kind==='farcaster'&&!value.includes('.')&&!value.includes('/'))candidate=`https://warpcast.com/${value.replace(/^@/,'')}`;
  else if(kind==='discord'&&!value.includes('.')&&!value.includes('/'))candidate=`https://discord.gg/${value}`;
  else if(!/^https?:\/\//i.test(value))candidate=`https://${value}`;
  try{
    const url=new URL(candidate);if(url.protocol!=='https:'&&url.protocol!=='http:')return null;
    if(kind!=='website'&&!allowedHosts[kind].includes(url.hostname.toLowerCase()))return null;
    return url.toString();
  }catch{return null}
}
