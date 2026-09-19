/* ============================== UNIT CLASSES ============================== */
// Every broad unit type (tank/sam/aaa/heli/infantry/bunker/helibase/hq/depot/
// friendlybase) can spawn as one of several named sub-classes — e.g. 'aaa'
// covers both a ZSU-23-4 Shilka and a towed ZU-23-2, each with its own HP,
// range, rate of fire, damage, and a slightly different look. The broad
// `type` still drives shared behaviour (movement AI, targeting cone, HUD
// icon, map colour); the specific sub-class (`userData.className`) drives
// that instance's individual stats and is what's shown to the player as the
// unit's name (target box, HUD objective line, debrief).
// `weights` is a per-theater spawn-frequency multiplier: [theater0, theater1,
// theater2, theater3], one entry per THEATERS index. It does two jobs:
//  1. Within a type, pickUnitClass() draws variants proportionally to these
//     numbers — a variant at 0.4 vs a sibling at 0.2 is twice as likely,
//     regardless of how many other variants exist ("which tank do I get").
//  2. Across types, typeWeightSum()/typeDensityScale() add up a type's
//     variants for the theater and use that as an *absolute* frequency for
//     the type as a whole ("how often do tanks show up at all") — see
//     pickWeightedType and typeDensityScale below.
// For (2) to behave as "1.0 = normal, unchanged density", a type's variant
// weights should sum to ~1.0 per theater — that's the convention used for
// every type below (double-check the sum after editing any single value).
// A variant with no `weights` (or 0 for that theater) simply never/rarely
// appears there. Roughly: SE Asia and Central America ("poor weapons")
// favour the cheaper/older variants; Persian Gulf and Western Europe
// (open-terrain armor warfare) favour the tougher, radar-equipped, later
// variants — but each type's *overall* rate stays put unless you deliberately
// push its sum away from 1.0.
const UNIT_CLASSES = {
  // grail:1 grants the SA-7 Grail capability (see GRAIL_MISSILE + the
  // grail-launcher check in updateEnemies) — live as of session 25, works
  // identically regardless of the variant's own type.
  // radar/IR parameters drive jamming and missile guidance — see the radar-
  // jammer and IR-jammer notes in updateEnemies/updateProjectiles.
  tank: [
    {name:'T-72',   longname:'T-72 main battle tanks', hp:50, range:600,  interval:10.0, projSpeed:250, dmg:6, hullColor:0x4a4f3a, turretColor:0x3d4230, barrelColor:0x2c2f22, armored: true, weights:[0.02,0.12,0.50,0.6]},
    {name:'T-74',   longname:'T-74 main battle tanks', hp:65, range:600,  interval:8.5,  projSpeed:250, dmg:6, hullColor:0x4a4f3a, turretColor:0x3d4230, barrelColor:0x2c2f22, armored: true, weights:[0.0,0.08,1.0,1.9]},
    {name:'BMP-2',  longname:'BMP-2 armoured troop carriers',hp:30, range:950,  interval:5.4,  projSpeed:220, dmg:5, hullColor:0x54503a, turretColor:0x45412e, barrelColor:0x332f20, armored: true, grail:1, weights:[0.2,0.35,0.85,0.85]},
  ],
  sam: [
    {name:'SA-13 Gopher', longname:'SA-13 Gopher surface-to-air missile launchers with radar search and guidance',   hp:35, range:5500, interval:12,  missileSpeed:330, dmg:38, turnRate:1.2, baseColor:0x4f5a52, tubeColor:0x282c28, dishColor:0x2e332f, armored: true, radar: 3, IR: 2, weights:[0.0,0.0,0.35,0.06]},
    {name:'SA-11 Gadfly', longname:'SA-11 Gadfly surface-to-air missile launchers with radar search and guidance',   hp:35, range:5500, interval:12,  missileSpeed:330, dmg:36, turnRate:1.2, baseColor:0x4f5a52, tubeColor:0x282c28, dishColor:0x2e332f, armored: true, radar: 3, IR: 1, weights:[0.0,0.0,0.35,0.06]},
    {name:'SA-8 Gecko', longname:'SA-8 Gecko surface-to-air missile launchers with radar search and guidance',   hp:28, range:5000, interval:14,  missileSpeed:250, dmg:34, turnRate:1.2, baseColor:0x4f5a52, tubeColor:0x282c28, dishColor:0x2e332f, armored: true, radar: 2, IR: 1, weights:[0.0,0.0,0.35,0.62]},
    {name:'SA-6 Gainful', longname:'SA-6 Gainful surface-to-air missile launchers with radar search', hp:35, range:4200, interval:18, missileSpeed:250,  dmg:30, turnRate:1.1, baseColor:0x555f4a, tubeColor:0x2c2f22, dishColor:0x333a2c, armored: true, radar: 1, IR: 1, weights:[0.02,0.1,0.4,0.42]},
  ],
  aaa: [
    {name:'ZSU-30', longname:'ZSU-30 anti-aircraft units with radar search and fire control', hp:22, range:5500, interval:4.8, projSpeed:900, projLife:14, dmg:12, barrels:4, baseColor:0x4a4f3a, turretColor:0x3d4230, barrelColor:0x222222, armored: true, radar: 2, weights:[0.0,0.03,0.2,0.38]},
    {name:'ZSU-23',  longname:'ZSU-30 anti-aircraft units with radar fire control', hp:22, range:5500, interval:4.9, projSpeed:800, projLife:11,dmg:12, barrels:4, baseColor:0x4a4f3a, turretColor:0x3d4230, barrelColor:0x222222, armored: true, radar: 1, weights:[0.03,0.06,0.3,0.37]},
    {name:'ZU-23-2', longname:'ZU-23-2 anti-aircraft units', hp:16, range:2200, interval:5.2, projSpeed:600, projLife:8,dmg:7,  barrels:2, baseColor:0x4f4a3a, turretColor:0x3f3a2c, barrelColor:0x1c1c1c, armored: false, radar: 0, weights:[0.15,0.18,0.14,0.05]},
	{name:'ZU-23-2b', longname:'ZU-23-2 anti-aircraft units with radar fire control', hp:16, range:2200, interval:5.2, projSpeed:600, projLife:8, dmg:7,  barrels:2, baseColor:0x4f4a3a, turretColor:0x3f3a2c, barrelColor:0x1c1c1c, armored: false, radar: 1, weights:[0.09,0.12,0.15,0.10]},
	{name:'S-60',    longname:'obsolete 57 mm S-60 anti-aircraft units', hp:12, range:2200, interval:5.2, projSpeed:500, projLife:7,dmg:6,  barrels:2, baseColor:0x4f4a3a, turretColor:0x3f3a2c, barrelColor:0x1c1c1c, armored: false, radar: 0, weights:[0.15,0.16,0.11,0.0]},
	{name:'S-60b',    longname:'57 mm S-60 anti-aircraft units with radar search and fire control', hp:12, range:2200, interval:5.2, projSpeed:500, projLife:7 ,dmg:6,  barrels:2, baseColor:0x4f4a3a, turretColor:0x3f3a2c, barrelColor:0x1c1c1c, armored: false, radar: 1, weights:[0.03,0.06,0.11,0.0]},
  ],
  heli: [
    {name:'Mi-24 Hind F', longname:'Mi-24 Hind model F helicopters',   hp:55, range:1800, dmg:11,armored:false, grail:1, fireIntervalMin:0.9, fireIntervalRand:1.2, flySpeed:32, standoff:400, cannonArc:80, bodyColor:0x505070, tailColor:0x3a3a1c, weights:[0.0,0.0,0.05,0.12]},
    {name:'Mi-24 Hind D', longname:'Mi-24 Hind model D helicopters',  hp:45, range:1600, dmg:9, armored:false, fireIntervalMin:1.1, fireIntervalRand:1.3, flySpeed:32, standoff:400, cannonArc:15, bodyColor:0x202030, tailColor:0x4a1c1c, weights:[0.0,0.2,0.45,0.5]},
  ],
  infantry: [
    {name:'Heavy MG Team', longname:'infantry units equipped with machine guns and SA-7 grail IR missiles', hp:20, range:1150, dmg:6, armored:false, fireIntervalMin:1.6, fireIntervalRand:1.0, bodyColor:0x3a4a2c, headColor:0x322418, grail:1, weights:[0.59,0.70,0.23,0.00]},
	{name:'Heavy MG Team', longname:'infantry units equipped with machine guns and SA-14 grail IR missiles', hp:20, range:1150, dmg:6, armored:false, fireIntervalMin:1.6, fireIntervalRand:1.0, bodyColor:0x3a4a2c, headColor:0x322418, grail:2, weights:[0.0,0.00,0.05,0.30]},
	{name:'Rifle Squad',   longname:'infantry units with rifles', hp:16, range:900,  dmg:4, armored:false, fireIntervalMin:1.0, fireIntervalRand:0.8, bodyColor:0x445a35, headColor:0x3a2a20,          weights:[0.91,1.2,0.42,0.20]},
  ],
  bunker: [
    {name:'Reinforced Bunker', longname:'reinforced bunker emplacements with SA-7 grail IR missiles', hp:65, range:900, interval:2.0, projSpeed:250, dmg:6, armored: true, baseColor:0x6a5433, turretColor:0x3a3628, barrelColor:0x1e1c15, grail:1, weights:[0.3,0.5,0.1,0.05]},
    {name:'Bunker'           , longname:'lightly armoured bunker emplacements', hp:45, range:900, interval:2.0, projSpeed:250, dmg:6, armored: true, baseColor:0x4a4433, turretColor:0x3a3628, barrelColor:0x1e1c15, grail:1, weights:[1.0,0.9,0.0,0.00]},

  ],
  helibase: [
    {name:'Airfield', longname:'airfields', hp:30, grail:1, armored:false, weights:[0.0,0.15,0.15,0.0]},
	{name:'Helibase', longname:'helibases', hp:60, grail:1, armored:false, weights:[0.0,0.0,0.15,0.24]},
  ],
  // HQ and depot: infrastructure similar to helibase (hp/grail/armored/weights),
  hq: [
    {name:'Headquarters', longname:'headquarters buildings', hp:60, grail:1, armored:false, weights:[0.05,0.05,0.05,0.05]},
  ],
  depot: [
    {name:'Depot', longname:'supply depot buildings', hp:45, grail:1, armored:false, weights:[0.05,0.05,0.05,0.05]},
  ],
  friendlybase: [
    {name:'Helibase', longname:'allied helibases', hp:30, friendly:true, armored:false, weights:[1.0,0.4,0.1,0.1]},
  ],
  friendlytank: [
    {name:'M1 Abrams',     longname:'M1 Abrams main battle tanks', hp:50, armored: true, friendly:true, hullColor:0x2a4f1a, turretColor:0x3d4230, barrelColor:0x2c2f22, weights:[0.0,0.0,0.2,0.4]},
	{name:'M2 Bradley',    longname:'M2 Bradley infantry vehicles', hp:30, armored: true, friendly:true, hullColor:0x2a4f1a, turretColor:0x3d4230, barrelColor:0x2c2f22, weights:[0.2,0.2,0.1,0.1]},
	{name:'M247 Sgt York', longname:'M247 Sergeant York anti-aircraft units', hp:30, armored: true, friendly:true, hullColor:0x2a4f1a, turretColor:0x3d4230, barrelColor:0x2c2f22, weights:[5.1,0.1,0.0,0.0]},
	],
  // New (friendly ground scenery, see populateFriendlyTerritory): reuses the
  // makeBunker()/makeInfantry() meshes with allied stats/colors, exactly
  // like friendlytank reuses makeTank(). No range/interval/dmg fields —
  // friendly units never reach updateEnemies' firing branches (see the
  // e.userData.friendly early-return there), so those stats would be dead
  // weight.
  friendlybunker: [
    {name:'Allied Bunker', longname:'lightly armoured bunker emplacements', hp:65, armored: true, friendly:true, baseColor:0x4a5a3a, turretColor:0x3a4a2c, barrelColor:0x1e1c15, weights:[1,1,1,1]},
  ],
  friendlyinfantry: [
    {name:'Allied Infantry', longname:'allied infantry units', hp:20, armored: false, friendly:true, bodyColor:0x3a4a2c, headColor:0x3a2a20, weights:[1,1,1,1]},
  ],
  // New (friendly ground scenery, previously defined but never spawned —
  // added to populateFriendlyTerritory's pool below, per the person's ask).
  // Split into two separate classKeys (rather than one shared 'friendlymisc'
  // bucket) because, unlike friendlytank/friendlybunker/friendlyinfantry,
  // these don't share a mesh/broad-type with anything on the enemy side —
  // each gets its own dedicated mesh builder and userData.type
  // (makeArtillery()/'artillery', makeCivilianHome()/'civilian').
  artillery: [
    {name:'M198', longname:'M198 artillery units', hp:14, armored: false, friendly:true, weights:[0.1,0.12,0.1,0.0]},
  ],
  // Civilian Home's weights are already 0 for theaters 2/3 (Persian Gulf,
  // Western Europe) — per the person's "only found in theaters 0 and 1"
  // ask, so no change needed there, just wiring it up to actually spawn.
  civilian: [
    {name:'Civilian Home', longname:'civilian homes', hp:10, armored: false, friendly:true, weights:[0.12,0.1,0.0,0.0]},
	{name:'Hospital', longname:'hospitals', hp:15, armored: false, friendly:true, weights:[0.08,0.1,0.04,0.01]},
	]
};
