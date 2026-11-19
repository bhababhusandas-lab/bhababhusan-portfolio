import * as THREE from './assets/vendor/three.module.js';

export function createWorld(canvas, projects, onSelect) {
 let renderer;
 try {renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});} catch(error) {
  document.body.classList.add('webgl-unavailable');
  return {resize(){},render(){},project(){return null}};
 }
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.2;
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,160);
 const hemi=new THREE.HemisphereLight(0xb9d8ff,0x1b173b,2.4);scene.add(hemi);
 const key=new THREE.DirectionalLight(0xe5f0ff,3);key.position.set(5,9,4);scene.add(key);
 const rim=new THREE.DirectionalLight(0x5e6bff,3);rim.position.set(-7,3,-5);scene.add(rim);
 const metal=new THREE.MeshStandardMaterial({color:0x6689b4,metalness:.78,roughness:.25});
 const stone=new THREE.MeshStandardMaterial({color:0x26384b,metalness:.2,roughness:.72});
 const glass=new THREE.MeshPhysicalMaterial({color:0x6489ee,metalness:.4,roughness:.13,clearcoat:1,clearcoatRoughness:.06});
 const pale=new THREE.MeshStandardMaterial({color:0xbacbdf,metalness:.55,roughness:.28});
 const accent=new THREE.MeshStandardMaterial({color:0x93c6ff,emissive:0x284f91,emissiveIntensity:.7,metalness:.5,roughness:.2});
 const mesh=(geometry,material,parent,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m};
 // A suspended sculpture greets the visitor: geometry, not a background picture.
 const hero=new THREE.Group();hero.position.set(1,1,-4);scene.add(hero);
 const knot=mesh(new THREE.TorusKnotGeometry(1.45,.35,112,16,2,3),glass,hero);
 const heroRing=mesh(new THREE.TorusGeometry(2.65,.022,8,100),accent,hero);heroRing.rotation.x=.6;heroRing.rotation.y=.4;
 const satellite=mesh(new THREE.IcosahedronGeometry(.35,1),pale,hero,2.8,.4,0);
 const ground=mesh(new THREE.PlaneGeometry(100,150),new THREE.MeshStandardMaterial({color:0x101a2b,roughness:.32,metalness:.45}),scene,0,-2.7,-40);ground.rotation.x=-Math.PI/2;
 // Sculptural islands are separated by open space; scrolling moves the camera between them.
 const stations=[],interactive=[];
 function labelTexture(title,tag){const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');x.fillStyle='#122338';x.fillRect(0,0,1024,512);const g=x.createRadialGradient(820,40,5,820,40,650);g.addColorStop(0,'#4167cf');g.addColorStop(1,'#122338');x.fillStyle=g;x.fillRect(0,0,1024,512);x.fillStyle='#b4ceff';x.font='19px monospace';x.fillText(tag,55,65);x.fillStyle='#f1f5ff';x.font='500 63px sans-serif';const words=title.split(' ');let line='',y=190;for(const word of words){const next=line+word+' ';if(x.measureText(next).width>850){x.fillText(line,55,y);y+=76;line=word+' '}else line=next}x.fillText(line,55,y);x.fillStyle='#b2c8ed';x.font='20px monospace';x.fillText('SELECT TO EXPLORE  +',55,440);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
 projects.forEach((p,i)=>{
  const group=new THREE.Group();const side=i%2===0?-1:1;group.position.set(side*2.9,-.6,-14-i*8.7);scene.add(group);
  const base=mesh(new THREE.CylinderGeometry(2.4,2.65,.35,64),stone,group,0,-1.5,0);
  mesh(new THREE.TorusGeometry(2.41,.025,6,90),accent,group,0,-1.31,0).rotation.x=Math.PI/2;
  let sculpture;
  if(i===0)sculpture=mesh(new THREE.IcosahedronGeometry(1.25,1),metal,group,0,.2,-.5);
  if(i===1)sculpture=mesh(new THREE.TorusKnotGeometry(.9,.22,90,12,3,2),pale,group,0,.3,-.5);
  if(i===2){sculpture=new THREE.Group();group.add(sculpture);for(let n=0;n<3;n++){const ring=mesh(new THREE.TorusGeometry(1.1,.12,12,64),n%2?metal:glass,sculpture,0,.2,-.5);ring.rotation.set(n*.8,n*.9,0)}}
  if(i===3){sculpture=new THREE.Group();group.add(sculpture);for(let n=0;n<4;n++){const box=mesh(new THREE.BoxGeometry(1.6,.22,1.6),n%2?glass:pale,sculpture,0,-.2+n*.45,-.5);box.rotation.y=n*.35}}
  const frame=mesh(new THREE.BoxGeometry(3.65,1.88,.16),metal,group,0,.2,1.3);
  const panel=mesh(new THREE.PlaneGeometry(3.45,1.72),new THREE.MeshBasicMaterial({map:labelTexture(p.title,p.tag),side:THREE.DoubleSide}),group,0,.2,1.4);
  panel.userData.project=i;interactive.push(panel);frame.userData.project=i;interactive.push(frame);sculpture.traverse(o=>{if(o.isMesh){o.userData.project=i;interactive.push(o)}});
  const light=new THREE.PointLight([0x699cff,0xb5a2ff,0x79cbd2,0xe2c29b][i],14,8,2);light.position.set(0,2,0);group.add(light);
  stations.push({group,sculpture,panel});
 });
 // A sparse field of real 3D points gives parallax and a sense of distance.
 const coords=[];for(let i=0;i<300;i++)coords.push((Math.random()-.5)*65,Math.random()*25-2,-Math.random()*95);
 const pointGeometry=new THREE.BufferGeometry();pointGeometry.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));const dust=new THREE.Points(pointGeometry,new THREE.PointsMaterial({color:0xbdd7ff,size:.025,transparent:true,opacity:.65}));scene.add(dust);
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerX=0,pointerY=0,hover=null,lightMode=false,ready=false;
 function hit(event){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(interactive,false)[0]}
 window.addEventListener('pointermove',event=>{pointerX=(event.clientX/innerWidth-.5)*2;pointerY=(event.clientY/innerHeight-.5)*2;if(!ready||document.querySelector('dialog[open]'))return;const target=hit(event);hover=target?.object.userData.project;canvas.style.cursor=target?'pointer':'';});
 let downX=0,downY=0;window.addEventListener('pointerdown',e=>{downX=e.clientX;downY=e.clientY});
 canvas.addEventListener('pointerup',e=>{if(!ready||document.querySelector('dialog[open]')||Math.hypot(e.clientX-downX,e.clientY-downY)>8)return;const target=hit(e);if(target)onSelect(target.object.userData.project)});
 function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<700?64:48;camera.updateProjectionMatrix()}
 resize();const v=new THREE.Vector3();
 return {
  resize,
  project(i){const obj=stations[i];v.copy(obj.group.position);v.y-=1.4;v.z+=1.5;v.project(camera);const distance=camera.position.distanceTo(obj.group.position);return {x:(v.x*.5+.5)*innerWidth,y:(-.5*v.y+.5)*innerHeight,visible:v.z<1&&v.z>-1&&Math.abs(v.x)<1.1&&distance<22}},
  render(distance,time,light,reduce,paused){
   ready=distance>700;
   if(light!==lightMode||!scene.background){lightMode=light;const color=light?0xe4eaf3:0x070e1b;scene.background=new THREE.Color(color);scene.fog=new THREE.FogExp2(color,light?.023:.035);stone.color.set(light?0x8392a9:0x26384b);ground.material.color.set(light?0xb8c6d7:0x101a2b);hemi.intensity=light?3:2.1;}
   const t=time*.00018;
   hero.visible=distance<1500;hero.scale.setScalar(Math.max(.05,1-distance/1550));
   const progress=Math.max(0,Math.min(3,(distance-2200)/1450));const from=Math.floor(progress),to=Math.min(3,from+1),part=progress-from,smooth=part*part*(3-2*part);const focus=(from%2?2.9:-2.9)*(1-smooth)+(to%2?2.9:-2.9)*smooth;const enter=Math.min(1,distance/1600);const focusX=focus*enter;
   camera.position.set(focusX*.75+(reduce?0:pointerX*.22),1.5+(reduce?0:pointerY*.1),10-distance*.006);
   camera.lookAt(focusX,.05,camera.position.z-13);
   if(!paused&&!reduce){knot.rotation.set(t*.7,t*.9,.25);heroRing.rotation.z=t*.3;satellite.position.y=.4+Math.sin(t*3)*.4;stations.forEach((s,i)=>{s.sculpture.rotation.y=t*(i%2?-.8:.7);s.panel.scale.setScalar(hover===i?1.035:1)});}
   scene.updateMatrixWorld();renderer.render(scene,camera);
   document.documentElement.dataset.renderer='WebGL / Three.js';
  },
 };
}
