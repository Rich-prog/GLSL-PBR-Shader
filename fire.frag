#version 330 core

in vec2 spriteCoord;
in float vHeight;
in vec4 vColor;

out vec4 fragColor;

void main() {
	float rsqr = dot(spriteCoord, spriteCoord);
	if (rsqr > 1.0) discard;

	// Soft radial falloff
	float w = 0.5;
	float radial = (1.0 - rsqr) * ((w * w) / ((w * w) + rsqr));

	// Fade out toward the tip of the rise
	float heightFade = 1.0 - smoothstep(0.3, 1.0, vHeight);

	float alpha = radial * heightFade;

	// Tint toward dark red at the tip using the mesh color as the base
	vec3 col = mix(vColor.rgb, vec3(0.5, 0.0, 0.0), smoothstep(0.2, 1.0, vHeight));

	fragColor = vec4(col * alpha, alpha);
}
