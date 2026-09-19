// classKey lets this build from an allied variant table (see
// populateFriendlyTerritory) instead of the default 'tank' enemy table —
// same mesh, same broad `type` (so it shares AI/HUD/map handling), just a
// different UNIT_CLASSES source and a `friendly` flag carried through from
// the variant data.
// makeTank is the shared entry point for all 'tank' variants (mirrors
// makeAAA's family dispatch below) — it picks the variant, then routes to
// a family-specific mesh builder purely by name: T-72/T-74 (and the
// friendly M1 Abrams, same silhouette family) get the boxy main-battle-tank
// hull; BMP-2 (and the friendly M2 Bradley, same silhouette family) get the
// lower, sloped-nose IFV hull; the friendly M247 Sgt York gets its own
// radar-turret build (buildSgtYorkMesh, below buildBMPMesh) since real one
// looks nothing like either of those. All variants share the same userData
// shape so nothing downstream needs to know which mesh it's looking at.
function makeTank(variantName, classKey='tank'){
  const v = pickUnitClass(classKey, variantName);
  let g;
  if(v.name==='BMP-2' || v.name==='M2 Bradley') g = buildBMPMesh(v);
  else if(v.name==='M247 Sgt York') g = buildSgtYorkMesh(v);
  else g = buildMBTMesh(v);
  g.userData={type:'tank', className:v.name, hp:v.hp, maxHp:v.hp, fireCd:0, range:v.range, kind:'ground', armored:true,
    interval:v.interval, projSpeed:v.projSpeed, dmg:v.dmg, pointsValue:5, friendly:!!v.friendly, grail:v.grail};
  return g;
}
// T-72/T-74 (and friendly M1 Abrams): classic boxy MBT silhouette, now with
// an angled glacis plate standing in for the sloped front armor, six road
// wheels per side under a thin track guard, a turret mantlet and hatch, an
// antenna, and a pair of rear-deck fuel drums (a recognizable real-T-72
// feature). T-74 additionally gets a turret-front smoke-discharger
// cluster — the one visual tell for the upgraded/tougher variant, on top
// of its higher HP/faster reload in UNIT_CLASSES.
function buildMBTMesh(v){
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({color:v.hullColor, flatShading:true});
  const turretMat = new THREE.MeshStandardMaterial({color:v.turretColor, flatShading:true});
  const barrelMat = new THREE.MeshStandardMaterial({color:v.barrelColor});
  const wheelMat = new THREE.MeshStandardMaterial({color:0x1c1c1c, flatShading:true});

  const hull = new THREE.Mesh(new THREE.BoxGeometry(5,3,7), hullMat);
  hull.position.y=1.6; g.add(hull);
  hull.castShadow = true;

  // Angled glacis plate at the nose, standing in for the T-72 family's
  // steeply sloped front armor rather than a flat hull front face.
  const glacis = new THREE.Mesh(new THREE.BoxGeometry(4.8,2.6,2), hullMat);
  glacis.position.set(0,1.3,4.3); glacis.rotation.x = -0.5; g.add(glacis);
  glacis.castShadow = true;

  // Track guards: thin plates running the hull length just above the road
  // wheels, hiding their tops the way a real fender/skirt does.
  [-2.6,2.6].forEach(x=>{
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.3,7.2), hullMat);
    guard.position.set(x,0.9,0); g.add(guard);
    guard.castShadow = true;
  });

  // Six road wheels per side.
  for(let i=0;i<6;i++){
    const z = -3+i*1.2;
    [-2.75,2.75].forEach(x=>{
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.35,10), wheelMat);
      wheel.rotation.z = Math.PI/2; wheel.position.set(x,0.55,z); g.add(wheel);
      wheel.castShadow = true;
    });
  }

  const turret = new THREE.Mesh(new THREE.BoxGeometry(3,1,4), turretMat);
  turret.position.y=3.6; turret.name='turret'; g.add(turret);
  turret.castShadow = true;

  // Mantlet: a slightly wider block where the barrel emerges, breaking up
  // the turret's flat front face.
  const mantlet = new THREE.Mesh(new THREE.BoxGeometry(2,0.9,0.6), turretMat);
  mantlet.position.set(0,-0.05,2); turret.add(mantlet);
  mantlet.castShadow = true;

  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.3,8), hullMat);
  hatch.position.set(-0.8,0.65,-1); turret.add(hatch);
  hatch.castShadow = true;

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,3.2,5), new THREE.MeshStandardMaterial({color:0x1a1a1a}));
  antenna.position.set(1.3,2.1,-1.6); antenna.rotation.z = 0.12; turret.add(antenna);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.25,6,6), barrelMat);
  barrel.rotation.x=Math.PI/2; barrel.position.set(0,0,4); turret.add(barrel);
  barrel.castShadow = true;

  // Rear-deck fuel drums.
  [-1,1].forEach(x=>{
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,1.1,8), new THREE.MeshStandardMaterial({color:0x3a3a2c, flatShading:true}));
    drum.rotation.z = Math.PI/2; drum.position.set(x,2.6,-3.6); g.add(drum);
    drum.castShadow = true;
  });

  if(v.name==='T-74'){
    [-1.1,1.1].forEach(x=>{
      for(let i=0;i<3;i++){
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.5,6), new THREE.MeshStandardMaterial({color:0x1c1c1c}));
        tube.rotation.x = Math.PI/2.4; tube.position.set(x+(i-1)*0.22,0.55,1.9); turret.add(tube);
      }
    });
  }

  return g;
}
// BMP-2 (and friendly M2 Bradley): lower, sloped-nose IFV silhouette — a
// wedge-shaped bow with a fold-down-style trim vane (BMP-2 is amphibious
// and swims nose-first), six small closely-spaced road wheels per side
// (smaller and tighter than the MBT's), and a small low turret set toward
// the front carrying the long autocannon, rather than a mid-hull tank turret.
function buildBMPMesh(v){
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({color:v.hullColor, flatShading:true});
  const turretMat = new THREE.MeshStandardMaterial({color:v.turretColor, flatShading:true});
  const barrelMat = new THREE.MeshStandardMaterial({color:v.barrelColor});
  const wheelMat = new THREE.MeshStandardMaterial({color:0x1c1c1c, flatShading:true});

  const hull = new THREE.Mesh(new THREE.BoxGeometry(4.4,2.2,7), hullMat);
  hull.position.y=1.3; g.add(hull);
  hull.castShadow = true;

  const bow = new THREE.Mesh(new THREE.BoxGeometry(4.2,2,1.6), hullMat);
  bow.position.set(0,1.1,4); bow.rotation.x = -0.7; g.add(bow);
  bow.castShadow = true;

  const trimVane = new THREE.Mesh(new THREE.BoxGeometry(3.6,0.1,1), hullMat);
  trimVane.position.set(0,0.5,4.9); trimVane.rotation.x = -0.55; g.add(trimVane);

  for(let i=0;i<6;i++){
    const z = -2.8+i*1.05;
    [-2.3,2.3].forEach(x=>{
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.3,10), wheelMat);
      wheel.rotation.z = Math.PI/2; wheel.position.set(x,0.5,z); g.add(wheel);
      wheel.castShadow = true;
    });
  }

  const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.3,0.9,8), turretMat);
  turret.position.set(0,2.6,1); turret.name='turret'; g.add(turret);
  turret.castShadow = true;

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,4.6,6), barrelMat);
  barrel.rotation.x=Math.PI/2; barrel.position.set(0,0,2.6); turret.add(barrel);
  barrel.castShadow = true;

  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,0.2,8), hullMat);
  hatch.position.set(0.5,0.55,-0.3); turret.add(hatch);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,2.6,5), new THREE.MeshStandardMaterial({color:0x1a1a1a}));
  antenna.position.set(-1.6,1.6,-2); antenna.rotation.z = -0.1; g.add(antenna);

  return g;
}
// M247 Sgt York (friendly): real system was an M48-derived tank chassis
// under a purpose-built twin-40mm turret carrying two separate radars —
// built from the person's reference photo. Reuses buildMBTMesh's hull
// proportions/wheels (same underlying chassis family) but with its own
// wider, flatter turret, twin elevated cannons, and the two radar masts
// that are this system's unmistakable silhouette: a taller rear mast
// carrying the tilted box-shaped search-radar antenna, and a shorter
// front mast carrying the round tracking-radar dome.
function buildSgtYorkMesh(v){
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({color:v.hullColor, flatShading:true});
  const turretMat = new THREE.MeshStandardMaterial({color:v.turretColor, flatShading:true});
  const barrelMat = new THREE.MeshStandardMaterial({color:v.barrelColor});
  const wheelMat = new THREE.MeshStandardMaterial({color:0x1c1c1c, flatShading:true});

  const hull = new THREE.Mesh(new THREE.BoxGeometry(5,3,7), hullMat);
  hull.position.y=1.6; g.add(hull);
  hull.castShadow = true;

  const glacis = new THREE.Mesh(new THREE.BoxGeometry(4.8,2.6,2), hullMat);
  glacis.position.set(0,1.3,4.3); glacis.rotation.x = -0.5; g.add(glacis);
  glacis.castShadow = true;

  [-2.6,2.6].forEach(x=>{
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.3,7.2), hullMat);
    guard.position.set(x,0.9,0); g.add(guard);
    guard.castShadow = true;
  });

  for(let i=0;i<6;i++){
    const z = -3+i*1.2;
    [-2.75,2.75].forEach(x=>{
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.35,10), wheelMat);
      wheel.rotation.z = Math.PI/2; wheel.position.set(x,0.55,z); g.add(wheel);
      wheel.castShadow = true;
    });
  }

  // Turret: wider and flatter than a standard MBT turret — the real
  // system's turret had to be roomy enough for the gun cradle plus the
  // radar/fire-control electronics behind it.
  const turret = new THREE.Mesh(new THREE.BoxGeometry(3.8,1.6,4.4), turretMat);
  turret.position.y=3.7; turret.name='turret'; g.add(turret);
  turret.castShadow = true;

  const mantlet = new THREE.Mesh(new THREE.BoxGeometry(2.6,1.2,1), turretMat);
  mantlet.position.set(0.5,0,2.1); turret.add(mantlet);
  mantlet.castShadow = true;

  // Twin 40mm cannons, side by side and elevated for the anti-air role —
  // the reference photo's most obvious feature.
  [-0.55,0.55].forEach(x=>{
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,5.6,6), barrelMat);
    barrel.rotation.x = Math.PI/2.5; barrel.position.set(x+0.5,0.55,3); turret.add(barrel);
    barrel.castShadow = true;
  });

  // Rear mast + tilted box search-radar antenna — taller of the two masts.
  const rearMast = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,1.7,6), turretMat);
  rearMast.position.set(-0.9,1.65,-1.3); turret.add(rearMast);
  rearMast.castShadow = true;
  const searchRadar = new THREE.Mesh(new THREE.BoxGeometry(1.3,0.16,0.85), turretMat);
  searchRadar.position.set(0,0.95,0); searchRadar.rotation.x = -0.45; rearMast.add(searchRadar);
  searchRadar.castShadow = true;

  // Front mast + round tracking-radar dome — shorter mast, mushroom-shaped
  // cap flaring wide off a narrow stalk.
  const frontMast = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,1.0,6), turretMat);
  frontMast.position.set(0.9,0.8,0.6); turret.add(frontMast);
  frontMast.castShadow = true;
  const domeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.14,0.32,12), turretMat);
  domeCap.position.set(0,0.66,0); frontMast.add(domeCap);
  domeCap.castShadow = true;

  return g;
}
// makeSAM is the shared entry point for all four 'sam' variants — dispatches
// by name to a family-specific mesh builder, same pattern as makeAAA below:
// SA-8 Gecko is a wheeled, amphibious TEL with a flip-up radar dish and two
// triple-tube missile pods; SA-13 Gopher is a small MT-LB-derived light
// tracked chassis with a low turntable carrying paired tube launchers and
// a big flip-up dish on a gimbal (per the reference photo — bigger across
// than the turret itself); SA-11 Gadfly is a larger tracked TELAR with a
// rear tracking dish and four missiles raised together in one tight row
// (per its reference photo); SA-6 Gainful is a tracked chassis carrying
// three large finned missiles on a shared elevating rail. The four real
// systems look nothing alike, so this was worth splitting the way AAA
// already was rather than forcing all of them through one generic
// base+tubes+dish shape.
function makeSAM(variantName){
  const v = pickUnitClass('sam', variantName);
  let g;
  if(v.name.startsWith('SA-8')) g = buildOsaMesh(v);
  else if(v.name.startsWith('SA-13')) g = buildStrela10Mesh(v);
  else if(v.name.startsWith('SA-11')) g = buildBukMesh(v);
  else g = buildKubMesh(v);
  g.userData={type:'sam', className:v.name, hp:v.hp, maxHp:v.hp, fireCd:12, range:v.range, kind:'ground',armored:v.armored,
    interval:v.interval, missileSpeed:v.missileSpeed, dmg:v.dmg, pointsValue:15, turnRate:v.turnRate, radar:v.radar};
  return g;
}
// SA-8 Gecko (9K33 Osa): low, boat-shaped 6x6 wheeled amphibious hull, a
// turntable deck carrying a flip-up search/track radar dish at the front
// (the system's signature feature) flanked by two triple-tube missile pods.
function buildOsaMesh(v){
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({color:v.baseColor, flatShading:true});
  const tubeMat = new THREE.MeshStandardMaterial({color:v.tubeColor});
  const dishMat = new THREE.MeshStandardMaterial({color:v.dishColor});
  const wheelMat = new THREE.MeshStandardMaterial({color:0x1c1c1c, flatShading:true});

  const hull = new THREE.Mesh(new THREE.BoxGeometry(4.4,1.8,7.5), hullMat);
  hull.position.y=1.3; g.add(hull);
  hull.castShadow = true;
  const bow = new THREE.Mesh(new THREE.BoxGeometry(4.2,1.6,1.6), hullMat);
  bow.position.set(0,1.3,4.2); bow.rotation.x=-0.55; g.add(bow);
  bow.castShadow = true;

  // Three wheels per side (6x6 wheeled chassis, unlike the SA-6's tracks).
  for(let i=0;i<3;i++){
    const z=-2.6+i*2.6;
    [-2.1,2.1].forEach(x=>{
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,0.4,10), wheelMat);
      wheel.rotation.z=Math.PI/2; wheel.position.set(x,0.6,z); g.add(wheel);
      wheel.castShadow = true;
    });
  }

  const deck = new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.4,0.6,10), hullMat);
  deck.position.y=2.5; deck.name='turret'; g.add(deck);
  deck.castShadow = true;

  const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,0.3,10), dishMat);
  dish.rotation.x = -0.3; dish.position.set(0,1.4,1.6); deck.add(dish);
  dish.castShadow = true;

  [-1.6,1.6].forEach(side=>{
    for(let i=0;i<3;i++){
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,3.4,8), tubeMat);
      tube.rotation.x = -Math.PI/3;
      tube.position.set(side + (i-1)*0.55, 1.3, -0.4);
      deck.add(tube);
      tube.castShadow = true;
    }
  });

  return g;
}
// SA-6 Gainful (2K12 Kub): taller, boxier tracked amphibious hull
// (PT-76-derived), with a turntable carrying its own small tracking dish
// and three large finned missiles side by side on a shared elevating
// rail — the system's signature look, quite different from the Osa's
// tube pods.
function buildKubMesh(v){
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({color:v.baseColor, flatShading:true});
  const finMat = new THREE.MeshStandardMaterial({color:v.tubeColor, flatShading:true});
  const missileMat = new THREE.MeshStandardMaterial({color:0x8a8a78, flatShading:true});
  const dishMat = new THREE.MeshStandardMaterial({color:v.dishColor});
  const wheelMat = new THREE.MeshStandardMaterial({color:0x1c1c1c, flatShading:true});

  const hull = new THREE.Mesh(new THREE.BoxGeometry(4.6,2.2,7.6), hullMat);
  hull.position.y=1.4; g.add(hull);
  hull.castShadow = true;

  [-2.5,2.5].forEach(x=>{
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.3,7.6), hullMat);
    guard.position.set(x,0.9,0); g.add(guard);
  });
  for(let i=0;i<6;i++){
    const z=-3.1+i*1.25;
    [-2.5,2.5].forEach(x=>{
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.3,10), wheelMat);
      wheel.rotation.z = Math.PI/2; wheel.position.set(x,0.55,z); g.add(wheel);
      wheel.castShadow = true;
    });
  }

  const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.8,0.7,8), hullMat);
  turret.position.y=2.9; turret.name='turret'; g.add(turret);
  turret.castShadow = true;

  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.7,0.7,0.25,10), dishMat);
  dish.position.set(-1.3,0.7,-1.4); turret.add(dish);

  [-1,0,1].forEach(x=>{
    const missile = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.28,5.4,8), missileMat);
    missile.rotation.x = -Math.PI/3.6; missile.position.set(x*0.85,1.6,0.8); turret.add(missile);
    missile.castShadow = true;
    for(let f=0;f<4;f++){
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.05,0.5), finMat);
      fin.rotation.z = f*Math.PI/2;
      fin.position.set(0,0,-2.4);
      missile.add(fin);
    }
  });

  return g;
}
// SA-13 Gopher (9K35 Strela-10): a small MT-LB-derived light tracked
// chassis — noticeably lower and smaller than the Osa/Kub hulls, with six
// closely-spaced small road wheels per side. Carries a low turntable
// (almost flush with the hull roof rather than a tall turret ring) with
// a pair of twin-tube launch pods splayed into a shallow V and raised for
// launch, plus a large dish on a gimbal reclined sharply back — per the
// reference photo, the dish is the dominant feature, wider across than
// the turret itself, not a small sensor ball.
function buildStrela10Mesh(v){
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({color:v.baseColor, flatShading:true});
  const tubeMat = new THREE.MeshStandardMaterial({color:v.tubeColor, flatShading:true});
  const dishMat = new THREE.MeshStandardMaterial({color:v.dishColor, flatShading:true});
  const wheelMat = new THREE.MeshStandardMaterial({color:0x1c1c1c, flatShading:true});

  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2,1.6,6.2), hullMat);
  hull.position.y=0.95; g.add(hull);
  hull.castShadow = true;

  const bow = new THREE.Mesh(new THREE.BoxGeometry(3.0,1.4,1.3), hullMat);
  bow.position.set(0,0.95,3.4); bow.rotation.x=-0.55; g.add(bow);
  bow.castShadow = true;

  // Six small, closely-spaced road wheels per side — MT-LB's tight-packed
  // light-tracked running gear, smaller and more numerous than the
  // Osa/Kub's wheels.
  for(let i=0;i<6;i++){
    const z = -2.4+i*0.95;
    [-1.7,1.7].forEach(x=>{
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.34,0.26,10), wheelMat);
      wheel.rotation.z = Math.PI/2; wheel.position.set(x,0.38,z); g.add(wheel);
      wheel.castShadow = true;
    });
  }

  // Low turntable, sitting almost flush on the hull roof — no tall turret
  // ring, unlike the Osa/Kub.
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.2,0.5,10), hullMat);
  turret.position.y=1.95; turret.name='turret'; g.add(turret);
  turret.castShadow = true;

  // Twin-tube launch pods, splayed into a shallow V and raised at a steep
  // launch angle — Strela-10's distinctive silhouette. Each pod carries a
  // pair of tube caps at its muzzle end so it reads as two tubes rather
  // than one solid box (four missiles total).
  [-0.75,0.75].forEach(side=>{
    const pod = new THREE.Mesh(new THREE.BoxGeometry(0.55,0.55,3.2), tubeMat);
    pod.position.set(side*0.85,0.75,0.2);
    pod.rotation.x = -0.65; pod.rotation.z = side*0.12;
    turret.add(pod);
    pod.castShadow = true;
    [-0.14,0.14].forEach(dx=>{
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,0.3,8), tubeMat);
      cap.rotation.x = Math.PI/2; cap.position.set(dx,0,1.5);
      pod.add(cap);
    });
  });

  // Large dish on a short gimbal post, reclined sharply back between the
  // two launcher pods — bigger across than the turret, matching how it
  // dominates the reference photo's silhouette.
  const gimbal = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.8,6), tubeMat);
  gimbal.position.set(0,0.6,-0.8); turret.add(gimbal);
  gimbal.castShadow = true;
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,0.16,18), dishMat);
  dish.rotation.x = -1.05; dish.position.set(0,0.5,0); gimbal.add(dish);
  dish.castShadow = true;

  return g;
}
// SA-11 Gadfly (9K37 Buk): a larger, boxier tracked TELAR than the Kub —
// taller hull, six wider-spaced road wheels, a boxy turret superstructure
// carrying a small tracking dish at the rear and four large finned
// missiles raised together in one tight row across the launch rail — per
// the reference photo, the missiles sit close together as a single
// cluster rather than split into two widely-separated outboard pairs.
function buildBukMesh(v){
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({color:v.baseColor, flatShading:true});
  const finMat = new THREE.MeshStandardMaterial({color:v.tubeColor, flatShading:true});
  const missileMat = new THREE.MeshStandardMaterial({color:0x9a9a88, flatShading:true});
  const dishMat = new THREE.MeshStandardMaterial({color:v.dishColor});
  const wheelMat = new THREE.MeshStandardMaterial({color:0x1c1c1c, flatShading:true});

  const hull = new THREE.Mesh(new THREE.BoxGeometry(4.8,2.6,8), hullMat);
  hull.position.y=1.6; g.add(hull);
  hull.castShadow = true;

  [-2.6,2.6].forEach(x=>{
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.3,8), hullMat);
    guard.position.set(x,1.0,0); g.add(guard);
  });
  for(let i=0;i<6;i++){
    const z = -3.3+i*1.3;
    [-2.6,2.6].forEach(x=>{
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.46,0.46,0.32,10), wheelMat);
      wheel.rotation.z = Math.PI/2; wheel.position.set(x,0.6,z); g.add(wheel);
      wheel.castShadow = true;
    });
  }

  // Boxy turret superstructure, wide enough to mount the four-missile row.
  const turret = new THREE.Mesh(new THREE.BoxGeometry(3.6,1.3,4.4), hullMat);
  turret.position.y=3.15; turret.name='turret'; g.add(turret);
  turret.castShadow = true;

  // Small tracking dish at the turret rear, tilted up — the target-
  // illumination antenna sits low and behind the launch rail rather than
  // the Kub's larger side dish.
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.75,0.75,0.22,14), dishMat);
  dish.rotation.x = -0.35; dish.position.set(0,0.85,-1.7); turret.add(dish);
  dish.castShadow = true;

  // Four large finned missiles mounted together in one tight row, raised
  // steeply for launch — a single cluster, not two outboard pairs.
  [-1.35,-0.45,0.45,1.35].forEach(x=>{
    const missile = new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.32,5.8,8), missileMat);
    missile.rotation.x = -0.42; missile.position.set(x,1.7,0.6); turret.add(missile);
    missile.castShadow = true;
    for(let f=0;f<4;f++){
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.62,0.05,0.5), finMat);
      fin.rotation.z = f*Math.PI/2;
      fin.position.set(0,0,-2.6);
      missile.add(fin);
    }
  });

  return g;
}
// makeAAA is the shared entry point for all 'aaa' variants — it picks the
// variant, then dispatches to a family-specific mesh builder purely by name
// prefix (no new UNIT_CLASSES field needed): ZSU-30/ZSU-23 are tracked,
// armored self-propelled guns (boxy hull+turret, unchanged from before);
// ZU-23-2/ZU-23-2b are a light gun towed on a two-wheeled trailer; S-60/
// S-60b are rendered as an open four-wheeled buggy-like carriage. All three
// share the same userData shape so nothing downstream (AI, HUD, scoring)
// needs to know which mesh it's looking at.
function makeAAA(variantName){
  const v = pickUnitClass('aaa', variantName);
  let g;
  if(v.name.startsWith('ZU-23')) g = buildZU23Mesh(v);
  else if(v.name.startsWith('S-60')) g = buildS60Mesh(v);
  else g = buildArmoredAAAMesh(v);
  g.userData={type:'aaa', className:v.name, hp:v.hp, maxHp:v.hp, fireCd:7, range:v.range, kind:'ground',armored:v.armored,
    interval:v.interval, projSpeed:v.projSpeed, dmg:v.dmg, pointsValue:15, radar:v.radar};
  return g;
}
// ZSU-30/ZSU-23: tracked, armored self-propelled AA — the original AAA
// mesh, just split out of makeAAA so it's one family among several.
function buildArmoredAAAMesh(v){
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(4,2,4), new THREE.MeshStandardMaterial({color:v.baseColor, flatShading:true}));
  base.position.y=1; g.add(base);
  base.castShadow = true;
  const mount = new THREE.Mesh(new THREE.BoxGeometry(2,1.4,2), new THREE.MeshStandardMaterial({color:v.turretColor}));
  mount.position.y=2.6; mount.name='turret'; g.add(mount);
  mount.castShadow = true;
  const barrelCount = v.barrels || 2;
  for(let i=0;i<barrelCount;i++){
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,4.5,6), new THREE.MeshStandardMaterial({color:v.barrelColor}));
	bar.castShadow = true;
    const spread = barrelCount>2 ? (i/(barrelCount-1)-0.5)*1.2 : (i===0?-0.4:0.4);
    bar.rotation.x=Math.PI/2.3; bar.position.set(spread,0.4,2); mount.add(bar);
  }
  // Radar-equipped variants (ZSU-30, radar:2) get a small dish on the
  // turret rear — the visual tell distinguishing them from the
  // fire-control-only ZSU-23 (radar:1), which stays bare.
  if(v.radar>1){
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.12,10), new THREE.MeshStandardMaterial({color:0x555550}));
    dish.rotation.x = -0.3; dish.position.set(0,0.9,-1.1); mount.add(dish);
    dish.castShadow = true;
  }
  return g;
}
// ZU-23-2: a light twin-barrel gun with no engine of its own — just a gun
// cradle bolted over an axle with two road wheels, and a pair of trail legs
// splayed out behind to brace it when firing, the way a real towed piece
// props itself up instead of relying on a hull's weight.
function buildZU23Mesh(v){
  const g = new THREE.Group();
  const wheelMat = new THREE.MeshStandardMaterial({color:0x1c1c1c, flatShading:true});
  const frameMat = new THREE.MeshStandardMaterial({color:v.baseColor, flatShading:true});
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,3.4,6), frameMat);
  axle.rotation.z = Math.PI/2; axle.position.y=0.9; g.add(axle);
  axle.castShadow = true;
  [-1.9,1.9].forEach(x=>{
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.9,0.5,10), wheelMat);
    wheel.rotation.z = Math.PI/2; wheel.position.set(x,0.9,0); g.add(wheel);
    wheel.castShadow = true;
  });
  [-1,1].forEach(side=>{
    const trail = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,3.2), frameMat);
    trail.position.set(side*0.9,0.55,-2.6); trail.rotation.y = side*0.22; g.add(trail);
    trail.castShadow = true;
  });
  const shield = new THREE.Mesh(new THREE.BoxGeometry(2.6,1.1,0.15), frameMat);
  shield.position.set(0,1.7,0.7); g.add(shield);
  shield.castShadow = true;
  const cradle = new THREE.Mesh(new THREE.BoxGeometry(1.6,0.9,1.4), new THREE.MeshStandardMaterial({color:v.turretColor}));
  cradle.position.y=1.7; cradle.name='turret'; g.add(cradle);
  cradle.castShadow = true;
  const barrelCount = v.barrels || 2;
  for(let i=0;i<barrelCount;i++){
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,4.2,6), new THREE.MeshStandardMaterial({color:v.barrelColor}));
    bar.castShadow = true;
    const spread = barrelCount>2 ? (i/(barrelCount-1)-0.5)*1.0 : (i===0?-0.32:0.32);
    bar.rotation.x=Math.PI/2.3; bar.position.set(spread,0.35,2); cradle.add(bar);
  }
  // ZU-23-2b (radar:1) gets a small mast-mounted antenna box the plain
  // ZU-23-2 (radar:0) lacks — a towed gun has no room for a proper dish,
  // so this reads as an add-on fire-control set rather than a radar dome.
  if(v.radar>0){
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,1.1,5), frameMat);
    mast.position.set(0.9,2.2,-0.2); g.add(mast);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.35,0.25,0.3), new THREE.MeshStandardMaterial({color:0x333330}));
    box.position.set(0.9,2.8,-0.2); g.add(box);
  }
  return g;
}
// S-60: rendered as an open, skeletal four-wheeled carriage — thin struts
// and small wheels at each corner rather than ZU-23's boxy two-wheel
// trailer, closer to a dune-buggy silhouette than a gun. No hull to speak
// of; the gun cradle sits exposed on a central pedestal above the frame.
function buildS60Mesh(v){
  const g = new THREE.Group();
  const wheelMat = new THREE.MeshStandardMaterial({color:0x1c1c1c, flatShading:true});
  const frameMat = new THREE.MeshStandardMaterial({color:v.baseColor, flatShading:true});
  [[-1.6,1.4],[1.6,1.4],[-1.6,-1.4],[1.6,-1.4]].forEach(([x,z])=>{
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,0.35,10), wheelMat);
    wheel.rotation.z = Math.PI/2; wheel.position.set(x,0.6,z); g.add(wheel);
    wheel.castShadow = true;
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,1.3,5), frameMat);
    strut.position.set(x*0.75,0.9,z*0.75);
    strut.rotation.x = z>0?0.3:-0.3; strut.rotation.z = x>0?-0.25:0.25;
    g.add(strut);
    strut.castShadow = true;
  });
  const railGeo = new THREE.BoxGeometry(0.18,0.18,3.6);
  [-1.5,1.5].forEach(x=>{
    const rail = new THREE.Mesh(railGeo, frameMat);
    rail.position.set(x,1.35,0); g.add(rail);
    rail.castShadow = true;
  });
  const crossGeo = new THREE.BoxGeometry(3.3,0.18,0.18);
  [-1.2,1.2].forEach(z=>{
    const cross = new THREE.Mesh(crossGeo, frameMat);
    cross.position.set(0,1.35,z); g.add(cross);
  });
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.4,0.7,6), frameMat);
  pedestal.position.y=1.7; g.add(pedestal);
  pedestal.castShadow = true;
  const cradle = new THREE.Mesh(new THREE.BoxGeometry(1.7,0.7,1.5), new THREE.MeshStandardMaterial({color:v.turretColor}));
  cradle.position.y=2.2; cradle.name='turret'; g.add(cradle);
  cradle.castShadow = true;
  const barrelCount = v.barrels || 2;
  for(let i=0;i<barrelCount;i++){
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,4.6,6), new THREE.MeshStandardMaterial({color:v.barrelColor}));
    bar.castShadow = true;
    const spread = barrelCount>2 ? (i/(barrelCount-1)-0.5)*1.2 : (i===0?-0.38:0.38);
    bar.rotation.x=Math.PI/2.3; bar.position.set(spread,0.4,2.1); cradle.add(bar);
  }
  // S-60b (radar:1) gets the same small mast antenna as ZU-23-2b, mounted
  // off the pedestal rather than the (nonexistent) hull.
  if(v.radar>0){
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,1.3,5), frameMat);
    mast.position.set(1.0,2.4,-0.3); g.add(mast);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.35,0.25,0.3), new THREE.MeshStandardMaterial({color:0x333330}));
    box.position.set(1.0,3.1,-0.3); g.add(box);
  }
  return g;
}
// makeEnemyHeli dispatches to a family builder by name, same pattern as
// makeAAA/makeSAM above. Both real sub-types share the same silhouette
// (buildHindCommon: tandem double-bubble canopy, stub wings with weapon
// pylons, twin engine nacelles, tricycle gear, tail with stabilizer and
// tail rotor, main rotor) — the one thing that actually differs between
// them, and the thing modeled here, is the nose armament: Hind D carries
// a traversable four-barrel Gatling turret, Hind F a fixed twin-barrel
// cannon bolted to the side. That's also this game's visual tell for the
// tougher/faster-reloading Hind F, same idea as the T-74's smoke
// dischargers or the ZSU-30's radar dish.
function makeEnemyHeli(variantName){
  const v = pickUnitClass('heli', variantName);
  const g = v.name.includes('Hind F') ? buildHindFMesh(v) : buildHindDMesh(v);
  g.userData={type:'heli', className:v.name, hp:v.hp, maxHp:v.hp, fireCd:4, range:v.range, kind:'air', armored:false, vy:0, strafeDir:Math.random()<0.5?1:-1,
    dmg:v.dmg, pointsValue:25, grail:v.grail, fireIntervalMin:v.fireIntervalMin, fireIntervalRand:v.fireIntervalRand, flySpeed:v.flySpeed, standoff:v.standoff, cannonArc:v.cannonArc};
  return g;
}
function buildHindCommon(v){
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({color:v.bodyColor, flatShading:true});
  const tailMat = new THREE.MeshStandardMaterial({color:v.tailColor});
  const glassMat = new THREE.MeshStandardMaterial({color:0x1a2a30, transparent:true, opacity:0.75, flatShading:true});
  const darkMat = new THREE.MeshStandardMaterial({color:0x1c1c1c, flatShading:true});

  const body = new THREE.Mesh(new THREE.BoxGeometry(3.8,3.6,8), bodyMat);
  body.position.y = 0.4; g.add(body);
  body.castShadow = true;

  // Tandem "double-bubble" canopy — gunner's lower forward bubble, the
  // pilot's raised bubble just behind and above it. The Hind's single
  // most recognizable feature, and the one thing the old plain box body
  // completely missed.
  const gunnerCanopy = new THREE.Mesh(new THREE.BoxGeometry(2.4,1.3,2.2), glassMat);
  gunnerCanopy.position.set(0,1.6,3.1); g.add(gunnerCanopy);
  const pilotCanopy = new THREE.Mesh(new THREE.BoxGeometry(2.6,1.4,2.0), glassMat);
  pilotCanopy.position.set(0,2.7,1.4); g.add(pilotCanopy);

  // Stub wings with weapon pylons — the other unmistakable Hind feature.
  [-1,1].forEach(side=>{
    const wing = new THREE.Mesh(new THREE.BoxGeometry(3.2,0.4,1.6), bodyMat);
    wing.position.set(side*3,1.2,-0.5); wing.rotation.z = side*-0.12; g.add(wing);
    wing.castShadow = true;
    for(let i=0;i<2;i++){
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,1.4,6), darkMat);
      pylon.rotation.x = Math.PI/2; pylon.position.set(side*(2.2+i*1.5),0.6,-0.5); g.add(pylon);
      pylon.castShadow = true;
    }
  });

  // Twin engine nacelles feeding the main rotor mast.
  [-0.9,0.9].forEach(x=>{
    const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.6,3,8), bodyMat);
    nacelle.rotation.x = Math.PI/2; nacelle.position.set(x,2.3,0.6); g.add(nacelle);
    nacelle.castShadow = true;
  });

  // Tricycle landing gear: single nose wheel forward, two main wheels
  // near the centre of gravity.
  [[-1.6,0.5],[1.6,0.5],[0,3.6]].forEach(([x,z])=>{
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,1.3,5), darkMat);
    strut.position.set(x,0.55,z); g.add(strut);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.32,0.28,8), darkMat);
    wheel.rotation.z = Math.PI/2; wheel.position.set(x,0.05,z); g.add(wheel);
  });

  const tail = new THREE.Mesh(new THREE.BoxGeometry(1.3,1.9,23), tailMat);
  tail.position.set(0,0.4,-14); g.add(tail);
  tail.castShadow = true;

  const stab = new THREE.Mesh(new THREE.BoxGeometry(4.4,0.25,1.1), tailMat);
  stab.position.set(0,0.8,-23); g.add(stab);

  // Small static tail rotor — cosmetic only; updateEnemies spins the main
  // rotor by name, this one just sits there.
  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.08,3.2,0.08), darkMat);
  tailRotor.position.set(0.75,1.4,-25.3); g.add(tailRotor);

  const rotor = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.1,35), new THREE.MeshStandardMaterial({color:0x111}));
  rotor.position.y=3.6; rotor.name='rotor'; g.add(rotor);

  return g;
}
// Hind D: flexible four-barrel Gatling gun in a traversable undernose
// turret ball.
function buildHindDMesh(v){
  const g = buildHindCommon(v);
  const darkMat = new THREE.MeshStandardMaterial({color:0x1c1c1c, flatShading:true});
  const turret = new THREE.Mesh(new THREE.SphereGeometry(0.55,8,8), darkMat);
  turret.position.set(0,0.6,4.3); g.add(turret);
  turret.castShadow = true;
  for(let i=0;i<4;i++){
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,1.1,5), darkMat);
    barrel.rotation.x = Math.PI/2; barrel.position.set((i-1.5)*0.12,0.6,5.1); g.add(barrel);
  }
  return g;
}
// Hind F: fixed twin-barrel 30mm cannon bolted to the starboard side of
// the nose rather than a turret — the real Mi-24P's distinguishing
// feature, and this game's visual tell for the tougher/faster-reload
// variant.
function buildHindFMesh(v){
  const g = buildHindCommon(v);
  const darkMat = new THREE.MeshStandardMaterial({color:0x1c1c1c, flatShading:true});
  const mount = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.5,1.4), darkMat);
  mount.position.set(0.9,1.0,4); g.add(mount);
  mount.castShadow = true;
  [-0.12,0.12].forEach(dx=>{
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,1.6,6), darkMat);
    barrel.rotation.x = Math.PI/2; barrel.position.set(0.9+dx,1.0,5.1); g.add(barrel);
  });
  return g;
}

// A single prone soldier taking cover — torso and legs laid flat low to
// the ground (long axis along local Z), head raised just enough to peek
// up, forearms propped forward under a rifle aimed out ahead. Replaces the
// old standing cylinder-body+sphere-head figure, which read as a man
// standing bolt upright in the open rather than a dug-in squad.
function buildProneSoldier(bodyMat, headMat){
  const s = new THREE.Group();
  const darkMat = new THREE.MeshStandardMaterial({color:0x1c1c1c, flatShading:true});

  // Torso: laid flat, chest end slightly higher than the hips.
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.27,1.3,6), bodyMat);
  torso.rotation.x = Math.PI/2; torso.position.set(0,0.24,-0.1);
  s.add(torso); torso.castShadow = true;

  // Legs: two thinner segments trailing behind the torso, splayed
  // slightly apart at the feet the way a prone stance naturally spreads.
  [-0.13,0.13].forEach(x=>{
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.15,1.15,6), bodyMat);
    leg.rotation.x = Math.PI/2; leg.rotation.z = x<0 ? 0.1 : -0.1;
    leg.position.set(x,0.16,-1.15);
    s.add(leg); leg.castShadow = true;
  });

  // Head: raised just above the shoulders, peering forward.
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19,6,6), headMat);
  head.position.set(0,0.36,0.85);
  s.add(head);

  // Forearms: propped up under the chest, elbows out, hands forward —
  // the classic prone-firing brace.
  [-0.22,0.22].forEach(x=>{
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.1,0.7,5), bodyMat);
    arm.rotation.x = Math.PI/2.3; arm.rotation.z = x<0 ? 0.15 : -0.15;
    arm.position.set(x,0.27,0.55);
    s.add(arm); arm.castShadow = true;
  });

  // Rifle, laid along the aiming line out past the head.
  const rifle = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.035,1.15,5), darkMat);
  rifle.rotation.x = Math.PI/2; rifle.position.set(0,0.33,1.25);
  s.add(rifle);

  return s;
}
function makeInfantry(variantName, classKey='infantry'){
  // A small dug-in squad, represented as one entity — weak individually but
  // numerous, cheap to hit, and a real nuisance at close range. Rendered as
  // several prone figures taking cover (see buildProneSoldier) rather than
  // standing in the open.
  // classKey: see makeTank's comment above — lets this pull from an allied
  // variant table (e.g. 'friendlyinfantry') instead of the enemy default.
  const v = pickUnitClass(classKey, variantName);
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({color:v.bodyColor, flatShading:true});
  const headMat = new THREE.MeshStandardMaterial({color:v.headColor});
  // [x, z, facing] — a wider scatter than the old standing positions,
  // since a prone body is much longer than the old standing cylinder and
  // needs real clearance to avoid overlapping its neighbours; each soldier
  // also faces a slightly different direction so the squad reads as
  // covering an arc rather than four clones aiming the same way.
  [[-2.4,0.3,0.1],[0.3,1.4,-0.35],[2.3,-0.5,0.25],[-0.4,-2.0,-0.15]].forEach(([x,z,facing])=>{
    const soldier = buildProneSoldier(bodyMat, headMat);
    soldier.position.set(x,0,z);
    soldier.rotation.y = facing;
    g.add(soldier);
  });
  g.userData={type:'infantry', className:v.name, hp:v.hp, maxHp:v.hp, fireCd:2, range:v.range, kind:'ground', armored:false,
    dmg:v.dmg, pointsValue:5, fireIntervalMin:v.fireIntervalMin, fireIntervalRand:v.fireIntervalRand, friendly:!!v.friendly, grail:v.grail};
  g.castShadow = true;
  return g;
}
function makeBunker(variantName, classKey='bunker'){
  // A hardened, static casemate — tougher and hits harder than a tank, but never moves.
  // classKey: see makeTank's comment above.
  const v = pickUnitClass(classKey, variantName);
  const g = new THREE.Group();
  const mound = new THREE.Mesh(new THREE.CylinderGeometry(5,6,2.6,8), new THREE.MeshStandardMaterial({color:v.baseColor, flatShading:true}));
  mound.position.y=1.3; g.add(mound);
  mound.castShadow = true;
  const casemate = new THREE.Mesh(new THREE.BoxGeometry(5,2.2,4), new THREE.MeshStandardMaterial({color:v.turretColor, flatShading:true}));
  casemate.position.y=2.6; casemate.name='turret'; g.add(casemate);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,5,6), new THREE.MeshStandardMaterial({color:v.barrelColor}));
  barrel.rotation.x=Math.PI/2; barrel.position.set(0,0,3.2); casemate.add(barrel);
  g.userData={type:'bunker', className:v.name, hp:v.hp, maxHp:v.hp, fireCd:3, range:v.range, kind:'ground', armored:true,
    interval:v.interval, projSpeed:v.projSpeed, dmg:v.dmg, pointsValue:8, friendly:!!v.friendly, grail:v.grail};
  if (mission.theaterIdx==3) v.IR=2; // Highest theater only, bunkers have equivalent of an SA-14 instead with good IR
  return g;
}
// M198: a towed field-gun carriage — two road wheels on an axle, braced
// trail legs behind, and a single long barrel elevated for indirect fire
// (steeper angle than the AAA family's mounts, since this is a howitzer,
// not an anti-air gun). Same general two-wheel-trailer construction as
// buildZU23Mesh, just simpler (no shield/twin barrels) and in an olive-drab
// friendly color rather than picking one up from the variant data.
function makeArtillery(variantName){
  const v = pickUnitClass('artillery', variantName);
  const g = new THREE.Group();
  const wheelMat = new THREE.MeshStandardMaterial({color:0x1c1c1c, flatShading:true});
  const frameMat = new THREE.MeshStandardMaterial({color:0x3a4a2c, flatShading:true});
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,3.2,6), frameMat);
  axle.rotation.z = Math.PI/2; axle.position.y=0.9; g.add(axle);
  axle.castShadow = true;
  [-1.7,1.7].forEach(x=>{
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.85,0.85,0.45,10), wheelMat);
    wheel.rotation.z = Math.PI/2; wheel.position.set(x,0.9,0); g.add(wheel);
    wheel.castShadow = true;
  });
  [-0.8,0.8].forEach(side=>{
    const trail = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,3.6), frameMat);
    trail.position.set(side*0.8,0.55,-2.9); trail.rotation.y = side*0.18; g.add(trail);
    trail.castShadow = true;
  });
  const cradle = new THREE.Mesh(new THREE.BoxGeometry(1.2,0.8,1.6), frameMat);
  cradle.position.y=1.6; cradle.name='turret'; g.add(cradle);
  cradle.castShadow = true;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.2,5.5,8), new THREE.MeshStandardMaterial({color:0x222220}));
  barrel.rotation.x = Math.PI/2.7; barrel.position.set(0,0.7,2.6); cradle.add(barrel);
  barrel.castShadow = true;
  g.userData={type:'artillery', className:v.name, hp:v.hp, maxHp:v.hp, kind:'ground', armored:false, pointsValue:8, friendly:!!v.friendly};
  return g;
}
// Civilian Home: a single small building — whitewashed walls under a
// pyramid-hip roof (a 4-sided cone), deliberately the plainest structure in
// the game since it's just village scenery, not a military target.
function makeCivilianHome(variantName){
  const v = pickUnitClass('civilian', variantName);
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({color:0xc9b08a, flatShading:true});
  const roofMat = new THREE.MeshStandardMaterial({color:0x7a3c28, flatShading:true});
  const walls = new THREE.Mesh(new THREE.BoxGeometry(5,3,6), wallMat);
  walls.position.y=1.5; g.add(walls);
  walls.castShadow = true;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.4,2.4,4), roofMat);
  roof.rotation.y = Math.PI/4; roof.position.y=3+1.2; g.add(roof);
  roof.castShadow = true;
  g.userData={type:'civilian', fugitive:true, className:v.name, hp:v.hp, maxHp:v.hp, kind:'ground', armored:false, pointsValue:5, friendly:!!v.friendly};
  g.castShadow = true;
  return g;
}
// Enemy Helibase: redone as a small, improvised field site rather than one
// blocky "bunker building" — a modest Quonset-style maintenance hangar, a
// couple of small support shacks, scattered field equipment (fuel drums,
// stacked crates, a windsock, a parked utility vehicle), and a shorter
// watchtower, all sized down to read as a forward helicopter strip rather
// than a proper airbase.
// Enemy Helibase: redone as a small, improvised field site rather than one
// blocky "bunker building" — a modest Quonset-style maintenance hangar, a
// couple of small support shacks, scattered field equipment (fuel drums,
// stacked crates, a windsock, a parked utility vehicle), and a shorter
// watchtower, all sized down to read as a forward helicopter strip rather
// than a proper airbase. The 'Airfield' variant additionally gets a short
// paved runway (see addRunway below) — helicopters can still use the same
// pad either way, the runway is just an extra visual tell for that variant.
function makeEnemyHelibase(variantName, pos){
  const v = pickUnitClass('helibase', variantName);
  const g = buildFieldSiteCommon(v, pos);
  if(v.name==='Airfield') addRunway(g);
  g.userData={type:'helibase', className:v.name, hp:v.hp, maxHp:v.hp, kind:'ground',armored:false,pointsValue:20, grail:v.grail};
  g.castShadow = true;
  return g;
}
function buildFieldSiteCommon(v, pos){
  const g = new THREE.Group();
  // Bug fix: every part below is placed with placeOnTerrain(), which reads
  // g.position to work out each part's real world footprint (see that
  // function's comment). A fresh THREE.Group() defaults to (0,0,0), so if
  // we don't set g's real position *before* adding parts, every part gets
  // sampled against the terrain height near the map's (0,0) origin instead
  // of the structure's actual spawn point — the parts still end up in the
  // right place relative to each other, but the whole assembly then gets
  // shifted again when the caller repositions the group afterward, landing
  // it deep underground or high in the air depending on how the two terrain
  // heights differ. Setting position here first (same order buildHelibase()
  // already uses for the friendly version) makes placeOnTerrain's sampling
  // correct from the start. When no pos is given (e.g. model-viewer.html's
  // standalone preview), g simply stays at the origin as before.
  if(pos) g.position.set(pos.x, terrainHeight(pos.x,pos.z), pos.z);
  const metalMat = new THREE.MeshStandardMaterial({color:0x6a6656, flatShading:true, side:THREE.DoubleSide});
  const wallMat = new THREE.MeshStandardMaterial({color:0x4a4638, flatShading:true});
  const darkMat = new THREE.MeshStandardMaterial({color:0x2c2a22, flatShading:true});
  const shackWallMat = new THREE.MeshStandardMaterial({color:0x5c5238, flatShading:true});
  const shackRoofMat = new THREE.MeshStandardMaterial({color:0x3a3628, flatShading:true});
  const drumMat = new THREE.MeshStandardMaterial({color:0x3a3a2c, flatShading:true});
  const crateMat = new THREE.MeshStandardMaterial({color:0x4a4630, flatShading:true});
  const vehicleMat = new THREE.MeshStandardMaterial({color:0x4a5238, flatShading:true});

  // Landing pad: a modest painted circle sized for one or two
  // helicopters, not the old 15-unit airbase-scale ring.
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(8,8,0.15,20), new THREE.MeshStandardMaterial({color:0x4a4238, flatShading:true}));
  const padY = placeOnTerrain(pad, g, 0,-4, 0.15, 0);
  g.add(pad);
  const padRing = new THREE.Mesh(new THREE.RingGeometry(7,7.5,24), new THREE.MeshBasicMaterial({color:0xaa2222, side:THREE.DoubleSide}));
  padRing.rotation.x=-Math.PI/2; padRing.position.set(0, padY+0.09, -4); g.add(padRing);

  // Hangar: low corrugated side walls topped by an open-ended,
  // Quonset-style half-cylinder roof — a field maintenance shed, not a
  // hardened structure. The roof's flat edge sits right on the walls'
  // shared ground height (derived from the left wall's placeOnTerrain
  // result) rather than being independently terrain-placed.
  const hangarWallH = 3, hangarR = 3.6, hangarLen = 11, hx=-22, hz=8;
  const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.15,hangarWallH,hangarLen), wallMat);
  const wallY = placeOnTerrain(wallL, g, hx-hangarR, hz, hangarWallH, 0);
  g.add(wallL); wallL.castShadow = true;
  const hangarGroundY = wallY - hangarWallH/2;
  const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.15,hangarWallH,hangarLen), wallMat);
  wallR.position.set(hx+hangarR, hangarGroundY+hangarWallH/2, hz); g.add(wallR); wallR.castShadow = true;
  const back = new THREE.Mesh(new THREE.BoxGeometry(hangarR*2-0.2,hangarWallH,0.15), wallMat);
  back.position.set(hx, hangarGroundY+hangarWallH/2, hz-hangarLen/2); g.add(back); back.castShadow = true;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(hangarR,hangarR,hangarLen,12,1,true,Math.PI,Math.PI), metalMat);
  roof.rotation.x = Math.PI/2;
  roof.position.set(hx, hangarGroundY+hangarWallH, hz);
  g.add(roof); roof.castShadow = true;

  // Two small support shacks — ready room and fuel/ops shed — plain
  // single-slab-roofed boxes, deliberately the plainest structures here.
  [[8,-2,4,2.4,3.2],[16,6,3.4,2.2,2.8]].forEach(([lx,lz,w,h,d])=>{
    const shackWall = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), shackWallMat);
    const shackY = placeOnTerrain(shackWall, g, lx,lz,h,0);
    g.add(shackWall); shackWall.castShadow = true;
    const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(w+0.4,0.2,d+0.4), shackRoofMat);
    roofSlab.position.set(lx, shackY+h/2+0.1, lz);
    g.add(roofSlab); roofSlab.castShadow = true;
  });

  // Field equipment: a couple of fuel drums and stacked crates — small
  // clutter reading as "equipment" rather than more buildings.
  [[2,14],[3.4,14]].forEach(([lx,lz])=>{
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1.1,10), drumMat);
    placeOnTerrain(drum, g, lx,lz,1.1,0.05);
    g.add(drum); drum.castShadow = true;
  });
  const crateA = new THREE.Mesh(new THREE.BoxGeometry(1.6,1.6,1.6), crateMat);
  placeOnTerrain(crateA, g, -6,16,1.6,0.1);
  g.add(crateA); crateA.castShadow = true;
  const crateB = new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,1.2), crateMat);
  placeOnTerrain(crateB, g, -4.2,17,1.2,0.1);
  g.add(crateB); crateB.castShadow = true;

  // Windsock: a thin pole with a tapered flag — the classic small-airfield
  // tell, and a bit of scale contrast against the hangar.
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,5,6), darkMat);
  const poleY = placeOnTerrain(pole, g, 10,16,5,0);
  g.add(pole); pole.castShadow = true;
  const sock = new THREE.Mesh(new THREE.ConeGeometry(0.3,1.2,8), new THREE.MeshStandardMaterial({color:0xb85a30, flatShading:true}));
  sock.rotation.z = Math.PI/2; sock.position.set(0.7, 2.3, 0); pole.add(sock);

  // Light utility vehicle — a simple flatbed runabout parked off to one
  // side, standing in for base transport/servicing rather than combat armor.
  const vehicle = new THREE.Mesh(new THREE.BoxGeometry(2.2,1.4,4), vehicleMat);
  placeOnTerrain(vehicle, g, 12,-4,1.4,0.4);
  g.add(vehicle); vehicle.castShadow = true;
  [[-0.9,-1.4],[0.9,-1.4],[-0.9,1.4],[0.9,1.4]].forEach(([x,z])=>{
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.3,8), darkMat);
    wheel.rotation.z=Math.PI/2; wheel.position.set(x,-0.7,z); vehicle.add(wheel);
  });

  // Low watchtower — kept, but shorter than the previous version, to fit
  // the smaller field-camp scale requested rather than a full airbase.
  const tower = new THREE.Mesh(new THREE.BoxGeometry(2.4,5,2.4), wallMat);
  const towerY = placeOnTerrain(tower, g, -8,20, 5, 2);
  g.add(tower); tower.castShadow = true;
  const towerCab = new THREE.Mesh(new THREE.BoxGeometry(3.4,1.8,3.4), new THREE.MeshStandardMaterial({color:0x262524, transparent:true, opacity:0.82}));
  towerCab.position.set(-8, towerY+5/2+0.9, 20); g.add(towerCab);
  towerCab.castShadow = true;

  return g;
}
// Airfield-only: a short 100m paved runway off to one side of the field
// site, with a lighter centerline stripe and threshold bars at each end.
// Purely a visual tell for this variant — the existing helipad (built in
// buildFieldSiteCommon above) stays too, since helicopters can land on
// either.
function addRunway(g){
  const pavementMat = new THREE.MeshStandardMaterial({color:0x3c3c3a, flatShading:true});
  const markingMat = new THREE.MeshStandardMaterial({color:0xd8d8c8, flatShading:true});
  const rx=34, rz=8, rLen=100, rWidth=12;

  const runway = new THREE.Mesh(new THREE.BoxGeometry(rWidth,0.12,rLen), pavementMat);
  const runwayY = placeOnTerrain(runway, g, rx, rz, 0.12, 0);
  g.add(runway); runway.castShadow = true;

  // Dashed centerline, evenly spaced down the strip.
  for(let i=0;i<10;i++){
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.02,4), markingMat);
    dash.position.set(rx, runwayY+0.07, rz - rLen/2 + 5 + i*9.5);
    g.add(dash);
  }
  // Threshold bars at each end.
  [-rLen/2+3, rLen/2-3].forEach(dz=>{
    for(let i=-2;i<=2;i++){
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.9,0.02,3), markingMat);
      bar.position.set(rx+i*1.8, runwayY+0.07, rz+dz);
      g.add(bar);
    }
  });
}
function makeEnemyHQ(variantName, pos){
  // Command HQ: a single tall building — deliberately more vertical than
  // any other ground structure (helibase's tallest part is the 8-unit
  // watchtower; this main mass alone is 16) so it reads as "the tall one"
  // from a distance, per the person's ask.
  const v = pickUnitClass('hq', variantName);
  const g = new THREE.Group();
  // Same placeOnTerrain-vs-group.position fix as buildFieldSiteCommon() above.
  if(pos) g.position.set(pos.x, terrainHeight(pos.x,pos.z), pos.z);
  const bldgHeight = 16;
  const bldg = new THREE.Mesh(new THREE.BoxGeometry(12,bldgHeight,12), new THREE.MeshStandardMaterial({color:0x5a5648, flatShading:true}));
  const bldgCenterY = placeOnTerrain(bldg, g, 0,0, bldgHeight, 1);
  g.add(bldg);
  bldg.castShadow = true;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(13,1.2,13), new THREE.MeshStandardMaterial({color:0x3a372c, flatShading:true}));
  roof.position.set(0, bldgCenterY+bldgHeight/2+0.6, 0);
  g.add(roof);
  roof.castShadow = true;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.25,6,6), new THREE.MeshStandardMaterial({color:0x2c2c2c}));
  mast.position.set(3, bldgCenterY+bldgHeight/2+1.2+3, 3.5);
  g.add(mast);
  mast.castShadow = true;
  g.userData={type:'hq', className:v.name, hp:v.hp, maxHp:v.hp, kind:'ground', armored:false, pointsValue:15, grail:v.grail};
  g.castShadow = true;
  return g;
}
function makeEnemyDepot(variantName, pos){
  // Supply depot: a single flat, wide building — deliberately lower/wider
  // than any other ground structure (5 tall against a 24x16 footprint) so
  // it reads as "the flat one" against the HQ's tall one, per the person's ask.
  const v = pickUnitClass('depot', variantName);
  const g = new THREE.Group();
  // Same placeOnTerrain-vs-group.position fix as buildFieldSiteCommon() above.
  if(pos) g.position.set(pos.x, terrainHeight(pos.x,pos.z), pos.z);
  const bldgHeight = 5;
  const bldg = new THREE.Mesh(new THREE.BoxGeometry(24,bldgHeight,16), new THREE.MeshStandardMaterial({color:0x565034, flatShading:true}));
  const bldgCenterY = placeOnTerrain(bldg, g, 0,0, bldgHeight, 1);
  g.add(bldg);
  bldg.castShadow = true;
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(24,0.8,3), new THREE.MeshStandardMaterial({color:0x3a3722, flatShading:true}));
  ridge.position.set(0, bldgCenterY+bldgHeight/2+0.4, 0);
  g.add(ridge);
  ridge.castShadow = true;
  // A couple of stacked crates off to one side — like the parked vehicle
  // beside the helibase, just enough to read as a storage yard rather than
  // a bare box.
  const crateA = new THREE.Mesh(new THREE.BoxGeometry(3,3,3), new THREE.MeshStandardMaterial({color:0x4a4630, flatShading:true}));
  placeOnTerrain(crateA, g, 15,10, 3, 0.5);
  g.add(crateA);
  crateA.castShadow = true;
  const crateB = new THREE.Mesh(new THREE.BoxGeometry(2.4,2.4,2.4), new THREE.MeshStandardMaterial({color:0x4a4630, flatShading:true}));
  placeOnTerrain(crateB, g, 18,7, 2.4, 0.5);
  g.add(crateB);
  crateB.castShadow = true;
  g.userData={type:'depot', className:v.name, hp:v.hp, maxHp:v.hp, kind:'ground', armored:false, pointsValue:15, grail:v.grail};
  g.castShadow = true;
  return g;
}