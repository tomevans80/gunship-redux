/* ============================== IN-GAME USER GUIDE ==============================
   - MANUAL_PAGE_COUNT is n, the number of pages. Change it freely.
   - Page 1 is the controls list, written directly in the HTML (#manual-page-1).
   - Pages 2..n are built from MANUAL_PAGES below: MANUAL_PAGES[2] is page 2,
     and so on. Each entry is {heading, html}; `html` is ordinary HTML (use <p>
     for paragraphs, <b> for amber highlights). A page with no entry gets a
     placeholder, so raising MANUAL_PAGE_COUNT never breaks anything.
   Navigation: PREV / NEXT buttons, or the left / right arrow keys while the
   manual is open. Opening the manual always starts at page 1. */
const MANUAL_PAGE_COUNT = 9;
const MANUAL_PAGES = {
  2: {
    heading: 'Weapons Guide 1',
    html: `<div class='m-heading'><i>30 mm chain gun</i></div>
           <p>This is an all-purpose short to medium range cannon, which fires armour-piercing High Explosive Dual Purpose rounds. 
		   The gun is aimed automatically by the <b>TADS target system</b> and not manually.</p>
		   <p>When firing straight ahead, the cannon is effective at under 700 m but has a chance of hitting at up to 1500 m. 
		   When firing to the side, deflection in fast flight makes it much less accurate.</p>
		   <div class='m-heading'><i>AGM-114 Hellfires</i></div>
           <p>These are laser-guided missiles, highly damaging, but only to <b>armoured vehicles</b> and <b>bunkers</b>.
		   Once launched, the missile locks onto the breakup point of the TADS laser guidance beam and flies towards it.</p>
		   <p>The target must remain selected in the <b>TADS target system</b> throughout its flight. 
		   If fired against unarmoured targets or aerial targets, it will generally be ineffective at 
		   destroying the target, but may cause general damage and confusion.</p>
		   `
  },
  3: { heading:'Weapons Guide 2', html:`<div class='m-heading'><i>FFAR rockets</i></div>
		   <p>Unguided rockets, notoriously inaccurate and best fired in salvos of 2-3. 
		   They are effective from an upper limit of 2 km, but only cause significant damage to unarmoured vehicles, 
		   infantry, and infrastructure such as helibases and HQs.</p>
		   <p>A rocket landing nearby may stun a target temporarily.</p>
		   <div class='m-heading'><i>AIM-9L Sidewinder</i></div>
		   <p>A highly feared air-to-air missile that hugely outclasses the Soviet-built Vympel and equivalents. 
		   It can home via thermal infrared from any direction and is highly effective against helicopters.</p>
		   <p>The missile is fire-and-forget, so the target does not need to remain locked by TADS. 
		   The missile cannot home on ground targets.</p>`
		   },
  4: { heading:'Opposing air defences 1', html:`<div class='m-heading'><i>ZU-23 and S-60 class AA guns</i></div>
		    <p>These towed 23mm and 57mm AA guns present a serious threat. The basic models lack radar, but the downside is they don't warn you first.</p>
			<p>If your warning light is tripped first in Southeast Asia or Central America, it may be an upgraded version with radar fire control.</p>
			<p>All operators can still aim manually if the radar is jammed, so don't get complacent if the red light goes out</p>
			<div class='m-heading'><i>Armoured ZSU class AA guns</i></div>
			<p>These are moderately armoured tanks that hunt skyward with deadly explosive projectiles.
			They have radar search and fire control and will track you until you're down.</p>
			<p>If you see one, get low and finish it off fast before it does the same to you.</p>
			<p>ZSU class weapons have more advanced optically aimed backup systems if jammed or decoyed, so will need to be dealt with more forcefully.</p>
			`
		   },
   5: { heading:'Opposing air defences 2', html:`<div class='m-heading'><i>SA-6 and SA-8 SAMs</i></div>
		    <p>SA-6 'Gainful' and SA-8 'Gecko' surface-to-air missiles are in use by Soviet-armed states such as the 
			Baathist Iraqi forces and the more advanced forces in Nicaragua. They have radar search and tracking and infrared guidance of missiles.
			If jammed both types can switch to optical search backup but lack the ability to visually guide the missile itself.</p>
			<div class='m-heading'><i>SA-11 and SA-13 SAMs</i></div>
			<p>The more advanced successors to the above codenamed by NATO Gadfly and Gopher, you will encounter these in the Middle East and 
			Western Europe theatres.</p>
			<p>Immune to standard jamming, they can only be decoyed with chaff and flares. The missiles can be guided by either radar or IR and have 
			a tighter turn radius than their older counterparts.</p>
			`
   },
   6: { heading:'Other opposing units', html:`<div class='m-heading'><i>Tanks and armoured vehicles</i></div>
		    <p>Soviet-supplied states are equipped with T-72, or the better protected T-74, main battle tanks. These pose little risk to you
			but may aim their secondary cannons in your direction if you pass close.</p>
			<p>BMP-2 armoured personnel carriers are equipped with shoulder-mounted SA-11 Grail missiles, with IR-homing,
			so pose a potentially greater threat.</p>
			<div class='m-heading'><i>Bunkers and infantry</i></div>
			<p>Infantry rifle fire is generally not a serious threat, but the better-equipped units carry Grails or even the upgraded SA-14 Gremlin missiles.</p>
			<div class='m-heading'><i>HQs, Helibases, and Depots</i></div>
			<p>These are often fitted with light machine guns or Grail missiles as improvised defences.</p>
			<p>They may take several cannon rounds or FFAR salvos to destroy.</p>`
   },
   7: { heading:'Opposing helicopters', html:`<div class='m-heading'><i>Mi-24 Hind model D</i></div>
		    <p>Outside Southeast Asia, you will encounter airborne opposition.</p>
			<p>A Hind on your tail is possibly the worst situation to be in. The D-type Mi-24s carry heavy cannons, although they lack
			the precice aiming of your fire-control system. They are also more restricted in firing to the sides.</p>
			<p>If you get a Hind approaching, break hard to the sides and get him in front of you. If possible use Sidewinders as these
			represent your biggest advantage.</p>
			<div class='m-heading'><i>Mi-24 model F</i></div>
			<p>These are rumoured to be even more terrifying to meet.</p>
			<p>They have faster, heavier cannons, and lack the restricted zone of fire of the model D.</p>
			<p>It's possible some better-fitted model Fs could even carry missiles, but this is unconfirmed.</p>`
   },
   8: { heading:'Helicopter systems 1', html:`<div class='m-heading'><i>Hull integrity</i></div>
		    <p>This measures the structure of you aircraft. If it fails, your aircraft is destroyed in flight.</p>
			<div class='m-heading'><i>Engines</i></div>
		    <p>Without engine power, your craft cannot remain in the air. A damaged engine produced less power to the rotor, leading to less potential lift.</p>
			<p>If one engine fails, the other can run at 110% for an hour to compensate.</p>
			<div class='m-heading'><i>Rotor</i></div>
		    <p>If your rotor is damaged, the craft will become hard to control and you may also lose lift as the blades become inefficient.</p>
			<p>A destroyed rotor means the helicopter will crash.</p>
			<div class='m-heading'><i>Chain gun</i></div>
		    <p>A damaged chain gun can no longer fire as accurately. You will need to be closer to the target for it to be effective.</p>
			<div class='m-heading'><i>Fuel tanks</i></div>
		    <p>A damaged fuel tank will leak fuel, shortening your flight range, and could lead to you being forced down off field.</p>
			`		
   },
   9: { heading:'Helicopter systems 2', html:`<div class='m-heading'><i>Forward Avionics</i></div>
		    <p>This comprises the aircraft's sensors such as radar altitude, airspeed, as well as the engine status computers.</p>
			<div class='m-heading'><i>Aft Avionics</i></div>
			<p>The aft avionics include your radar and IR warning lights, and the jammers. If they are too damaged, these systems will be unavailable.</p>
			<div class='m-heading'><i>Nose Optics</i></div>
			<p>This is the TADS targeting system's camera and rangefinder. If damaged, TADS will be less effective at longer ranges. If it's destroyed, you will be unable to select targets.</p>
			<div class='m-heading'><i>Chaff and flare launchers</i></div>
			<p>If these are damaged badly, you will be unable to launch countermeasures.</p>
			<div class='m-heading'><i>Tail rotor</i></div>
			<p>This keeps your aircraft stable in the yaw axis. If it's damaged, the craft will tend to yaw, and be difficult to keep flying straight.</p>
			`		
   },

};