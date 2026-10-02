import 'server-only';
import {PrivyClient} from '@privy-io/node';

let client:PrivyClient|undefined;

export function privyServer(){
  const appId=process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret=process.env.PRIVY_APP_SECRET;
  if(!appId||!appSecret)throw new Error('Privy server credentials are not configured.');
  return client??=new PrivyClient({appId,appSecret});
}

export async function requirePrivyUser(req:Request){
  const header=req.headers.get('authorization');
  if(!header?.startsWith('Bearer '))throw new Error('UNAUTHORIZED');
  const token=header.slice(7).trim();
  if(!token)throw new Error('UNAUTHORIZED');
  try{return await privyServer().utils().auth().verifyAccessToken(token)}catch{throw new Error('UNAUTHORIZED')}
}
