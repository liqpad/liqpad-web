export const B07_SUFFIX=0xb07n;
export const B07_MASK=0xfffn;
export const B07_DISPLAY='0xb07';
export function hasB07Suffix(address:string){try{return (BigInt(address)&B07_MASK)===B07_SUFFIX}catch{return false}}
