# GLSL-PBR-Shader

## Overview
This project contains GLSL shaders for rendering 3D objects with physically-based rendering PBR techniques.

## Vertex Shader (`shader.vert`)
The vertex shader is responsible for transforming 3D vertex data into the correct position on the screen and passing necessary information to the fragment shader for further processing. Specifically, it:

- Applies model, view, and projection transformations to each vertex position.
- Transforms vertex normals to world space for accurate lighting calculations.
- Passes per-vertex color and texture coordinates to the fragment shader.
- Outputs the transformed position for rasterization.

## Fragment Shader (`shader.frag`)
The fragment shader computes the final color of each pixel based on the PBR lighting model. It takes into account various material properties and lighting conditions to achieve realistic rendering. The shader performs the following operations:

- Calculates the normal, view, and light directions for each fragment.
- Implements the Cook-Torrance BRDF for accurate reflection and refraction based on the material's roughness and metallic properties.
- Combines the contributions from direct lighting, ambient lighting, and any additional light sources to compute the final color output for each pixel.
- Supports multiple light sources and can handle various material types, including metallic and non-metallic surfaces.
- Outputs the final color to the framebuffer for display on the screen.
- Includes support for texture mapping, allowing for detailed surface appearances based on texture images.
- Handles gamma correction to ensure that the rendered colors appear correctly on different display devices.
- Provides options for enabling or disabling certain PBR features, such as normal mapping or ambient occlusion, to allow for performance optimizations based on the specific use case.

- ## Lighting Model ("lighting.glsl")
- The lighting model is implemented in a separate GLSL file, "lighting.glsl", which contains functions for calculating the various components of the PBR lighting model. This modular approach allows for easier maintenance and reuse of the lighting calculations across different shaders or projects. The lighting model includes functions for:
- Calculating the Fresnel effect, which determines how much light is reflected versus refracted based on the viewing angle and material properties.
- Computing the normal distribution function (NDF), which describes how microfacets are distributed on the surface and affects the sharpness of reflections.
- Calculating the geometry function, which accounts for shadowing and masking effects that occur when microfacets block light from reaching the surface or being reflected towards the viewer.
- Combining these components to compute the final BRDF (Bidirectional Reflectance Distribution Function) for each fragment, which is then used to determine the final color output based on the lighting conditions and material properties.

## Usage
To use these shaders in your OpenGL application, you will need to:
1. Compile the vertex and fragment shaders and link them into a shader program.
2. Set up the necessary vertex data (positions, normals, texture coordinates) and pass it to the GPU.
3. Bind the shader program and set any required uniform variables (e.g., transformation matrices, material properties, light parameters) before rendering your 3D objects.
4. Render your objects using the appropriate draw calls, and the shaders will handle the rest of the rendering process to produce visually appealing results based on the PBR techniques implemented in the fragment shader.

## Acknowledgments

This project is based on concepts and functions from:

"Graphics 2 Lecture Notes"  
Dr. Lance Putnam  
Computing, Goldsmiths, University of London  
March 18, 2025

The notes themselves are not included or redistributed here. Please refer to the original course materials for more information.