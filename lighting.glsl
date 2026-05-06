#version 150

// A point light with attenuation and ambient component
struct Light {
    vec3 pos;
    float strength;
    float halfDist;
    float ambient;
    vec3 diffuse;
    vec3 specular;
};

// A material with diffuse and specular components and a shininess factor
struct Material {
    vec3 diffuse;
    vec3 specular;
    float shine;
};

// A struct to hold the diffuse and specular components of light falling on a surface
struct LightFall {
    vec3 diffuse;
    vec3 specular;
};

// In-place addition: a += b
void addTo(inout LightFall a, in LightFall b){
    a.diffuse += b.diffuse;
    a.specular += b.specular;
}

// Compute light components falling on surface
LightFall computeLightFall(vec3 pos, vec3 N, vec3 eye, in Light lt, in Material mt){
    vec3 lightDist = lt.pos - pos ;
    float hh = lt.halfDist * lt.halfDist ;
    float atten = lt.strength * hh / (hh + dot (lightDist, lightDist));
    vec3 L = normalize(lightDist);

    // diffuse
    float d = max(dot(N, L), 0.);
    d += lt.ambient;

    // specular
    vec3 V = normalize(eye - pos);
    vec3 H = normalize(L + V);
    float s = pow(max(dot(N, H), 0.), mt.shine);

    LightFall fall;
    fall.diffuse = lt.diffuse * (d * atten);
    fall.specular = lt.specular * (s * atten);
    return fall;
}

// Get final color reflected off material
vec3 lightColor(in LightFall f, in Material mt) {
    return f.diffuse * mt.diffuse + f.specular * mt.specular;
}
