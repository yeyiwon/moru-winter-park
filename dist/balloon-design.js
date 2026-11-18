export const balloonColors=['#ed91b3','#79cfe1','#c4a0ed','#f0c56b','#91d9b5','#ed9980','#a8b9f0'];
export const balloonStyles=['classic','star','snow'];
export function pickBalloonStyle(random=Math.random){return balloonStyles[Math.floor(random()*balloonStyles.length)];}
export function pickBalloonTone(previous=-1,random=Math.random){const n=balloonColors.length;if(previous<0||previous>=n)return Math.floor(random()*n);return(previous+1+Math.floor(random()*(n-1)))%n;}
