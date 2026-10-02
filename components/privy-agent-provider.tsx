'use client';
import {PrivyProvider} from '@privy-io/react-auth';
import {base} from 'viem/chains';

export function PrivyAgentProvider({children}:{children:React.ReactNode}){
  const appId=process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if(!appId)return children;
  return <PrivyProvider appId={appId} config={{
    defaultChain:base,
    supportedChains:[base],
    // External wallets are connected once through wagmi/WalletConnect. Keeping
    // them out of Privy login prevents a second WalletConnect Core instance.
    loginMethods:['email','google','twitter'],
    appearance:{theme:'dark',accentColor:'#40e8ff',logo:'https://liqpad.com/logo.png'},
    embeddedWallets:{ethereum:{createOnLogin:'users-without-wallets'}},
  }}>{children}</PrivyProvider>;
}
