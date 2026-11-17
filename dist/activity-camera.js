// Views use the avatar origin (not a model-specific child transform).
const views={
  eat:{distance:5.8,pitch:.18,lookHeight:-.75},drink:{distance:5.8,pitch:.18,lookHeight:-.75},
  bubble:{distance:7,pitch:.18,lookHeight:-.6},wave:{distance:6,pitch:.18,lookHeight:-.65},
  warm:{distance:8.8,pitch:.25,lookHeight:-.65,side:1.08},roast:{distance:8.8,pitch:.25,lookHeight:-.65,side:1.08},
  tea:{distance:7.5,pitch:.3,lookHeight:-.5,side:.72},dining:{distance:7.5,pitch:.3,lookHeight:-.5,side:.72},
  rest:{distance:8,pitch:.35,lookHeight:-.4,side:.7},skate:{distance:12,pitch:.35,lookHeight:0,side:Math.PI}
 };
export function activityCameraView(kind,{yaw=0,mobile=false}={}){
 const v=views[kind];return v?{...v,distance:v.distance*(mobile?1.18:1),yaw:yaw+(v.side||0)}:null;
}
