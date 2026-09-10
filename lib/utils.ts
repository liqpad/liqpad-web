export const formatCompact=(n:number,currency=true)=>new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2,style:currency?'currency':'decimal',currency:'USD'}).format(n);
export const ago=(seconds:number)=>seconds<60?`${seconds}s`:seconds<3600?`${Math.floor(seconds/60)}m`:seconds<86400?`${Math.floor(seconds/3600)}h`:`${Math.floor(seconds/86400)}d`;
export const short=(value:string)=>`${value.slice(0,6)}…${value.slice(-4)}`;
export const shortB20=(value:string)=>`${value.slice(0,5).toLowerCase()}...${value.slice(-3).toLowerCase()}`;
