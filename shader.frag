#include "lighting.glsl"

//quantize into steps
float quantize(float x, float levels) {
	return floor(x * levels) / levels;
}

// bump map
// applies an offset to the normalized surface normal based on the rate of change in height sampled from a bump map texture.
// https://www.mbsoftworks.sk/tutorials/opengl3/25-bump-mapping/ 
vec3 applyBumpMap(vec3 N, vec3 pos, vec2 uv, sampler2D bumpMap, float strength) {

	//sample height using the r value, assuming heightmap is grayscale. Normal maps will have XYZ -> RGB and won't work with this method
    float height = texture(bumpMap, uv).r;

	//calculate rate of change in both directions
    float dhU = (height - texture(bumpMap, uv + vec2(0.005, 0.0)).r) / 0.01;
    float dhV = (height - texture(bumpMap, uv + vec2(0.0, 0.005)).r) / 0.01;

    vec3 dpx  = dFdx(pos);
    vec3 dpy  = dFdy(pos);
    vec2 duvx = dFdx(uv);
    vec2 duvy = dFdy(uv);

    float det = duvx.x * duvy.y - duvx.y * duvy.x;

    vec3 T = normalize(( duvy.y * dpx - duvx.y * dpy) / det);
    vec3 B = normalize((-duvy.x * dpx + duvx.x * dpy) / det);

    return normalize(N + strength * (dhU * T + dhV * B));
}

vec3 calcReflection ( vec3 I , vec3 N , in sampler2D envirMap ) {
	vec3 rayDir = reflect(I, N);

	// Convert ray direction from Cartesian to polar coords
	float theta = atan (-rayDir.x , -rayDir.z);
	float phi = asin (rayDir.y);

	// Map polar coord to texture coord in the environment map
	const float oneOverPi = 113./355.;
	vec2 uv = vec2 (0.5 + 0.5 * theta * oneOverPi, 0.5 - phi * oneOverPi);

	// Lookup the color from the environment map
	return texture(envirMap , uv).rgb;
}

vec3 calcRefraction ( vec3 I , vec3 N , in sampler2D envirMap, float eta ) {
	// Assuming you have a vec3 rayDir = refract(I, N, eta); calculated above:
	vec3 rayDir = refract(I, N, eta);

	// Convert ray direction from Cartesian to polar coords
	float theta = atan(-rayDir.x, -rayDir.z);
	float phi = asin(rayDir.y);

	// Map polar coord to texture coord in the environment map
	const float oneOverPi = 113. / 355.;
	vec2 uv = vec2(0.5 + 0.5 * theta * oneOverPi, 0.5 - phi * oneOverPi);

	// Lookup the color from the environment map
	return texture(envirMap , uv).rgb;
}

// https://en.wikipedia.org/wiki/Fresnel_equations
float fresnel(float cosTheta, float F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

// LearnOpenGL (n.d.) Normal Mapping. Available at: https://learnopengl.com/Advanced-Lighting/Normal-Mapping (Accessed: 26 April 2026).
vec3 applyNormalMap(vec3 N, vec3 pos, sampler2D normalMap, vec2 uv) {
    // Sample the normal map and remap from [0,1] to [-1,1]
    vec3 mapNormal = texture(normalMap, uv).rgb * 2.0 - 1.0;
    
	// derivatives of position and uv
    vec3 dpx  = dFdx(pos);
    vec3 dpy  = dFdy(pos);
    vec2 duvx = dFdx(uv);
    vec2 duvy = dFdy(uv);

	// tangent (T) 
    float det = duvx.x * duvy.y - duvx.y * duvy.x;
    vec3 T = normalize((duvy.y * dpx - duvx.y * dpy) / det);

    // Gram-Schmidt: orthogonalize https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process
    T = normalize(T - dot(T, N) * N);

	// bitangent (B)
    vec3 B = cross(T,N);

	// Construct TBN matrix going from tangent space to world space
    mat3 TBN = mat3(T, B, N);

    // Transform sampled normal from tangent space to world space
    return normalize(TBN * mapNormal);
}

// Fragment program

uniform vec3 eye; // Camera position in world space
uniform sampler2D tex; // Base texture for the object
uniform float texturing; // 0 = no texturing, 1 = full texturing, can be used to blend between the two
uniform vec3 mtrlDiffuse; // Material properties
uniform vec3 mtrlSpecular; // Specular color of the material
uniform float mtrlShine; // Shininess factor for specular highlights
uniform int shaderMode; // 0 = default, 1 = custom (quantized), can be used to toggle between different shader effects
uniform sampler2D envirMap; // Environment map for reflections/refractions
uniform float F0 = 0.5; // Fresnel reflectance at normal incidence
uniform float reflectivity = 1.0; // 0 = fully transparent, 1 = fully reflective

// Bump / displacement map
uniform sampler2D displacementMap; // heightmap for bump mapping, should be grayscale
uniform int useBumpMap = 0;       // 0 = off, 1 = on
uniform float bumpStrength = 0.05; // increase for stronger effect

// Normal map
uniform sampler2D normalMap; // normal map for per-pixel normals, should be in RGB format where XYZ -> RGB
uniform int useNormalMap = 0; // 0 = off, 1 = on

//lights
#define MAX_LIGHTS 8
uniform int numLights; // Number of active light sources
uniform Light lights[MAX_LIGHTS]; // Array of light sources

in vec3 vposition;
in vec3 vnormal;
in vec3 vcolor;
in vec2 vtexcoord;

out vec4 fragColor;

void main () {
	vec3 pos = vposition;
	vec3 N = normalize(vnormal);

	if (useBumpMap == 1) {
		N = applyBumpMap(N, pos, vtexcoord, displacementMap, bumpStrength);
	}

	if (useNormalMap == 1) {
		N = applyNormalMap(N, pos, normalMap, vtexcoord);
	}

	Material mtrl;
	mtrl.diffuse = mtrlDiffuse;
	mtrl.specular = mtrlSpecular;
	mtrl.shine = mtrlShine;

	float refractiveIndex = 1.333;
	
	//accumulate light
    LightFall totalFall;
    totalFall.diffuse = vec3(0.0);
    totalFall.specular = vec3(0.0);

    for (int i = 0; i < MAX_LIGHTS; ++i) {
        if (i >= numLights) break;
        LightFall fall = computeLightFall(pos, N, eye, lights[i], mtrl);
        totalFall.diffuse += fall.diffuse;
        totalFall.specular += fall.specular;
    }

	//calculate texture colour
	vec3 texColor = mix(vec3(1.), texture(tex, vtexcoord).rgb, texturing);

	vec3 I = - normalize ( eye - pos ) ; // incident ray
	float cosTheta = clamp(dot(-I, N), 0.0, 1.0);

	//blend between transparency and reflectivity using Fresnel effect https://en.wikipedia.org/wiki/Fresnel_equations
	float f = fresnel(cosTheta, F0);

	vec3 surfaceColor = lightColor(totalFall, mtrl);
	vec3 reflectionColor = calcReflection ( I , N , envirMap );
	vec3 refractionColor = calcRefraction ( I, N , envirMap, 1./refractiveIndex ) ;

	//mix the two reflection and refraction
	vec3 col = mix(refractionColor, reflectionColor, f);
	col = surfaceColor + col * reflectivity;
	
	float luminance;

	//toggle between shader modes
	switch (shaderMode) {
		case 0: // DEFAULT: output with alpha
			fragColor = vec4(col * texColor, 1.);
			break;

		case 1: // CUSTOM: quantize
			//subdivide spectrum into levels
			float lightLayers = 3.0;
			float texLayers = 5.0;
			col = vec3(quantize(col.r, lightLayers), quantize(col.g, lightLayers), quantize(col.b, lightLayers));
			texColor = vec3(quantize(texColor.r, texLayers), quantize(texColor.g, texLayers), quantize(texColor.b, texLayers));
			vec3 celCol = col * mtrl.diffuse + totalFall.specular * mtrl.specular;
			fragColor = vec4(celCol * texColor, 1.);
			break;

		default:
			fragColor = vec4(col * texColor, 1.);
	}
}

