// All soft edges use increasing smoothstep bounds for consistent mobile GLSL.
export const particleVertex=`
attribute vec3 aVelocity;attribute vec4 aTiming;attribute vec4 aStyle;attribute vec3 aColor;
uniform float time;uniform float viewportHeight;varying vec4 tint;varying float kind;varying float turn;
void main(){float age=time-aTiming.x;float t=clamp(age/max(.01,aTiming.y),0.,1.);float alive=step(0.,age)*(1.-step(aTiming.y,age));vec3 p=position+aVelocity*age;p.y+=aStyle.y*age*age*.5;p.x+=sin(age*2.3+aStyle.z)*aStyle.w*t;p.z+=cos(age*1.9+aStyle.z)*aStyle.w*t;vec4 mv=modelViewMatrix*vec4(p,1.);float fade=smoothstep(0.,.12,t)*(1.-smoothstep(.55,1.,t));tint=vec4(aColor,aTiming.w*fade*alive);kind=aStyle.x;turn=aStyle.z+age*.3;gl_PointSize=clamp(aTiming.z*viewportHeight*projectionMatrix[1][1]/max(.2,-mv.z)*.5,1.,56.)*alive;gl_Position=projectionMatrix*mv;}
`;
export const particleFragment=`
varying vec4 tint;varying float kind;varying float turn;
void main(){if(tint.a<.001)discard;vec2 q=(gl_PointCoord-.5)*2.;float cs=cos(turn),sn=sin(turn);vec2 p=mat2(cs,-sn,sn,cs)*q;float r=length(p),a=0.;
if(kind<.5){a=exp(-r*r*5.)*(1.-smoothstep(.72,1.,r));}
else if(kind<1.5){float spike=pow(max(0.,1.-abs(p.x)*abs(p.y)*20.),3.);a=(spike*.65+exp(-r*r*12.)*.65)*(1.-smoothstep(.15,1.,r));}
else if(kind<2.5){float angle=atan(p.y,p.x),branch=pow(max(0.,cos(angle*6.)),15.);a=(branch*.65+exp(-r*r*24.))*(1.-smoothstep(.6,.92,r));}
else if(kind<3.5){vec2 h=q;h.y=-h.y;h.y+=.17;float f=pow(h.x*h.x+h.y*h.y-.42,3.)-h.x*h.x*h.y*h.y*h.y;a=1.-smoothstep(-.02,.018,f);a*=1.-smoothstep(.88,1.1,length(h));}
else {vec2 h=q;h.y=-h.y;float taper=.48*(1.-h.y*.55);float d=length(vec2(h.x/max(.08,taper),h.y*1.15));a=(1.-smoothstep(.72,1.,d))*.8;}
gl_FragColor=vec4(tint.rgb*(1.+a*.55),a*tint.a);}
`;
export const auraVertex=`
attribute vec3 aCenter;attribute vec4 aState;attribute vec3 aColor;uniform float time;varying vec2 vUv;varying vec4 tint;varying float phase;
void main(){vUv=uv;phase=aState.y;tint=vec4(aColor,aState.x*aState.w);float size=.8+min(aState.z*.01,.27);vec3 p=vec3(position.x*size,0.,-position.y*size)+aCenter;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}
`;
export const auraFragment=`
uniform float time;uniform float motion;varying vec2 vUv;varying vec4 tint;varying float phase;
void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);float breathe=.77+.23*sin(time*.7*motion+phase);float halo=exp(-r*r*5.)*.09;float ring=exp(-pow((r-.68)*38.,2.));float arc=pow(.5+.5*sin(a*3.-time*.5*motion+phase),6.);float filigree=exp(-pow((r-(.81+.015*sin(a*6.+time*.25*motion)))*48.,2.))*.045;float alpha=(halo+ring*arc*.11+filigree)*breathe*tint.a;gl_FragColor=vec4(tint.rgb,alpha*(1.-smoothstep(.87,1.,r)));}
`;
export const pulseVertex=`
attribute vec3 aCenter;attribute vec4 aPulse;attribute vec3 aColor;uniform float time;varying vec2 vUv;varying vec4 tint;varying float life;
void main(){float age=time-aPulse.x;life=clamp(age/max(.01,aPulse.y),0.,1.);float alive=step(0.,age)*(1.-step(aPulse.y,age));vUv=uv;tint=vec4(aColor,aPulse.w*alive);float radius=aPulse.z*(.22+life*.78);vec3 p=vec3(position.x*radius,0.,-position.y*radius)+aCenter;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}
`;
export const pulseFragment=`
varying vec2 vUv;varying vec4 tint;varying float life;
void main(){float r=length((vUv-.5)*2.);float ring=exp(-pow((r-.7)*28.,2.));float inner=exp(-r*r*6.)*.15;float fade=sin(life*3.14159265)*(1.-life);gl_FragColor=vec4(tint.rgb,(ring+inner)*fade*tint.a*.55);}
`;
export const trailVertex=`
attribute float aFade;attribute vec3 aColor;varying vec2 vUv;varying float fade;varying vec3 tint;
void main(){vUv=uv;fade=aFade;tint=aColor;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
`;
export const trailFragment=`
uniform float time;varying vec2 vUv;varying float fade;varying vec3 tint;
void main(){float edge=pow(max(0.,1.-abs(vUv.x*2.-1.)),2.);float flow=.76+.24*sin(vUv.y*17.-time*2.);gl_FragColor=vec4(tint,edge*fade*flow*.28);}
`;
