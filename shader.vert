#version 150
// Vertex program
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

in vec4 position;
in vec3 normal;
in vec3 color;
in vec2 texcoord;

out vec3 vposition;
out vec3 vnormal;
out vec3 vcolor;
out vec2 vtexcoord;

void main () {
	vcolor = color;
	vtexcoord = texcoord;
	vnormal = mat3(modelMatrix) * normal;
	vposition = (modelMatrix * position).xyz;
	gl_Position = projectionMatrix * viewMatrix * vec4(vposition, 1.);
}
