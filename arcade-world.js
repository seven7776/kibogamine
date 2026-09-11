/* Scenery, earned equipment and bounded particle effects for the playground. */
(function () {
  'use strict';
  var BIOMES = [
    { name:'晴日小镇', color:'#ffca72', sky:'#b6dceb', road:'#72899a', ground:'#91bcb0' },
    { name:'霓虹街区', color:'#ff83c1', sky:'#181c38', road:'#3e4264', ground:'#242941' },
    { name:'萤火森林', color:'#97e2a4', sky:'#83b7af', road:'#8a9274', ground:'#567f67' },
    { name:'峡谷山路', color:'#ffc284', sky:'#e0bd9d', road:'#a78d7e', ground:'#bb947a' },
    { name:'极光雪岭', color:'#a5e7ff', sky:'#49577e', road:'#7e9bb7', ground:'#b8cbdc' }
  ];
  var REWARDS = [
    ['碎金星屑','收星时散开金色碎片','✦'],['彗星跳跃','起跳后留下一道金色光带','☄'],
    ['星环跑鞋','脚踝戴上金色星环','◎'],['探险背包','背上带星徽的小背包','▣'],
    ['节奏耳机','戴上霓虹耳机','♫'],['落地光环','落地扩散一圈金色光波','◉'],
    ['双束尾光','跳跃光带升级为左右两束','〰'],['能量背包','背包增加双推进器','▥'],
    ['林间围巾','披上薄荷绿围巾','≈'],['翡翠星屑','收星时金色与翡翠碎片交织','✧'],
    ['流星肩章','肩膀增加发光星章','★'],['连击火花','每连收五颗星触发额外爆闪','⚡'],
    ['山风羽翼','背包两侧长出小羽翼','⌁'],['星纹护腕','两只手腕戴上光环','◇'],
    ['极光拖尾','跳跃光带流动变色','∿'],['登峰光冠','戴上发光王冠','♛'],
    ['雪晶爆闪','星屑升级为雪晶与碎金','❄'],['三重星轨','跳跃时展开第三道星轨','≋'],
    ['希望披风','获得背后的希望披风','⚑'],['校长冠军旗','背上冠军星旗，收星放彩光','⚐']
  ];
  function equip(model, rank) {
    var T=window.THREE, group=new T.Group(); group.name='earned-equipment'; model.bodyG.add(group);
    function mat(c){return new T.MeshStandardMaterial({color:c,roughness:0.48,emissive:c,emissiveIntensity:0.17});}
    var gold=mat('#ffd569'),mint=mat('#72e8cb'),pink=mat('#ff81bd'),navy=mat('#334262');
    function mesh(g,m,x,y,z,parent){var o=new T.Mesh(g,m);o.position.set(x,y,z);(parent||group).add(o);return o;}
    function ring(x,y,z,r,m){var o=mesh(new T.TorusGeometry(r,0.035,6,20),m,x,y,z);o.rotation.x=Math.PI/2;return o;}
    if(rank>=3)[-1,1].forEach(function(s){ring(s*0.36,-0.07,0.18,0.245,gold);});
    if(rank>=4){mesh(new T.BoxGeometry(0.66,0.72,0.27),navy,0,1.0,-0.79);mesh(new T.OctahedronGeometry(0.14),gold,0,1.03,-0.95);}
    if(rank>=5){[-1,1].forEach(function(s){mesh(new T.SphereGeometry(0.20,12,8),pink,s*0.94,2.12,-0.03);});var band=mesh(new T.TorusGeometry(0.98,0.045,6,24,Math.PI),pink,0,2.13,0);}
    if(rank>=8)[-1,1].forEach(function(s){var nozzle=mesh(new T.CylinderGeometry(0.11,0.16,0.46,10),gold,s*0.24,0.76,-1.02);mesh(new T.SphereGeometry(0.105,10,8),mint,s*0.24,0.50,-1.02);});
    if(rank>=9){var scarf=ring(0,1.56,0,0.58,mint);scarf.scale.y=2;mesh(new T.BoxGeometry(0.19,0.68,0.07),mint,0.48,1.09,-0.73).rotation.z=0.18;}
    if(rank>=11)[-1,1].forEach(function(s){mesh(new T.OctahedronGeometry(0.14),gold,s*0.86,1.40,-0.14);});
    if(rank>=13)[-1,1].forEach(function(s){var sh=new T.Shape();sh.moveTo(0,0);sh.lineTo(s*0.64,0.36);sh.lineTo(s*0.50,-0.13);sh.lineTo(s*0.24,-0.31);sh.closePath();mesh(new T.ExtrudeGeometry(sh,{depth:0.055,bevelEnabled:false}),mint,s*0.34,1.13,-0.88);});
    if(rank>=14)[-1,1].forEach(function(s){ring(s*0.98,0.89,0.05,0.21,pink);});
    if(rank>=16){var crown=new T.Group();crown.name='light-crown';crown.position.set(0,3.07,0);group.add(crown);var base=mesh(new T.TorusGeometry(0.34,0.04,6,24),gold,0,0,0,crown);base.rotation.x=Math.PI/2;for(var i=0;i<5;i++){var a=i/5*Math.PI*2;mesh(new T.ConeGeometry(0.075,0.25,5),gold,Math.cos(a)*0.32,0.12,Math.sin(a)*0.32,crown);}}
    if(rank>=19){var cape=new T.Shape();cape.moveTo(-0.35,0.4);cape.lineTo(0.35,0.4);cape.lineTo(0.63,-0.72);cape.lineTo(0,-0.53);cape.lineTo(-0.63,-0.72);cape.closePath();var cloth=mesh(new T.ExtrudeGeometry(cape,{depth:0.035,bevelEnabled:false}),pink,0,0.89,-0.82);cloth.rotation.x=0.28;}
    if(rank>=20){mesh(new T.CylinderGeometry(0.025,0.025,1.4,6),gold,0.40,1.7,-1.04);mesh(new T.BoxGeometry(0.55,0.34,0.04),navy,0.65,2.18,-1.04);mesh(new T.OctahedronGeometry(0.115),gold,0.65,2.18,-1.08);}
    return group;
  }
  function buildScenery(scene, biomeIndex) {
    var T=window.THREE,b=BIOMES[biomeIndex],items=[],mats={};
    function mat(c){if(!mats[c])mats[c]=new T.MeshStandardMaterial({color:c,roughness:0.85});return mats[c];}
    function mesh(g,c,x,y,z,parent){var o=new T.Mesh(g,mat(c));o.position.set(x,y,z);parent.add(o);return o;}
    function box(w,h,d,c,x,y,z,parent){return mesh(new T.BoxGeometry(w,h,d),c,x,y,z,parent);}
    box(150,0.2,130,b.ground,0,-0.7,-42,scene);
    for(var i=0;i<16;i++){
      var group=new T.Group(),side=i%2?-1:1;
      group.position.set(side*(7+i%3),0,-i*6.75);scene.add(group);items.push(group);
      group.userData.biome=biomeIndex;
      if(biomeIndex<2){
        var h=biomeIndex===0?2.5+i%3:4+i%5;
        var colors=biomeIndex===0?['#f2b58e','#a8c8d1','#eee0ad','#b9bfdc']:['#353552','#394960','#514365'];
        box(2.6,h,3.2,colors[i%colors.length],0,h/2,0,group);
        if(biomeIndex===0){var roof=mesh(new T.ConeGeometry(2.15,1.0,4),'#84665c',0,h+0.48,0,group);roof.rotation.y=Math.PI/4;}
        else box(2.75,0.12,3.3,b.color,0,h,0,group);
        // Windows and storefront face the track, not the outside of the scene.
        for(var f=0;f<3;f++)box(0.03,0.5,0.55,biomeIndex===0?'#f9f2cf':'#8bf0ef',-side*1.32,1.15+f*(h-1.7)/3,-0.65,group);
        box(0.04,0.6,1.9,biomeIndex===0?'#ef896d':'#eb7bc1',-side*1.36,0.65,0.4,group);
        box(0.55,0.08,2.5,biomeIndex===0?'#f7e2b3':'#8e9fff',-side*1.5,1.15,0.25,group);
        var lampX=-side*2.1;mesh(new T.CylinderGeometry(0.055,0.055,2.2,6),'#495466',lampX,1.1,1.5,group);
        mesh(new T.SphereGeometry(0.18,8,6),biomeIndex===0?'#fff1bd':'#9cefff',lampX,2.25,1.5,group);
      }else if(biomeIndex===2||biomeIndex===4){
        var snowy=biomeIndex===4, height=2.2+(i%2)*0.2;
        mesh(new T.CylinderGeometry(0.20,0.34,height,7),'#795c4b',0,height/2,0,group);
        for(var crown=0;crown<3;crown++)mesh(new T.ConeGeometry(1.65-crown*0.35,2.1,7),snowy?(crown%2?'#b8d4d7':'#f2f7fb'):['#3d886f','#4d9b7c','#6bb18a'][crown],0,1.9+crown*0.9,0,group);
        mesh(new T.DodecahedronGeometry(0.6),snowy?'#d8e9f5':'#788c70',-side*1.5,0.22,1.4,group);
        if(!snowy){for(var m=0;m<2;m++){mesh(new T.CylinderGeometry(0.06,0.10,0.32,6),'#f0dab0',-side*(1.7+m*0.35),0.16,-1.0,group);mesh(new T.SphereGeometry(0.20,8,6),'#eaaa67',-side*(1.7+m*0.35),0.35,-1.0,group);}}
      }else{
        var rock=mesh(new T.DodecahedronGeometry(2.6+i%3,0),['#a57966','#c3977b','#bd8a72'][i%3],side*1.8,2.4,0,group);rock.scale.set(1,1.3+i%3*0.3,0.9);
        mesh(new T.DodecahedronGeometry(0.72),'#d4ac86',-side*1.0,0.45,1.5,group);
        box(0.12,0.8,0.13,'#755f54',-side*2.15,0.3,0,group);
        box(0.13,0.13,6.75,'#e2bc92',-side*2.15,0.65,0,group);
        if(i%4===0){mesh(new T.CylinderGeometry(0.13,0.13,1.4,7),'#557f67',-side*0.8,0.7,-1.6,group);mesh(new T.SphereGeometry(0.16,8,6),'#557f67',-side*0.8,1.42,-1.6,group);}
      }
    }
    return items;
  }
  function effects(scene, rank, chosenColor, originZ) {
    originZ = originZ === undefined ? 3 : originZ;
    var T=window.THREE,pool=[],cursor=0,history=[],lastEmit=0;
    var shards=new T.InstancedMesh(new T.OctahedronGeometry(0.08),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:0.92}),120);
    shards.name='star-gold-particles';shards.frustumCulled=false;shards.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(shards);
    var dummy=new T.Object3D(),gold=new T.Color('#ffda76');
    for(var i=0;i<120;i++){pool.push({life:0,v:new T.Vector3(),p:new T.Vector3()});dummy.scale.setScalar(0);dummy.updateMatrix();shards.setMatrixAt(i,dummy.matrix);shards.setColorAt(i,gold);}
    var ribbons=[];
    for(var r=0;r<3;r++){var geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(28*6*3),3).setUsage(T.DynamicDrawUsage));var ribbon=new T.Mesh(geo,new T.MeshBasicMaterial({color:r===0?'#ffd569':r===1?'#7feadf':'#ffa2ce',transparent:true,opacity:0.72,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));ribbon.name='jump-trail-'+r;ribbon.frustumCulled=false;ribbon.visible=false;scene.add(ribbon);ribbons.push(ribbon);}
    var landing=new T.Mesh(new T.RingGeometry(0.55,0.68,40),new T.MeshBasicMaterial({color:'#ffd569',transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));landing.name='landing-ring';landing.rotation.x=-Math.PI/2;scene.add(landing);var ringLife=0,previousJump=0;
    function burst(position,combo){var amount=rank===0?6:Math.min(36,12+rank);if(rank>=12&&combo%5===0)amount=48;
      for(var j=0;j<amount;j++){var p=pool[cursor++%pool.length],angle=Math.random()*Math.PI*2,speed=0.8+Math.random()*2.1;p.life=0.5+Math.random()*0.4;p.p.copy(position);p.v.set(Math.cos(angle)*speed,1.5+Math.random()*2,Math.sin(angle)*speed);var c=gold.clone();if(rank>=20)c.setHSL(j/amount,0.85,0.7);else if(rank>=17&&j%3===0)c.set('#bfecff');else if(rank>=10&&j%3===0)c.set('#83e8b7');shards.setColorAt((cursor-1)%pool.length,c);}
      shards.instanceColor.needsUpdate=true;
    }
    function update(dt,t,x,jumpY,speed,running){
      for(var j=0;j<pool.length;j++){var p=pool[j];if(p.life>0){p.life-=dt;p.v.y-=dt*4;p.p.addScaledVector(p.v,dt);p.p.z+=speed*dt*0.3;dummy.position.copy(p.p);dummy.rotation.set(t*3+j,t*4,0);dummy.scale.setScalar(Math.max(0,p.life)*1.5);}else dummy.scale.setScalar(0);dummy.updateMatrix();shards.setMatrixAt(j,dummy.matrix);}shards.instanceMatrix.needsUpdate=true;
      history.forEach(function(h){h.age+=dt;h.z+=speed*dt*0.75;});history=history.filter(function(h){return h.age<0.48;});
      lastEmit+=dt;if(running&&jumpY>0.06&&rank>=2&&lastEmit>0.016){history.unshift({x:x,y:0.2+jumpY,z:originZ+0.25,age:0});lastEmit=0;}if(history.length>29)history.length=29;
      ribbons.forEach(function(ribbon,ri){ribbon.visible=rank>=(ri===0?2:ri===1?7:18)&&history.length>1;if(!ribbon.visible)return;var arr=ribbon.geometry.attributes.position.array,offset=ri===0?-0.24:ri===1?0.24:0,width=ri===2?0.065:0.10,n=0;
        for(var k=0;k<history.length-1;k++){var a=history[k],b=history[k+1],wa=width*(1-a.age/0.5),wb=width*(1-b.age/0.5);[[a,-wa],[b,-wb],[a,wa],[a,wa],[b,-wb],[b,wb]].forEach(function(pair){arr[n++]=pair[0].x+offset+pair[1];arr[n++]=pair[0].y;arr[n++]=pair[0].z;});}
        ribbon.geometry.setDrawRange(0,n/3);ribbon.geometry.attributes.position.needsUpdate=true;if(rank>=15)ribbon.material.color.setHSL((t*0.13+ri*0.22)%1,0.85,0.68);else if(chosenColor&&ri===0)ribbon.material.color.set(chosenColor);
      });
      if(rank>=6&&previousJump>0&&jumpY===0){ringLife=0.55;landing.position.set(x,-0.15,originZ);}
      previousJump=jumpY;ringLife=Math.max(0,ringLife-dt);landing.material.opacity=ringLife;landing.scale.setScalar(1+(0.55-ringLife)*4);landing.position.z+=speed*dt*0.7;
    }
    return { burst:burst,update:update };
  }
  window.ArcadeWorld={BIOMES:BIOMES,REWARDS:REWARDS,equip:equip,buildScenery:buildScenery,effects:effects};
})();
