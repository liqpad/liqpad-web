import 'server-only';
import { getAddress, parseEventLogs, type Address, type Hex } from 'viem';
import { publicClient } from '@/lib/data';
import { ADDRESSES } from '@/lib/constants';
import { supabaseAdmin } from '@/lib/supabase';
import { factoryAbi } from '@/src/abi/factory';

type LaunchLog = {
  address: Address;
  blockNumber: bigint;
  transactionHash: Hex;
  args: { token: Address; creator: Address; poolId: Hex; profileHash: Hex };
};
type QuoteLog={args:{token:Address;quotedFrame:number;validUntil:bigint;quoteDigest:Hex}};

export async function launchRowFromLog(log: LaunchLog,quote?:QuoteLog) {
  const profile = await publicClient.readContract({
    address:ADDRESSES.factory, abi:factoryAbi, functionName:'getProfile', args:[log.args.token],
  });
  const block = await publicClient.getBlock({ blockNumber:log.blockNumber });

  return {
    address:getAddress(log.args.token), factory_address:ADDRESSES.factory.toLowerCase(), creator:getAddress(profile.creator), pool_id:profile.poolId,
    profile_hash:log.args.profileHash, block_number:log.blockNumber.toString(),
    block_timestamp:new Date(Number(block.timestamp) * 1000).toISOString(), tx_hash:log.transactionHash,
    name:profile.name, symbol:profile.symbol, image:profile.logoURI, description:profile.description,
    website:profile.website, twitter:profile.socials.twitter, telegram:profile.socials.telegram,
    farcaster:profile.socials.farcaster, discord:profile.socials.discord,
    contract_uri:profile.contractURI, quote_frame:quote?.args.quotedFrame??null,
    quote_valid_until:quote?new Date(Number(quote.args.validUntil)*1000).toISOString():null,
    quote_digest:quote?.args.quoteDigest??null, launch_version:'v1', is_legacy:false,
    updated_at:new Date().toISOString(),
  };
}

export async function upsertLaunchLog(log: LaunchLog,quote?:QuoteLog) {
  const db = supabaseAdmin();
  if (!db) throw new Error('Supabase service role is not configured.');
  const row = await launchRowFromLog(log,quote);
  const { error } = await db.from('tokens').upsert(row, { onConflict:'address' });
  if (error) throw new Error(error.message);
  return row;
}

export async function confirmLaunchTransaction(hash: Hex,expectedToken?:Address) {
  const receipt = await publicClient.getTransactionReceipt({ hash });
  if (receipt.status !== 'success') throw new Error('Launch transaction was not successful.');

  const transaction = await publicClient.getTransaction({ hash });
  if (!transaction.to || getAddress(transaction.to) !== getAddress(ADDRESSES.factory)) {
    throw new Error('Transaction was not sent to Liqpad Launcher v1 Factory.');
  }

  const logs = parseEventLogs({ abi:factoryAbi, eventName:'Launch', logs:receipt.logs, strict:true })
    .filter(log => getAddress(log.address) === getAddress(ADDRESSES.factory));
  const launch = logs[0];
  if (!launch || launch.blockNumber === null || launch.transactionHash === null) {
    throw new Error('Verified Factory Launch event was not found.');
  }

  if(expectedToken&&getAddress(launch.args.token)!==getAddress(expectedToken))throw new Error('Created token does not match the predicted address.');
  const quoteLogs=parseEventLogs({abi:factoryAbi,eventName:'LaunchQuoteUsed',logs:receipt.logs,strict:true}).filter(log=>getAddress(log.address)===getAddress(ADDRESSES.factory));
  return upsertLaunchLog(launch as LaunchLog,quoteLogs[0] as QuoteLog|undefined);
}
