// medals-data.js — vector art for the decorations system (see the "MEDALS &
// DECORATIONS" block in the main script, above renderMedalStrip(), for the
// award logic this feeds). Loaded as a classic script, NOT type="module" —
// deliberately, so it keeps working over file:// like the rest of this
// project (see the storageWrite/storageRead fallback comment for why that
// constraint exists here). Everything below is plain global functions/consts.
//
// Two layers, both procedural rather than hand-traced, so a new medal is a
// few numbers/colors, never new path art:
//   - MEDAL_RIBBONS + ribbonSVG(): the small ribbon-bar strip shown on the
//     debrief screen right now — just stripe-color arrays.
//   - PENDANT_ICONS + pendantSVG(): a bigger, more distinct medallion for
//     each award, built from simple parametric shapes (star/cross/hex/
//     heart), used by the DECORATIONS screen (populateDecorationsScreen()
//     in the main script).
//
// Colors below are stylized approximations inspired by the real ribbons'
// look (broad stripe pattern/palette), not exact reproductions of the
// regulated designs — accurate enough to read as "that kind of medal" at a
// glance, which is all a 20px debrief slot (or even a 64px pendant) needs.

/* ============================== RIBBON BARS ============================== */
const MEDAL_RIBBONS = {
  commendation: ['#3b7032','#dddddd','#3b7032','#3b7032','#3b7032','#dddddd','#3b7032'],
  bronze:       ['#c9302c','#c9302c','#c9302c','#ffffff','#002868','#ffffff','#c9302c','#c9302c','#c9302c'],
  silver:       ['#002868','#002868','#ffffff','#c9302c','#ffffff','#002868','#002868'],
  dsc:          ['#c9302c','#cccccc','#002868','#002868','#002868','#002868','#002868','#002868','#cccccc','#c9302c'],
  moh:          ['#5ba3d0','#ffffff','#5ba3d0','#ffffff','#5ba3d0','#ffffff','#5ba3d0'],
  airmedal:     ['#00ace6','#8c7853','#00ace6'],
  purpleheart:  ['#dddddd','#5b2a86','#5b2a86','#5b2a86','#5b2a86','#dddddd'],
  // 'ribbon' (theater ribbon) has no fixed entry — it's tinted per-theater
  // at render time, see ribbonStripesFor() below.
};

function ribbonRectsMarkup(stripes, w, h){
  const sw = w/stripes.length;
  return stripes.map((c,i)=>
    `<rect x="${(i*sw).toFixed(2)}" y="0" width="${sw.toFixed(2)}" height="${h}" fill="${c}"/>`
  ).join('');
}

// Faint alternating dark/light horizontal bands over a ribbon's full
// width/height, meant to be drawn on top of ribbonRectsMarkup's stripe
// colors (same local coordinate space) to suggest ribbed fabric texture —
// see the tapered ribbon in pendantSVG() below.
function ribbonRibbingMarkup(w, h, lineCount){
  lineCount = lineCount || 16;
  const lh = h/lineCount;
  let out='';
  for(let i=0;i<lineCount;i++){
    out += `<rect x="0" y="${(i*lh).toFixed(2)}" width="${w.toFixed(2)}" height="${(lh*0.5).toFixed(2)}" fill="${i%2===0?'#000000':'#ffffff'}" opacity="0.08"/>`;
  }
  return out;
}

// Resolves the stripe array for a given medal record — handles the one
// medal (the theater ribbon) whose colors aren't fixed data but derived
// from THEATERS[theaterIdx].tint (already defined in the main script;
// referenced here only at call time, well after it's loaded, so load order
// between the two scripts doesn't matter).
function ribbonStripesFor(type, theaterIdx){
  if(type==='ribbon' && theaterIdx!=null && typeof THEATERS!=='undefined'){
    const hex = '#' + THEATERS[theaterIdx].tint.toString(16).padStart(6,'0');
    return [hex, '#ffffff', hex];
  }
  return MEDAL_RIBBONS[type] || ['#888888'];
}

// Small ribbon-bar SVG for the debrief strip slots (~20x12 viewBox, scales
// to whatever size the .medal-slot CSS gives it).
function ribbonSVG(type, theaterIdx){
  const stripes = ribbonStripesFor(type, theaterIdx);
  return `<svg viewBox="0 0 20 12" preserveAspectRatio="none">${ribbonRectsMarkup(stripes,20,12)}</svg>`;
}

/* ============================== PENDANT ICONS ============================== */
// Shape primitives — all just points/params, no traced paths, so every
// pendant below is a handful of numbers. Point strings for <polygon>;
// HEART_PATH is the one fixed path (a standard compact heart curve, ~90
// bytes — cheap enough not to bother generating parametrically).
// Arr variants return [[x,y],...] pairs (unrounded) instead of an SVG
// points string. The 2D functions below just format an Arr call's output;
// the 3D mesh section further down (search MESH ICONS) uses the Arr
// versions directly to build THREE.Shape outlines — so both the flat SVG
// icons and the worn-on-pilot meshes come from the exact same point math,
// never two hand-kept copies of a star/cross/hex outline.
function starPointsArr(cx,cy,outerR,innerR,points,rotationDeg){
  const rot=(rotationDeg??-90)*Math.PI/180, step=Math.PI/points, pts=[];
  for(let i=0;i<points*2;i++){
    const r = i%2===0 ? outerR : innerR, a = rot+i*step;
    pts.push([cx+r*Math.cos(a), cy+r*Math.sin(a)]);
  }
  return pts;
}
function crossPointsArr(cx,cy,armLen,armWidth){
  const a=armWidth/2, L=armLen;
  return [[cx-a,cy-L],[cx+a,cy-L],[cx+a,cy-a],[cx+L,cy-a],[cx+L,cy+a],[cx+a,cy+a],
          [cx+a,cy+L],[cx-a,cy+L],[cx-a,cy+a],[cx-L,cy+a],[cx-L,cy-a],[cx-a,cy-a]];
}
function hexPointsArr(cx,cy,r,rotationDeg){
  const rot=(rotationDeg??-90)*Math.PI/180, pts=[];
  for(let i=0;i<6;i++){ const a=rot+i*(Math.PI/3); pts.push([cx+r*Math.cos(a), cy+r*Math.sin(a)]); }
  return pts;
}
function starPoints(cx,cy,outerR,innerR,points,rotationDeg){
  return starPointsArr(cx,cy,outerR,innerR,points,rotationDeg)
    .map(p=>p[0].toFixed(2)+','+p[1].toFixed(2)).join(' ');
}
function crossPoints(cx,cy,armLen,armWidth){
  return crossPointsArr(cx,cy,armLen,armWidth)
    .map(p=>p[0].toFixed(2)+','+p[1].toFixed(2)).join(' ');
}
function hexPoints(cx,cy,r,rotationDeg){
  return hexPointsArr(cx,cy,r,rotationDeg)
    .map(p=>p[0].toFixed(2)+','+p[1].toFixed(2)).join(' ');
}
const HEART_PATH = 'M12 21s-8-4.6-8-10.7A5.3 5.3 0 0 1 12 6.4a5.3 5.3 0 0 1 8 3.9C20 16.4 12 21 12 21z';

/* ============================== SHADING HELPERS ============================== */
// Blends a plain 6-digit hex color toward white (amt>0) or black (amt<0),
// amt in 0..1. Used to derive a metallic gradient's highlight/shadow stops
// from each medal's single base color, so PENDANT_ICONS only needs to keep
// one color per medal, not a light/dark pair. Anything that isn't a plain
// 6-digit hex (e.g. the 8-digit '#00000055' alpha accent on the bronze
// star) is returned unchanged, since blending an alpha value this way
// doesn't make sense.
function shadeHex(hex, amt){
  if(!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const num = parseInt(hex.slice(1), 16);
  let r=(num>>16)&255, g=(num>>8)&255, b=num&255;
  const target = amt<0 ? 0 : 255, p = Math.min(1, Math.abs(amt));
  r = Math.round(r + (target-r)*p);
  g = Math.round(g + (target-g)*p);
  b = Math.round(b + (target-b)*p);
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

// Suffixed onto every generated gradient/clip id so two pendants of the
// same type in the same document (e.g. two Bronze Stars in the decorations
// grid) never collide on a shared id.
let pendantUid = 0;

// Builds a simple 3-stop radial gradient (highlight -> base color -> rim
// shadow) from a single base color, so the medallion body reads as
// pressed metal/enamel instead of a flat fill. Returns {id, defs}: `defs`
// goes inside a <defs> block, `id` goes on the shape's fill as url(#id).
function metallicGradient(colorHex){
  const id = 'pgrad'+(pendantUid++);
  const light = shadeHex(colorHex, 0.5), dark = shadeHex(colorHex, -0.4);
  const defs = `<radialGradient id="${id}" cx="32%" cy="28%" r="80%">`
    + `<stop offset="0%" stop-color="${light}"/>`
    + `<stop offset="55%" stop-color="${colorHex}"/>`
    + `<stop offset="100%" stop-color="${dark}"/>`
    + `</radialGradient>`;
  return {id, defs};
}

// Arranges small leaf-shaped ellipses in a ring — the Medal of Honor's
// laurel wreath, previously just a plain dashed circle. Each leaf is drawn
// long-axis-vertical (rx = thin radial dimension, ry = leaf length) then
// rotated by its own angle around the ring so the length runs tangentially
// — i.e. NOT `angle + 90`, which points the long axis radially outward
// instead and blows the wreath's footprint well past `r`. Adjacent leaves
// overlap by design (that's what makes it read as a wreath rather than a
// dotted circle), so each gets a thin darker stroke — without it, same-
// color overlapping fills merge into one flat ring with no visible leaves
// at all.
function wreathLeaves(cx,cy,r,color,count){
  count = count||18;
  const strokeColor = shadeHex(color,-0.4);
  let out='';
  for(let i=0;i<count;i++){
    const a = (i/count)*Math.PI*2 - Math.PI/2;
    const lx = cx+r*Math.cos(a), ly = cy+r*Math.sin(a);
    const rotDeg = a*180/Math.PI;
    out += `<ellipse cx="${lx.toFixed(2)}" cy="${ly.toFixed(2)}" rx="${(r*0.12).toFixed(2)}" ry="${(r*0.3).toFixed(2)}" fill="${color}" stroke="${strokeColor}" stroke-width="${(r*0.02).toFixed(2)}" transform="rotate(${rotDeg.toFixed(1)} ${lx.toFixed(2)} ${ly.toFixed(2)})"/>`;
  }
  return out;
}

// One descriptor per medal: which shape, which colors. shape:'drape' means
// "no separate medallion body" — the theater ribbon has no distinct pendant
// in real life, just the ribbon itself, so its pendant is just a larger
// drape. Adding a new medal type is one entry here (plus one MEDAL_RIBBONS
// entry above) — pendantSVG() below needs no changes for any of these
// shapes, only for a genuinely new shape category.
const PENDANT_ICONS = {
  commendation: {shape:'hex',     color:'#ca8f32', accent:'#ffb020'},
  bronze:       {shape:'star',    color:'#cd7f32', accent:'#00000055'},
  silver:       {shape:'starstar',color:'#c0c0c0', accent:'#e8e8e8'},
  dsc:          {shape:'cross',   color:'#c47832', accent:'#806040'},
  moh:          {shape:'starinv', color:'#f09f42', wreath:true, wreathColor:'#cd7f32'},
  airmedal:     {shape:'star',    color:'#8c7853', accent:'#ffffff', points:4},
  purpleheart:  {shape:'heart',   color:'#4b0082', accent:'#c9a227'},
  ribbon:       {shape:'drape'},
};

// Bigger medallion-on-ribbon icon for the DECORATIONS screen
// (populateDecorationsScreen() in the main script, via decoration-card).
// Ribbon sits at the TOP as on a real pin/neck ribbon and tapers to a
// point right above a small metal ring, then the medallion below —
// previously the ribbon was a plain drape underneath the medallion with
// no visual link between the two. theaterIdx only matters for the
// 'ribbon' type (see ribbonStripesFor above). Default size bumped 64->88
// to give the extra layers (ring, taper, gradient shading) room to read
// at small sizes.
function pendantSVG(type, theaterIdx, size){
  size = size || 88;
  const icon = PENDANT_ICONS[type];
  if(!icon) return '';
  const stripes = ribbonStripesFor(type, theaterIdx);
  const hangBar = `<rect x="${(size*0.43).toFixed(2)}" y="${(size*0.01).toFixed(2)}" width="${(size*0.14).toFixed(2)}" height="${(size*0.045).toFixed(2)}" fill="#555555"/>`;

  if(icon.shape==='drape'){
    // Ribbon-only award (the theater ribbon) — no medallion to hang, so
    // just a bigger, more detailed ribbon bar: a dark frame plus a
    // diagonal highlight clipped to the bar, for a bit of fabric sheen
    // instead of flat stripes. Stays a flat rectangle (unlike the tapered
    // ribbon below) since real ribbon-only service awards are worn as a
    // flat bar, with no pendant to taper down toward.
    const rw=size*0.66, rh=size*0.46, rx=(size-rw)/2, ry=size*0.24;
    const clipId = 'pclip'+(pendantUid++);
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`
      + `<defs><clipPath id="${clipId}"><rect x="${rx.toFixed(2)}" y="${ry.toFixed(2)}" width="${rw.toFixed(2)}" height="${rh.toFixed(2)}"/></clipPath></defs>`
      + hangBar
      + `<g transform="translate(${rx.toFixed(2)},${ry.toFixed(2)})">${ribbonRectsMarkup(stripes,rw,rh)}</g>`
      + `<g clip-path="url(#${clipId})"><polygon points="${rx.toFixed(2)},${(ry+rh).toFixed(2)} ${(rx+rw*0.4).toFixed(2)},${ry.toFixed(2)} ${(rx+rw*0.62).toFixed(2)},${ry.toFixed(2)} ${(rx+rw*0.22).toFixed(2)},${(ry+rh).toFixed(2)}" fill="#ffffff" opacity="0.16"/></g>`
      + `<rect x="${rx.toFixed(2)}" y="${ry.toFixed(2)}" width="${rw.toFixed(2)}" height="${rh.toFixed(2)}" fill="none" stroke="#000000" stroke-opacity="0.35" stroke-width="${(size*0.012).toFixed(2)}"/>`
      + `</svg>`;
  }

  // Ribbon: a flat rectangular top that tapers down to a single point
  // (a pentagon: 2 rect corners, 2 more where the taper starts, 1 apex),
  // like a real medal's ribbon drape — rather than a flat bar plus a
  // separately-drawn wedge underneath it. The stripe colors and a faint
  // ribbed-fabric texture are both drawn as a plain full-height rectangle
  // and clipped to that pentagon via clipPath, which is simpler than
  // generating a tapering trapezoid per stripe.
  const cx=size/2;
  const ribbonW=size*0.62, ribbonX=(size-ribbonW)/2, ribbonY=size*0.07;
  const ribbonTopH=size*0.13, ribbonTaperH=size*0.16, ribbonFullH=ribbonTopH+ribbonTaperH;
  const apexY = ribbonY+ribbonFullH;
  const ribbonClipId = 'rclip'+(pendantUid++);
  const ribbonClipPoints = `${ribbonX.toFixed(2)},${ribbonY.toFixed(2)} `
    + `${(ribbonX+ribbonW).toFixed(2)},${ribbonY.toFixed(2)} `
    + `${(ribbonX+ribbonW).toFixed(2)},${(ribbonY+ribbonTopH).toFixed(2)} `
    + `${cx.toFixed(2)},${apexY.toFixed(2)} `
    + `${ribbonX.toFixed(2)},${(ribbonY+ribbonTopH).toFixed(2)}`;
  const ribbon = `<defs><clipPath id="${ribbonClipId}"><polygon points="${ribbonClipPoints}"/></clipPath></defs>`
    + `<g clip-path="url(#${ribbonClipId})">`
    + `<g transform="translate(${ribbonX.toFixed(2)},${ribbonY.toFixed(2)})">${ribbonRectsMarkup(stripes,ribbonW,ribbonFullH)}${ribbonRibbingMarkup(ribbonW,ribbonFullH)}</g>`
    + `</g>`
    + `<polygon points="${ribbonClipPoints}" fill="none" stroke="#000000" stroke-opacity="0.3" stroke-width="${(size*0.01).toFixed(2)}"/>`;

  const ringCy = apexY+size*0.03, ringR = size*0.045;
  const ring = `<circle cx="${cx.toFixed(2)}" cy="${ringCy.toFixed(2)}" r="${ringR.toFixed(2)}" fill="none" stroke="#8a8a8a" stroke-width="${(size*0.018).toFixed(2)}"/>`;

  const mcx=cx, mcy=size*0.67, r=size*0.235;
  const grad = metallicGradient(icon.color);
  let body='';
  switch(icon.shape){
    case 'star':
      body = `<polygon points="${starPoints(mcx,mcy,r,r*0.42,icon.points||5,-90)}" fill="url(#${grad.id})" stroke="${shadeHex(icon.color,-0.5)}" stroke-width="${(size*0.012).toFixed(2)}"/>`
           + `<polygon points="${starPoints(mcx,mcy,r*0.55,r*0.23,icon.points||5,-90)}" fill="${icon.accent}" opacity="0.55"/>`;
      break;
    case 'starstar':
      body = `<polygon points="${starPoints(mcx,mcy,r,r*0.42,5,-90)}" fill="none" stroke="url(#${grad.id})" stroke-width="${(size*0.045).toFixed(2)}"/>`
           + `<polygon points="${starPoints(mcx,mcy,r*0.55,r*0.23,5,-90)}" fill="${icon.accent}"/>`;
      break;
    case 'starinv':
      body = (icon.wreath ? wreathLeaves(mcx,mcy,r*1.1,icon.wreathColor,20) : '')
           + `<polygon points="${starPoints(mcx,mcy,r,r*0.42,5,90)}" fill="url(#${grad.id})" stroke="${shadeHex(icon.color,-0.5)}" stroke-width="${(size*0.01).toFixed(2)}"/>`;
      break;
    case 'cross':
      body = `<polygon points="${crossPoints(mcx,mcy,r,r*0.4)}" fill="url(#${grad.id})" stroke="${icon.accent}" stroke-width="${(size*0.02).toFixed(2)}"/>`
           + `<polygon points="${crossPoints(mcx,mcy,r*0.72,r*0.16)}" fill="none" stroke="${shadeHex(icon.color,-0.5)}" stroke-width="${(size*0.008).toFixed(2)}" opacity="0.6"/>`;
      break;
    case 'hex':
      body = `<polygon points="${hexPoints(mcx,mcy,r,-90)}" fill="url(#${grad.id})" stroke="${icon.accent}" stroke-width="${(size*0.022).toFixed(2)}"/>`
           + `<polygon points="${hexPoints(mcx,mcy,r*0.68,-90)}" fill="none" stroke="${shadeHex(icon.color,0.4)}" stroke-width="${(size*0.007).toFixed(2)}" opacity="0.6"/>`;
      break;
    case 'heart': {
      // HEART_PATH's actual bounding box is x:4-20 (center 12), y:5.64-21
      // (center 13.32) — NOT a neat 0-24 box centered on (12,11), which is
      // what the original translate offset assumed. That mismatch pushed
      // the heart down and off-canvas once medallions got bigger; this
      // scale/offset centers the true bbox on (mcx,mcy) instead.
      const hs = r/8.3;
      body = `<path d="${HEART_PATH}" transform="translate(${(mcx-hs*12).toFixed(2)},${(mcy-hs*13.32).toFixed(2)}) scale(${hs.toFixed(3)})" fill="url(#${grad.id})" stroke="${icon.accent}" stroke-width="0.7"/>`;
      break;
    }
    default: body='';
  }

  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`
    + `<defs>${grad.defs}</defs>`
    + hangBar
    + ribbon + ring + body
    + `</svg>`;
}

/* ============================== 3D WORN MESHES ============================== */
// Three.js meshes of the same medals/decorations, sized in meters to sit on
// a pilot rig's chest (matches buildSalutingPilot() in the salute-cutscene
// file: 1 unit = 1 meter, +Y up, +Z toward the camera/front). Two forms,
// matching real uniform conventions:
//   - buildRibbonBarMesh3D() + buildMedalRack3D(): small flat ribbon-only
//     bars in a rack — the everyday "ribbon rack" pinned above a breast
//     pocket. Built from MEDAL_RIBBONS, same stripe data as ribbonSVG().
//   - buildMedalMesh3D(): the full ribbon-drape-and-pendant medal, for a
//     single dress/hero medal (e.g. an MoH on its neck ribbon). Built from
//     PENDANT_ICONS, same shape/color data as pendantSVG(), and follows
//     that function's layout proportions line-for-line (just meters
//     instead of pixels, and Y flipped since SVG grows down, THREE grows
//     up) so the two stay visually consistent as a matched set.
//
// None of this touches the SVG functions above — same source data
// (MEDAL_RIBBONS / PENDANT_ICONS / ribbonStripesFor / starPointsArr etc.),
// two independent renderers.
//
// Example — pinning a rack on buildSalutingPilot()'s rig:
//   const rack = buildMedalRack3D(['bronze','airmedal','commendation'], theaterIdx);
//   rack.position.set(-0.11, 0.54, 0.207); // hips-local: upper-left chest,
//                                          // just off the torso surface
//   hips.add(rack);
// Or for one full dress medal instead of a rack:
//   const medal = buildMedalMesh3D('moh', null);
//   medal.position.set(0, 0.60, 0.20);     // centered, near the collar
//   hips.add(medal);

const MEDAL_MESH_SIZE = 0.085;              // full pendant medal, hang-bar-
                                             // to-hem, meters (~real dress
                                             // medal length)
const RIBBON_BAR_SIZE = {w:0.032, h:0.010}; // everyday ribbon-only bar, m

// Splits an 8-digit '#rrggbbaa' into {color:'#rrggbb', opacity}; a plain
// 6-digit hex (or anything else) passes through at opacity 1. Mirrors what
// shadeHex() skips for the same reason — an alpha channel isn't a color to
// blend, and here it isn't a color to tint either, just a transparency.
function parseHexAlpha(hex){
  if(/^#[0-9a-fA-F]{8}$/.test(hex)){
    return {color: '#'+hex.slice(1,7), opacity: parseInt(hex.slice(7,9),16)/255};
  }
  return {color: hex, opacity: 1};
}

// Cache so multiple medals of the same type (two pilots with the same
// award, or several bars in one rack) share one texture instead of each
// re-drawing an identical canvas.
const _ribbonTexCache = new Map();
// Draws the same stripe pattern ribbonRectsMarkup()/ribbonRibbingMarkup()
// draw in SVG onto a small canvas, as a texture for the 3D ribbon meshes
// below — this is what stands in for per-stripe geometry: one flat mesh
// with a striped map, rather than one thin box per stripe.
function ribbonCanvasTexture(stripes, pxW, pxH){
  pxW = pxW || 48; pxH = pxH || 28;
  const key = stripes.join('|')+'@'+pxW+'x'+pxH;
  if(_ribbonTexCache.has(key)) return _ribbonTexCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = pxW; canvas.height = pxH;
  const ctx = canvas.getContext('2d');
  const sw = pxW/stripes.length;
  stripes.forEach((c,i)=>{ ctx.fillStyle=c; ctx.fillRect(i*sw, 0, sw, pxH); });
  const lineCount=16, lh=pxH/lineCount;         // faint ribbing, same look
  ctx.globalAlpha = 0.08;                       // and opacity as
  for(let i=0;i<lineCount;i++){                 // ribbonRibbingMarkup()
    ctx.fillStyle = i%2===0 ? '#000000' : '#ffffff';
    ctx.fillRect(0, i*lh, pxW, lh*0.5);
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  _ribbonTexCache.set(key, tex);
  return tex;
}

// Builds a THREE.Shape from a flat [[x,y],...] point array in the SAME
// (x, y-grows-down) convention starPointsArr/crossPointsArr/hexPointsArr
// already use for the SVG side — negating y here, once, is the only place
// that convention gets flipped to THREE's y-grows-up.
function shapeFromPtsArr(ptsArr){
  return new THREE.Shape(ptsArr.map(p=>new THREE.Vector2(p[0], -p[1])));
}

// ExtrudeGeometry's default UV generator maps UV straight from each
// vertex's absolute (x,y), not normalized to the shape's own bounding
// box — fine for shapes with roughly unit-sized coordinates, but every
// shape in this file is a few centimeters, so the raw coordinates land
// deep inside 0..1 and a mapped texture (the ribbon stripes) samples one
// near-edge texel for the whole face instead of stretching across it.
// Called right after building an ExtrudeGeometry that needs a texture to
// actually stretch across its face; not needed for the solid-color
// pendant bodies, or for Box/PlaneGeometry (their default UVs are already
// bbox-relative regardless of world scale).
function remapUVsToBoundingBox(geometry){
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  const w = Math.max(bbox.max.x-bbox.min.x, 1e-9), h = Math.max(bbox.max.y-bbox.min.y, 1e-9);
  const pos = geometry.attributes.position, uv = geometry.attributes.uv;
  for(let i=0;i<pos.count;i++){
    uv.setXY(i, (pos.getX(i)-bbox.min.x)/w, (pos.getY(i)-bbox.min.y)/h);
  }
  uv.needsUpdate = true;
}

// Cubic bezier point at t, for heartPointsArr()'s curve sampling.
function _cubicBezierPt(p0,p1,p2,p3,t){
  const mt=1-t, a=mt*mt*mt, b=3*mt*mt*t, c=3*mt*t*t, d=t*t*t;
  return [a*p0[0]+b*p1[0]+c*p2[0]+d*p3[0], a*p0[1]+b*p1[1]+c*p2[1]+d*p3[1]];
}
// A heart, sampled from two symmetric cubic-bezier lobes into a plain
// point array (same shape as starPointsArr()'s output) so it can go
// through the exact same extrude/border-backing path as the polygon
// shapes below. This is an original parametric curve — proportioned to
// read like HEART_PATH above, not a sampling of that path — since the fixed
// HEART_PATH string has no control points to reuse for a 3D outline.
function heartPointsArr(r, segs){
  segs = segs || 10;
  const p0=[0, r*0.9],  p1=[-r*1.35,-r*0.15], p2=[-r*1.05,-r*1.05], p3=[0,-r*0.35];
  const p4=[r*1.05,-r*1.05], p5=[r*1.35,-r*0.15], p6=[0, r*0.9];
  const pts=[];
  for(let i=0;i<=segs;i++) pts.push(_cubicBezierPt(p0,p1,p2,p3, i/segs));
  for(let i=1;i<=segs;i++) pts.push(_cubicBezierPt(p3,p4,p5,p6, i/segs));
  return pts;
}

// Small flattened-sphere "leaves" arranged in a ring, the 3D counterpart
// of wreathLeaves() above — same angle math (count evenly spaced, offset
// -90° to start at the top), rotated by -a rather than +a because the
// leaf's position.y is negated (SVG-down -> THREE-up) but its rotation
// isn't measured in y, so the mirror has to be applied explicitly to keep
// each leaf's long axis tangent to the ring instead of flipping to radial.
function wreathGroup3D(ringR, color, count, depth){
  count = count || 18;
  const mat = new THREE.MeshStandardMaterial({color, flatShading:true, roughness:0.55, metalness:0.15, side:THREE.DoubleSide});
  const leafGeo = new THREE.SphereGeometry(1, 8, 6);
  const g = new THREE.Group();
  for(let i=0;i<count;i++){
    const a = (i/count)*Math.PI*2 - Math.PI/2;
    const leaf = new THREE.Mesh(leafGeo, mat);
    leaf.scale.set(ringR*0.12, ringR*0.3, Math.max(depth*2, 0.001));
    leaf.position.set(ringR*Math.cos(a), -ringR*Math.sin(a), depth*0.15);
    leaf.rotation.z = -a;
    leaf.castShadow = true;
    g.add(leaf);
  }
  return g;
}

// One medallion body (star/cross/hex/heart/etc.), built from PENDANT_ICONS'
// same shape+color data pendantSVG() reads, centered on local (0,0) with
// its face on the +Z side. r matches pendantSVG's `r` (mcx/mcy already
// applied by the caller via group position, same as that function's mcx/
// mcy split). Per-shape accent handling mirrors pendantSVG's switch:
//   - star/starstar: a smaller, second FILLED shape in front — an inner
//     emblem, same as pendantSVG's accent polygon.
//   - cross/hex/heart: pendantSVG only strokes these (a colored outline,
//     no separate fill), which a flat extrude can't do directly — so a
//     slightly larger, same-shape "backing plate" sits just behind the
//     body in the accent color, peeking out at the edges as a border.
//     pendantSVG's second, thinner inner stroke on cross/hex is skipped:
//     it's a faint detail even at 88px, and at few-cm chest scale it
//     wouldn't read at all.
//   - starinv (MoH): no accent in PENDANT_ICONS, just the optional wreath.
function buildPendantBody3D(icon, r, depth){
  const g = new THREE.Group();
  const metalMat = (color, extra) => new THREE.MeshStandardMaterial(
    Object.assign({color, flatShading:true, roughness:0.35, metalness:0.55, side:THREE.DoubleSide}, extra||{}));
  const extrude = (ptsArr, d) => new THREE.ExtrudeGeometry(shapeFromPtsArr(ptsArr), {depth: d==null?depth:d, bevelEnabled:false});
  const borderBacking = (ptsArr, accentHex, grow) => {
    const {color, opacity} = parseHexAlpha(accentHex);
    const grown = ptsArr.map(p=>[p[0]*(grow||1.14), p[1]*(grow||1.14)]);
    const mesh = new THREE.Mesh(extrude(grown, depth*0.7),
      metalMat(color, {transparent: opacity<1, opacity}));
    mesh.position.z = -depth*0.35;
    mesh.castShadow = true;
    return mesh;
  };

  switch(icon.shape){
    case 'star': {
      const body = new THREE.Mesh(extrude(starPointsArr(0,0, r, r*0.42, icon.points||5, -90)), metalMat(icon.color));
      body.castShadow = true;
      g.add(body);
      const {color:aColor, opacity:aOp} = parseHexAlpha(icon.accent);
      const accent = new THREE.Mesh(extrude(starPointsArr(0,0, r*0.55, r*0.23, icon.points||5, -90), depth*0.4),
        metalMat(aColor, {transparent:true, opacity:aOp*0.85, metalness:0.1, roughness:0.6}));
      accent.position.z = depth + 0.0006;
      g.add(accent);
      break;
    }
    case 'starstar': {
      // pendantSVG strokes a star outline (fill:none) for this one — the
      // 3D equivalent is a star-shaped frame: an outer star with a
      // slightly smaller star-shaped hole cut out of it.
      const shape = shapeFromPtsArr(starPointsArr(0,0, r*1.08, r*0.454, 5, -90));
      shape.holes.push(new THREE.Path(starPointsArr(0,0, r*0.92, r*0.386, 5, -90).map(p=>new THREE.Vector2(p[0],-p[1]))));
      const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled:false}), metalMat(icon.color));
      body.castShadow = true;
      g.add(body);
      const accent = new THREE.Mesh(extrude(starPointsArr(0,0, r*0.55, r*0.23, 5, -90), depth*0.4),
        metalMat(icon.accent, {metalness:0.1, roughness:0.6}));
      accent.position.z = depth + 0.0006;
      g.add(accent);
      break;
    }
    case 'starinv': {
      if(icon.wreath) g.add(wreathGroup3D(r*1.1, icon.wreathColor, 20, depth));
      const body = new THREE.Mesh(extrude(starPointsArr(0,0, r, r*0.42, 5, 90)), metalMat(icon.color, {roughness:0.25, metalness:0.75}));
      body.castShadow = true;
      g.add(body);
      break;
    }
    case 'cross': {
      g.add(borderBacking(crossPointsArr(0,0,r,r*0.4), icon.accent, 1.16));
      const body = new THREE.Mesh(extrude(crossPointsArr(0,0, r, r*0.4)), metalMat(icon.color));
      body.castShadow = true;
      g.add(body);
      break;
    }
    case 'hex': {
      g.add(borderBacking(hexPointsArr(0,0,r,-90), icon.accent, 1.14));
      const body = new THREE.Mesh(extrude(hexPointsArr(0,0, r, -90)), metalMat(icon.color));
      body.castShadow = true;
      g.add(body);
      break;
    }
    case 'heart': {
      const pts = heartPointsArr(r);
      g.add(borderBacking(pts, icon.accent, 1.14));
      const body = new THREE.Mesh(extrude(pts), metalMat(icon.color));
      body.castShadow = true;
      g.add(body);
      break;
    }
  }
  return g;
}

// The ribbon drape below a medal's hang bar — either the flat rectangular
// bar a ribbon-only award (theater ribbon) uses, or the tapered pentagon a
// full pendant hangs from. Proportions copied straight from pendantSVG's
// `rw/rh/rx/ry` (flat) and `ribbonW/ribbonY/ribbonTopH/ribbonTaperH` +
// pentagon (tapered) — same fractions of `size`, meters instead of px, y
// negated. Keep the two in sync if either changes: this is deliberately
// not shared code (SVG polygons vs THREE geometry can't be), just shared
// numbers, called out here so a future edit doesn't update one and miss
// the other.
function buildRibbonDrape3D(stripes, size, tapered, depth){
  const tex = ribbonCanvasTexture(stripes);
  const fabricMat = new THREE.MeshStandardMaterial({map:tex, roughness:0.9, metalness:0, side:THREE.DoubleSide});
  const edgeMat = new THREE.MeshStandardMaterial({color:0x000000, roughness:0.9, metalness:0});
  const g = new THREE.Group();

  if(!tapered){
    // Ceremony/theater-ribbon proportions: 80% of the original
    // pendantSVG-matched width (size*0.66), with height set to a 5:2
    // width:height aspect ratio rather than mirroring pendantSVG's
    // rh=size*0.46 — this 3D drape no longer matches the 2D pendant icon's
    // rectangle 1:1, by request. Top edge stays at the same ry=size*0.24
    // down from the top so it still hangs from the same point.
    const rw=size*0.66*0.8, rh=rw*(2/5), ry=size*0.24;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(rw, rh), fabricMat);
    mesh.position.set(0, -(ry+rh/2), depth);
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(rw*1.05, rh*1.08), edgeMat);
    edge.position.set(0, -(ry+rh/2), depth-0.0008);
    g.add(edge, mesh);
    return g;
  }

  // matches pendantSVG's tapered ribbon pentagon: full-width for
  // ribbonTopH, then tapers to a single point on the centerline
  // ribbonTaperH further down.
  const ribbonW=size*0.62, ribbonY=size*0.07;
  const ribbonTopH=size*0.13, ribbonTaperH=size*0.16, ribbonFullH=ribbonTopH+ribbonTaperH;
  const halfW = ribbonW/2;
  const pts = [
    [-halfW, ribbonY], [halfW, ribbonY], [halfW, ribbonY+ribbonTopH],
    [0, ribbonY+ribbonFullH], [-halfW, ribbonY+ribbonTopH],
  ];
  const tapGeo = new THREE.ExtrudeGeometry(shapeFromPtsArr(pts), {depth, bevelEnabled:false});
  remapUVsToBoundingBox(tapGeo);
  const mesh = new THREE.Mesh(tapGeo, fabricMat);
  const edgePts = pts.map(p=>[p[0]*1.08, p[1]-size*0.008]);
  const edge = new THREE.Mesh(new THREE.ExtrudeGeometry(shapeFromPtsArr(edgePts), {depth:depth*0.6, bevelEnabled:false}), edgeMat);
  edge.position.z = -depth*0.3;
  g.add(edge, mesh);
  return g;
}

// The full worn medal: hang bar + ribbon (tapered, or flat for a
// ribbon-only award) + ring + medallion body — same five layers and same
// proportions (as fractions of `size`) as pendantSVG(), just in meters and
// with y negated for THREE's up-is-positive convention. `size` defaults to
// MEDAL_MESH_SIZE; pass PENDANT_ICONS' key as `type`, and theaterIdx only
// matters for type:'ribbon' (see ribbonStripesFor above).
function buildMedalMesh3D(type, theaterIdx, size){
  size = size || MEDAL_MESH_SIZE;
  const icon = PENDANT_ICONS[type];
  const group = new THREE.Group();
  if(!icon) return group;
  const stripes = ribbonStripesFor(type, theaterIdx);
  const depth = size*0.055;

  if(icon.shape === 'drape'){
    // Ribbon-only award (the theater ribbon): no hang bar/clasp above it —
    // real ribbon-only service awards are worn as a flat bar with nothing
    // pinned above, so the metal clasp used for full pendants below is
    // skipped here.
    group.add(buildRibbonDrape3D(stripes, size, false, depth*0.55));
    return group;
  }

  const hangBarMat = new THREE.MeshStandardMaterial({color:0x555555, flatShading:true, roughness:0.5, metalness:0.6});
  const hangBar = new THREE.Mesh(new THREE.BoxGeometry(size*0.14, size*0.045, depth*0.8), hangBarMat);
  hangBar.position.set(0, -(size*0.01+size*0.0225), depth*0.4);
  hangBar.castShadow = true;
  group.add(hangBar);

  group.add(buildRibbonDrape3D(stripes, size, true, depth*0.55));

  const ribbonFullH = size*(0.13+0.16), apexY = size*0.07 + ribbonFullH;
  const ringMat = new THREE.MeshStandardMaterial({color:0x8a8a8a, flatShading:true, roughness:0.4, metalness:0.7});
  const ring = new THREE.Mesh(new THREE.TorusGeometry(size*0.045, size*0.012, 8, 16), ringMat);
  ring.position.set(0, -(apexY+size*0.03), depth*0.3);
  ring.castShadow = true;
  group.add(ring);

  const body = buildPendantBody3D(icon, size*0.235, depth);
  body.position.set(0, -(size*0.67), 0);
  group.add(body);

  return group;
}

// A single flat ribbon-only bar — the everyday "ribbon rack" version of an
// award, no medallion. Same MEDAL_RIBBONS stripe data as ribbonSVG(), at a
// real ribbon bar's rough proportions (~3.2:1) by default via
// RIBBON_BAR_SIZE. Front/back faces get the striped texture; the four
// thin edge faces get a plain dark material instead of a squashed copy of
// the same texture.
function buildRibbonBarMesh3D(type, theaterIdx, w, h, depth){
  const stripes = ribbonStripesFor(type, theaterIdx);
  w = w || RIBBON_BAR_SIZE.w; h = h || RIBBON_BAR_SIZE.h; depth = depth || h*0.35;
  const faceMat = new THREE.MeshStandardMaterial({map: ribbonCanvasTexture(stripes), roughness:0.9, metalness:0});
  const edgeMat = new THREE.MeshStandardMaterial({color:0x14140f, roughness:0.9, metalness:0});
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth),
    [edgeMat, edgeMat, edgeMat, edgeMat, faceMat, faceMat]); // BoxGeometry face order: +x,-x,+y,-y,+z,-z
  mesh.castShadow = true;
  return mesh;
}

// Arranges ribbon bars into a rack — rows of `perRow` (default 3), each
// row centered on its own width same as a real ribbon rack (most-senior
// award top-left, rows filled left-to-right, each row centered rather
// than all left-aligned). Returns a Group whose local origin is the
// top-center of the whole rack; position that origin at the chest mount
// point (see the file-header example above).
function buildMedalRack3D(types, theaterIdx, opts){
  opts = opts || {};
  const w = opts.w || RIBBON_BAR_SIZE.w, h = opts.h || RIBBON_BAR_SIZE.h;
  const gapX = opts.gapX != null ? opts.gapX : w*0.08;
  const gapY = opts.gapY != null ? opts.gapY : h*0.2;
  const perRow = opts.perRow || 3;
  const group = new THREE.Group();
  for(let i=0; i<types.length; i+=perRow){
    const row = types.slice(i, i+perRow), r = i/perRow;
    const rowW = row.length*w + (row.length-1)*gapX;
    row.forEach((type, c)=>{
      const bar = buildRibbonBarMesh3D(type, theaterIdx, w, h);
      bar.position.set(-rowW/2 + w/2 + c*(w+gapX), -r*(h+gapY), 0);
      group.add(bar);
    });
  }
  return group;
}
