import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {formatBps,formatToken,reserveMismatch,subtractFloor,sumField,tokenContributions,usdFromWei,type ProtocolEventRow} from '../lib/transparency';
import {ADDRESSES,FEE_ROUTER_START_BLOCK} from '../lib/constants';
import {parseGeckoTerminalPrice} from '../lib/diem-price';

const fee=(id:string,token:string,creatorAmount:string,platformAmount:string):ProtocolEventRow=>({id,event_name:'FeeAccrued',contract_address:ADDRESSES.feeRouter,token,creator:'0x0000000000000000000000000000000000000001',amount_vvv:platformAmount,amount_diem:null,data:{creatorAmount,platformAmount},tx_hash:`0x${id.padStart(64,'0')}`,log_index:Number(id),block_number:'51050160',block_timestamp:null});

describe('protocol transparency calculations',()=>{
  it('uses canonical production contracts and deployment boundary',()=>{assert.equal(ADDRESSES.feeRouter.toLowerCase(),'0x1a1d815dbeadcc8ce783ed001f9733280f3e2e5e');assert.equal(ADDRESSES.diemEngine.toLowerCase(),'0xd44bbd89d490b079ba546e192eb30cb1836f2958');assert.equal(FEE_ROUTER_START_BLOCK,51050150n)});
  it('formats bigint balances and basis points safely',()=>{assert.equal(formatBps(500n),'5%');assert.equal(formatBps(9950n),'99.5%');assert.equal(formatToken(1_000_000_000_000_000_000n),'1');assert.equal(formatToken(null),'Unavailable')});
  it('aggregates events without double counting current balances',()=>{const rows=[fee('1','0x0000000000000000000000000000000000000002','700','300'),fee('2','0x0000000000000000000000000000000000000002','1400','600')];assert.equal(sumField(rows,'amount_vvv'),900n);const tokens=tokenContributions(rows);assert.equal(tokens.length,1);assert.equal(tokens[0].creatorAmount,2100n);assert.equal(tokens[0].platformAmount,900n)});
  it('converts wei to USD and preserves missing price behavior',()=>{assert.equal(usdFromWei(12_500_000_000_000_000_000n,2),25);assert.equal(usdFromWei(1n,null),null);assert.equal(reserveMismatch(1000n,1000n),false);assert.equal(reserveMismatch(2_000_000_000_000n,0n),true)});
  it('separates creator reserves without producing negative balances',()=>{assert.equal(subtractFloor('18394935000000000000','0'),'18394935000000000000');assert.equal(subtractFloor('10','20'),'0');assert.equal(subtractFloor(null,'0'),null)});
  it('parses DIEM price from GeckoTerminal without accepting zero',()=>{assert.equal(parseGeckoTerminalPrice({data:{attributes:{token_prices:{[ADDRESSES.diem.toLowerCase()]:'2.75'}}}},ADDRESSES.diem),2.75);assert.equal(parseGeckoTerminalPrice({data:{attributes:{token_prices:{[ADDRESSES.diem]:'0'}}}},ADDRESSES.diem),null)});
});
