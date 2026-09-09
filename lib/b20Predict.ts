import {getAddress,keccak256,type Address,type Hex} from 'viem';

// Base B20 ASSET layout: 11-byte 0xB2/ASSET prefix + first 9 digest bytes.
// LiqpadFactory is the deployer; the connected wallet is never part of prediction.
export function predictB20AssetAddress(salt:Hex,deployer:Address):Address{
  return getAddress(predictB20AssetAddressUnchecked(salt,deployer));
}

// Avoid checksum hashing and general-purpose ABI encoding inside the hot worker loop.
export function predictB20AssetAddressUnchecked(salt:Hex,deployer:Address):`0x${string}`{
  const encoded=`0x${deployer.slice(2).toLowerCase().padStart(64,'0')}${salt.slice(2)}` as Hex;
  const digest=keccak256(encoded);
  return `0xb200000000000000000000${digest.slice(2,20)}`;
}
