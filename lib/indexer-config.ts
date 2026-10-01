export function boundedInteger(value:string|undefined,fallback:number,min:number,max:number){
  const parsed=Number(value);
  if(!Number.isFinite(parsed))return fallback;
  return Math.max(min,Math.min(max,Math.floor(parsed)));
}

export function retryDelayMs(failures:number,baseMs:number,maxMs:number){
  const exponent=Math.max(0,Math.min(10,failures-1));
  return Math.min(maxMs,baseMs*2**exponent);
}

export const sleep=(milliseconds:number)=>new Promise<void>(resolve=>setTimeout(resolve,milliseconds));
