/* ============================ PCSS SHADOWS =============================
 * Distance-dependent shadow softening (percentage-closer soft shadows).
 * Stock three.js shadow maps (see the shadow.radius comment in buildScene)
 * only offer a *uniform* blur radius — the same softness everywhere,
 * regardless of how far the shadow-casting geometry is from the surface
 * it's falling on. Real soft shadows (from a sun that isn't a literal
 * point) get softer the further the shadow is thrown from its occluder —
 * sharp where the player is right at the ground, diffuse from altitude.
 *
 * There's no built-in three.js shadow mode for this, so it's done here via
 * material.onBeforeCompile. Originally this targeted the shadowmask_pars_
 * fragment chunk (getShadowMask()) — checked the real r128 source before
 * writing anything, but had the wrong call site on the first pass: that
 * function turns out to be dead code as far as MeshStandardMaterial is
 * concerned (it's some other material's code path). The actual per-light
 * shadow multiply for MeshStandardMaterial is inlined directly inside the
 * lights_fragment_begin chunk's per-directional-light loop:
 *     directLight.color *= ... ? getShadow( directionalShadowMap[i], ... ) : 1.0;
 * (confirmed by fetching every ShaderChunk file from the real r128 tag and
 * grepping each one for an actual getShadowMask() *call*, not just where
 * it's defined — only shadowmask_pars_fragment itself matched). So the
 * fix replaces #include <lights_fragment_begin> instead, with a full,
 * otherwise-verbatim copy of that chunk (point/spot loops untouched, since
 * this game has neither — sun is the only shadow-casting light) and just
 * the one directional-light line swapped to call getShadowPCSS below.
 *
 * IMPORTANT — onBeforeCompile receives the fragment shader BEFORE its
 * #include directives are expanded, so only the literal "#include <...>"
 * lines themselves are safe/reliable .replace() targets — anything
 * *inside* a named chunk isn't there yet to match against. Hence
 * replacing the whole chunk rather than editing the call site directly.
 *
 * sun.shadow.radius is reused as this effect's strength ("light size")
 * knob rather than a fixed blur radius — see its call site in buildScene.
 * SHADOW_CAM_RANGE below (999 = far(1000) - near(1)) must stay in sync
 * with sun.shadow.camera.near/far, since directional-light shadow structs
 * don't expose those to the shader otherwise.
 */
const PCSS_EXTRA_FUNCTIONS = /* glsl */`
#include <shadowmap_pars_fragment>
#ifdef USE_SHADOWMAP
float readShadowDepthPCSS( sampler2D shadowMap, vec2 uv ) {
	return unpackRGBAToDepth( texture2D( shadowMap, uv ) );
}
float getShadowPCSS( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {

	float shadow = 1.0;

	shadowCoord.xyz /= shadowCoord.w;
	shadowCoord.z += shadowBias;

	bvec4 inFrustumVec = bvec4( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
	bool inFrustum = all( inFrustumVec );
	bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );
	bool frustumTest = all( frustumTestVec );

	if ( frustumTest ) {

		vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
		const float SHADOW_CAM_RANGE = 999.0;

		float searchRadiusTexels = 4.0 + shadowRadius * 2.0;
		float blockerSum = 0.0;
		float blockerCount = 0.0;
		for ( int i = 0; i < 16; i ++ ) {
			float angle = 6.28318530718 * ( float( i ) / 16.0 );
			float ring = ( mod( float( i ), 2.0 ) < 0.5 ) ? searchRadiusTexels : searchRadiusTexels * 0.5;
			vec2 offset = vec2( cos( angle ), sin( angle ) ) * ring * texelSize;
			float sampleDepth = readShadowDepthPCSS( shadowMap, shadowCoord.xy + offset );
			if ( sampleDepth < shadowCoord.z ) {
				blockerSum += sampleDepth;
				blockerCount += 1.0;
			}
		}

		if ( blockerCount < 1.0 ) {

			shadow = 1.0;

		} else {

			float avgBlockerDepth = blockerSum / blockerCount;
			float penumbraTexels = clamp( ( shadowCoord.z - avgBlockerDepth ) * SHADOW_CAM_RANGE * shadowRadius * 0.08, 0.0, 24.0 );

			if ( penumbraTexels < 0.6 ) {

				shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );

			} else {

				float dx0 = -texelSize.x * penumbraTexels;
				float dy0 = -texelSize.y * penumbraTexels;
				float dx1 =  texelSize.x * penumbraTexels;
				float dy1 =  texelSize.y * penumbraTexels;
				float dx2 = dx0 * 0.5;
				float dy2 = dy0 * 0.5;
				float dx3 = dx1 * 0.5;
				float dy3 = dy1 * 0.5;

				shadow = (
					texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
					texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
					texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
					texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
					texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
					texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
					texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
					texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
					texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
					texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
					texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
					texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
					texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
					texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
					texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
					texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
					texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
				) * ( 1.0 / 17.0 );

			}

		}

	}

	return shadow;

}
#endif
`;
// Faithful, otherwise-unmodified copy of three.js r128's
// lights_fragment_begin chunk (verified against the real source — see the
// header comment above) with exactly one change: the directional-light
// loop's shadow multiply calls getShadowPCSS instead of getShadow. Point
// and spot light branches are reproduced verbatim and untouched (this game
// has NUM_POINT_LIGHTS === NUM_SPOT_LIGHTS === 0 always, so those #if
// blocks compile out entirely regardless — kept only so this stays
// correct if either is ever added later).
const PCSS_LIGHTS_FRAGMENT_BEGIN_REPLACEMENT = /* glsl */`
GeometricContext geometry;

geometry.position = - vViewPosition;
geometry.normal = normal;
geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );

#ifdef CLEARCOAT

	geometry.clearcoatNormal = clearcoatNormal;

#endif

IncidentLight directLight;

#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )

	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {

		pointLight = pointLights[ i ];

		getPointDirectLightIrradiance( pointLight, geometry, directLight );

		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif

		RE_Direct( directLight, geometry, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )

	SpotLight spotLight;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {

		spotLight = spotLights[ i ];

		getSpotDirectLightIrradiance( spotLight, geometry, directLight );

		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;
		#endif

		RE_Direct( directLight, geometry, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )

	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

		directionalLight = directionalLights[ i ];

		getDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );

		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadowPCSS( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif

		RE_Direct( directLight, geometry, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )

	RectAreaLight rectAreaLight;

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {

		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if defined( RE_IndirectDiffuse )

	vec3 iblIrradiance = vec3( 0.0 );

	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );

	irradiance += getLightProbeIrradiance( lightProbe, geometry );

	#if ( NUM_HEMI_LIGHTS > 0 )

		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {

			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );

		}
		#pragma unroll_loop_end

	#endif

#endif

#if defined( RE_IndirectSpecular )

	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );

#endif
`;