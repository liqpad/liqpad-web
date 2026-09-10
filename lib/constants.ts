import { getAddress, isAddress, zeroAddress, type Address } from 'viem';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://liqpad.com';
export const CHAIN_ID = 8453 as const;
const configuredStartBlock=process.env.NEXT_PUBLIC_LIQPAD_FACTORY_START_BLOCK||'51050149';
if(!/^\d+$/.test(configuredStartBlock))throw new Error('Invalid NEXT_PUBLIC_LIQPAD_FACTORY_START_BLOCK');
export const FACTORY_START_BLOCK = BigInt(configuredStartBlock);
export const FEE_ROUTER_START_BLOCK = 51_050_150n;
export const POTPAL = '0xB20000000000000000000010238055932234F173' as Address;
export const LIQPAD_TOKEN = '0x06CF0C77cfE887F3e8fE632E533e182eEF78C865' as Address;

function configuredAddress(name: string, canonical: string): Address {
  const value = process.env[name] || canonical;
  if (!isAddress(value) || getAddress(value) === zeroAddress) throw new Error(`Invalid ${name}`);
  return getAddress(value);
}

if (process.env.NEXT_PUBLIC_CHAIN_ID && Number(process.env.NEXT_PUBLIC_CHAIN_ID) !== CHAIN_ID) {
  throw new Error('Liqpad Launcher v1 only supports Base mainnet (chain 8453).');
}

export const ADDRESSES = {
  factory: configuredAddress('NEXT_PUBLIC_LIQPAD_FACTORY_ADDRESS', process.env.NEXT_PUBLIC_LIQPAD_FACTORY_ADDRESS||'0x7e22764f1A1CBB8B60A5Ca1D3bAed720A48AA3D2'),
  hook: configuredAddress('NEXT_PUBLIC_LIQPAD_LAUNCH_HOOK_ADDRESS', process.env.NEXT_PUBLIC_LIQPAD_LAUNCH_HOOK_ADDRESS||'0x10F775c7F82e57577b47E6401DE31DFC9BADe0cC'),
  hookDeployer: configuredAddress('NEXT_PUBLIC_LIQPAD_HOOK_DEPLOYER_ADDRESS', process.env.NEXT_PUBLIC_LIQPAD_HOOK_DEPLOYER_ADDRESS||'0xfe8b9fb2bb60df282dce8ebb4f397b4b70c7f132'),
  feeRouter: configuredAddress('NEXT_PUBLIC_LIQPAD_FEE_ROUTER_ADDRESS', process.env.NEXT_PUBLIC_LIQPAD_FEE_ROUTER_ADDRESS||'0x1A1D815DbEADCc8cE783eD001f9733280F3E2e5e'),
  vault: configuredAddress('NEXT_PUBLIC_LIQPAD_LOCKED_VAULT_ADDRESS', process.env.NEXT_PUBLIC_LIQPAD_LOCKED_VAULT_ADDRESS||'0xAF8082B81Df88977B254342996cfe518F16477D6'),
  swapRouter: configuredAddress('NEXT_PUBLIC_LIQPAD_SWAP_ROUTER_ADDRESS', process.env.NEXT_PUBLIC_LIQPAD_SWAP_ROUTER_ADDRESS||'0xf5ea55a69307cf2cf598ccb0ea947ffdc52f985e'),
  diemEngine: configuredAddress('NEXT_PUBLIC_DIEM_ENGINE_ADDRESS', process.env.NEXT_PUBLIC_DIEM_ENGINE_ADDRESS||'0xd44BbD89d490B079ba546e192eb30CB1836F2958'),
  adapter: configuredAddress('NEXT_PUBLIC_VENICE_ADAPTER_ADDRESS', process.env.NEXT_PUBLIC_VENICE_ADAPTER_ADDRESS||'0xBEa3A03c4A76fADdBD77458525a4E36eAE64d746'),
  vvv: configuredAddress('NEXT_PUBLIC_VVV_ADDRESS', process.env.NEXT_PUBLIC_VVV_ADDRESS||'0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf'),
  svvv: '0x321b7ff75154472B18EDb199033fF4D116F340Ff', diem: '0xF4d97F2da56e8c3098f3a8D538DB630A2606a024',
  svvvImplementation: '0xe37A7920dbc11253ac6d031C29f592f71B348DCA',
  poolManager: '0x498581fF718922c3f8e6A244956aF099B2652b2b', positionManager: '0x7C5f5A4bBd8fD63184577525326123B519429bDc',
  permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3', b20Factory: '0xB20f000000000000000000000000000000000000',
  v4Quoter: '0x0d5e0f971ed27fbff6c2837bf31316121532048d', aerodromeRouter: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
  aerodromeFactory: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da', weth: '0x4200000000000000000000000000000000000006', usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const satisfies Record<string, Address>;

export const FACTORY_INDEXER_KEY = `factory_launches:v1:${ADDRESSES.factory.toLowerCase()}`;
export const PROTOCOL_INDEXER_KEY = `protocol_events:v1:${ADDRESSES.feeRouter.toLowerCase()}`;
export const SWAP_INDEXER_KEY = `swap_events:v1:${ADDRESSES.swapRouter.toLowerCase()}`;
export const SUPPLY = 1_000_000_000n;
export const TICK_SPACING = 200;
