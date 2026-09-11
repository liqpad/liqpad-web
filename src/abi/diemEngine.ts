export const diemEngineAbi=[
  {type:'function',name:'owner',stateMutability:'view',inputs:[],outputs:[{type:'address'}]},
  {type:'function',name:'BPS',stateMutability:'view',inputs:[],outputs:[{type:'uint16'}]},
  {type:'function',name:'DEFAULT_MIN_OUT_BPS',stateMutability:'view',inputs:[],outputs:[{type:'uint16'}]},
  {type:'function',name:'DEFAULT_RESERVE_BPS',stateMutability:'view',inputs:[],outputs:[{type:'uint16'}]},
  {type:'function',name:'MAX_RESERVE_BPS',stateMutability:'view',inputs:[],outputs:[{type:'uint16'}]},
  {type:'function',name:'VVV',stateMutability:'view',inputs:[],outputs:[{type:'address'}]},
  {type:'function',name:'adapter',stateMutability:'view',inputs:[],outputs:[{type:'address'}]},
  {type:'function',name:'reserveBps',stateMutability:'view',inputs:[],outputs:[{type:'uint16'}]},
  {type:'function',name:'minOutBps',stateMutability:'view',inputs:[],outputs:[{type:'uint16'}]},
  {type:'function',name:'minMintSVVV',stateMutability:'view',inputs:[],outputs:[{type:'uint256'}]},
  {type:'function',name:'unwindDelay',stateMutability:'view',inputs:[],outputs:[{type:'uint256'}]},
  {type:'function',name:'autoStakeDiem',stateMutability:'view',inputs:[],outputs:[{type:'bool'}]},
  {type:'function',name:'harvestPaused',stateMutability:'view',inputs:[],outputs:[{type:'bool'}]},
  {type:'function',name:'harvest',stateMutability:'nonpayable',inputs:[],outputs:[]},
  {type:'function',name:'compound',stateMutability:'nonpayable',inputs:[],outputs:[]},
  ...['vvvReceived','vvvStaked','sVVVLocked','diemMinted','diemStaked','diemLiquid','accountedLiquidVVV','pendingUnwindDiem','unwindReadyAt'].map(name=>({type:'function' as const,name,stateMutability:'view' as const,inputs:[],outputs:[{type:'uint256' as const}]})),
  {type:'function',name:'unwindStarted',stateMutability:'view',inputs:[],outputs:[{type:'bool'}]},
] as const;

export const protocolEventsAbi=[
  {type:'event',name:'FeeAccrued',inputs:[{indexed:true,name:'token',type:'address'},{indexed:true,name:'creator',type:'address'},{indexed:false,name:'creatorAmount',type:'uint256'},{indexed:false,name:'platformAmount',type:'uint256'}]},
  {type:'event',name:'PlatformSwept',inputs:[{indexed:true,name:'diemEngine',type:'address'},{indexed:false,name:'amount',type:'uint256'}]},
  {type:'event',name:'Harvest',inputs:[{indexed:false,name:'vvvReceived',type:'uint256'},{indexed:false,name:'vvvStaked',type:'uint256'},{indexed:false,name:'sVVVLocked',type:'uint256'},{indexed:false,name:'diemMinted',type:'uint256'},{indexed:false,name:'diemStaked',type:'uint256'}]},
  {type:'event',name:'UnwindBegun',inputs:[{indexed:false,name:'diemAmount',type:'uint256'},{indexed:false,name:'readyAt',type:'uint256'}]},
  {type:'event',name:'UnwindProgressed',inputs:[{indexed:false,name:'stage',type:'uint8'},{indexed:false,name:'diemBurned',type:'uint256'},{indexed:false,name:'sVVVUnlocked',type:'uint256'},{indexed:false,name:'vvvRecovered',type:'uint256'}]},
  {type:'event',name:'HarvestPausedSet',inputs:[{indexed:false,name:'paused',type:'bool'}]},
] as const;
