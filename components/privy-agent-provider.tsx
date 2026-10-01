'use client';
import {PrivyProvider} from '@privy-io/react-auth';
import {base} from 'viem/chains';

export function PrivyAgentProvider({children}:{children:React.ReactNode}){
  const appId=process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if(!appId)return children;
  return <PrivyProvider appId={appId} clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID} config={{
    defaultChain:base,
    supportedChains:[base],
    loginMethods:['email','wallet','google','twitter'],
    appearance:{theme:'dark',accentColor:'#40e8ff',logo:'https://liqpad.com/logo.png'},
    embeddedWallets:{ethereum:{createOnLogin:'users-without-wallets'}},
  }}>{children}</PrivyProvider>;
}
