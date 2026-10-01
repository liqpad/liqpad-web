export const agentFeeSplitterFactoryAbi = [
  {type:'event',name:'AgentFeeSplitterCreated',anonymous:false,inputs:[
    {indexed:true,name:'agentId',type:'bytes32'},
    {indexed:true,name:'configurationHash',type:'bytes32'},
    {indexed:true,name:'splitter',type:'address'},
    {indexed:false,name:'token',type:'address'},
    {indexed:false,name:'humanCreator',type:'address'},
    {indexed:false,name:'agentTreasury',type:'address'},
  ]},
  {type:'function',name:'createSplitter',stateMutability:'nonpayable',inputs:[
    {name:'agentId',type:'bytes32'},{name:'token',type:'address'},{name:'humanCreator',type:'address'},{name:'agentTreasury',type:'address'},
  ],outputs:[{name:'splitter',type:'address'}]},
  {type:'function',name:'predictSplitter',stateMutability:'view',inputs:[
    {name:'agentId',type:'bytes32'},{name:'token',type:'address'},{name:'humanCreator',type:'address'},{name:'agentTreasury',type:'address'},
  ],outputs:[{name:'',type:'address'}]},
  {type:'function',name:'configurationHash',stateMutability:'pure',inputs:[
    {name:'agentId',type:'bytes32'},{name:'token',type:'address'},{name:'humanCreator',type:'address'},{name:'agentTreasury',type:'address'},
  ],outputs:[{name:'',type:'bytes32'}]},
  {type:'function',name:'feeRouter',stateMutability:'view',inputs:[],outputs:[{name:'',type:'address'}]},
  {type:'function',name:'implementation',stateMutability:'view',inputs:[],outputs:[{name:'',type:'address'}]},
] as const;

export const agentFeeSplitterAbi = [
  {type:'event',name:'AgentFeesDistributed',anonymous:false,inputs:[
    {indexed:true,name:'token',type:'address'},
    {indexed:true,name:'humanCreator',type:'address'},
    {indexed:true,name:'agentTreasury',type:'address'},
    {indexed:false,name:'totalAmount',type:'uint256'},
    {indexed:false,name:'humanAmount',type:'uint256'},
    {indexed:false,name:'agentAmount',type:'uint256'},
  ]},
  {type:'function',name:'claimAndDistribute',stateMutability:'nonpayable',inputs:[],outputs:[
    {name:'received',type:'uint256'},{name:'humanAmount',type:'uint256'},{name:'agentAmount',type:'uint256'},
  ]},
  {type:'function',name:'claimable',stateMutability:'view',inputs:[],outputs:[{name:'',type:'uint256'}]},
  {type:'function',name:'token',stateMutability:'view',inputs:[],outputs:[{name:'',type:'address'}]},
  {type:'function',name:'humanCreator',stateMutability:'view',inputs:[],outputs:[{name:'',type:'address'}]},
  {type:'function',name:'agentTreasury',stateMutability:'view',inputs:[],outputs:[{name:'',type:'address'}]},
  {type:'function',name:'totalDistributed',stateMutability:'view',inputs:[],outputs:[{name:'',type:'uint256'}]},
  {type:'function',name:'totalHumanPaid',stateMutability:'view',inputs:[],outputs:[{name:'',type:'uint256'}]},
  {type:'function',name:'totalAgentPaid',stateMutability:'view',inputs:[],outputs:[{name:'',type:'uint256'}]},
] as const;
