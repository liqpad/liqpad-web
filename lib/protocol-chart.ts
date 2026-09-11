import type {ProtocolEventRow} from '@/lib/transparency';

export type ProtocolChartPoint={
  date:string;
  fees:bigint;
  swept:bigint;
  staked:bigint;
  svvvLocked:bigint;
  diemMinted:bigint;
  diemStaked:bigint;
};

const raw=(value:unknown)=>{try{return BigInt(String(value??0))}catch{return 0n}};

export function protocolChartSeries(events:ProtocolEventRow[]){
  const days=new Map<string,ProtocolChartPoint>();
  for(const event of events){
    if(!event.block_timestamp)continue;
    const date=event.block_timestamp.slice(0,10);
    const point=days.get(date)||{date,fees:0n,swept:0n,staked:0n,svvvLocked:0n,diemMinted:0n,diemStaked:0n};
    if(event.event_name==='FeeAccrued')point.fees+=raw(event.amount_vvv);
    if(event.event_name==='PlatformSwept')point.swept+=raw(event.amount_vvv);
    if(event.event_name==='Harvest'){
      point.staked+=raw(event.data.vvvStaked);
      point.svvvLocked+=raw(event.data.sVVVLocked);
      point.diemMinted+=raw(event.data.diemMinted);
      point.diemStaked+=raw(event.data.diemStaked);
    }
    days.set(date,point);
  }
  const cumulative={fees:0n,swept:0n,staked:0n,svvvLocked:0n,diemMinted:0n,diemStaked:0n};
  return [...days.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(point=>{
    cumulative.fees+=point.fees;cumulative.swept+=point.swept;cumulative.staked+=point.staked;cumulative.svvvLocked+=point.svvvLocked;cumulative.diemMinted+=point.diemMinted;cumulative.diemStaked+=point.diemStaked;
    return {...point,...cumulative};
  });
}

export function serializeChartPoint(point:ProtocolChartPoint){return Object.fromEntries(Object.entries(point).map(([key,value])=>[key,typeof value==='bigint'?value.toString():value]))}
