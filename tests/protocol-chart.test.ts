import assert from 'node:assert/strict';
import test from 'node:test';
import {protocolChartSeries} from '../lib/protocol-chart';
import type {ProtocolEventRow} from '../lib/transparency';

const event=(id:string,event_name:string,date:string,amount_vvv:string|null,data:ProtocolEventRow['data']={}):ProtocolEventRow=>({id,event_name,block_timestamp:`${date}T12:00:00.000Z`,amount_vvv,amount_diem:null,data,contract_address:'0x0000000000000000000000000000000000000001',token:null,creator:null,tx_hash:`0x${id.padStart(64,'0')}`,log_index:0,block_number:id});

test('builds cumulative daily protocol VVV series',()=>{
  const series=protocolChartSeries([
    event('1','FeeAccrued','2026-09-09','100'),
    event('2','PlatformSwept','2026-09-10','80'),
    event('3','Harvest','2026-09-10','80',{vvvStaked:'60',sVVVLocked:'50',diemMinted:'40',diemStaked:'30'}),
    event('4','FeeAccrued','2026-09-11','25'),
  ]);
  assert.equal(series.length,3);
  assert.equal(series.at(-1)?.fees,125n);
  assert.equal(series.at(-1)?.swept,80n);
  assert.equal(series.at(-1)?.staked,60n);
  assert.equal(series.at(-1)?.diemMinted,40n);
});

test('ignores rows without confirmed timestamps',()=>{
  const row=event('1','FeeAccrued','2026-09-09','100');row.block_timestamp=null;
  assert.deepEqual(protocolChartSeries([row]),[]);
});
