#version 330 core

uniform mat4 modelViewProjectionMatrix;
uniform mat4 cameraMatrix;
uniform float time;
uniform float fireStrength;

in vec4 position;
in vec4 color;
layout(location = 4) in vec4 params; // x=phase, y=speed, z=wobble, w=radius

out vec2 spriteCoord;
out float vHeight;
out vec4 vColor;

void main() {
	float phase  = params.x;
	float speed  = 0.05 + params.y * 0.4;
	float wobble = params.z * 3.0;
	float radius = params.w * (1.0 + fireStrength * 4.0);

	vColor = color;

	vec4 pos    = position;
	vec4 offset = vec4(0.);

	switch (gl_VertexID % 4) {
	case 0: spriteCoord = vec2(-1., -1.); offset.x = -radius; offset.y = -radius; break;
	case 1: spriteCoord = vec2( 1., -1.); offset.x =  radius; offset.y = -radius; break;
	case 2: spriteCoord = vec2( 1.,  1.); offset.x =  radius; offset.y =  radius; break;
	case 3: spriteCoord = vec2(-1.,  1.); offset.x = -radius; offset.y =  radius; break;
	}

	offset = cameraMatrix * offset;
	pos += offset;

	// Time-based rise factor, looping from 0 to 1
	float rise = mod((time * speed) + phase, 1);

	// Rise outward from sphere centre
	vec3 riseDir = normalize(position.xyz);
	//pos.xyz += riseDir * rise * 0.4;

	// Rise upward
	pos.y += rise * (1.0 + fireStrength) * 2.0;

	// Wobble perpendicular to the rise direction
	vec3 perp = normalize(cross(riseDir, vec3(0.0, 1.0, 0.0) + riseDir * 0.001));
	pos.xyz += perp * sin(time * wobble + phase * 6.2831) * rise * 0.04;

	vHeight = rise;

	gl_Position = modelViewProjectionMatrix * pos;
}
