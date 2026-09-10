export const clampPage=(value:number,totalPages:number)=>Math.max(1,Math.min(Math.max(1,totalPages),Number.isFinite(value)?Math.floor(value):1));
export const pageWindow=(page:number,totalPages:number,size=5)=>{const count=Math.min(size,totalPages);const start=Math.max(1,Math.min(page-Math.floor(count/2),totalPages-count+1));return Array.from({length:count},(_,index)=>start+index)};
