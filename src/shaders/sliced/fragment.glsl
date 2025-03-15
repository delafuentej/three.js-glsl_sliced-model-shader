uniform float uSliceStart;
uniform float uSliceArc;

varying vec3 vPosition;


void main(){
    // float uSliceStart = 1.0;
    // float uSliceArc = 1.5;

    float angle = atan(vPosition.y, vPosition.x); // arc targent angle
    angle -= uSliceStart;//we are going to rotate the angle  so that its 0  is where the slicing should start
    angle = mod(angle, PI2); // PI2 = PI * 2 => only positive values from 0  to "2 * Pi"

    // we can compare uSliceStart, uSliceArc and angle
    if( angle > 0.0 && angle < uSliceArc) discard;

    //pathMap.csm_Slice from script.js
    float csm_Slice;
    //to test if the backside ba precedding gl_FrontFacing:
    //if(!gl_FrontFacing) csm_FragColor = vec4(0.75, 0.15, 0.3, 1.0); but we cannot fix that from fragment.glsl, so we have to 
    //inject our own shader chunks into a CustomShaderMaterial instance using patchMap

    //csm_FragColor = vec4(vPosition, 1.0);
   // csm_FragColor = vec4(vec3(angle), 1.0);
}