import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import slicedVertexShader from './shaders/sliced/vertex.glsl';
import slicedFragmentShader from './shaders/sliced/fragment.glsl';
import GUI from 'lil-gui';


/**
 * Sliced Model -Main Concepts
 * - to be abble to see how the model is sliced
 * - Enhance a built-in material- MeshStandardMaterial
 * - Not display fragments- not displayin parts of the model
 * - Some trigonometrie
 * 
 * -CUSTOM MATERIAL. We are going to replace the MeshStandardMaterial by Custom Shader Material
 * - We want to apply the slicint only on the Mesh named "outerHzll". So we are going to keep
 *  the defaultmaterial for the other elements of the model
 * - SLICE (Trignometry part):
 * the discard can only be called in  the fragment shader, but it is going to be according to the position, despite we
 * need to send the position from vertex to the fragment.
 *  -Radial Slicing: We want to slice according to the radial coordinates. The model is aligned with the z-axis, we can focus
 * on the "x" and "y" axes. We are going to use a start angle(uSliceStart) and an amplitude angle (uSliceArc) that we call "arc" => DISCARD (not to draw it)
 * we need the current angle of the fragment being drawn => despite we need to calculate the arc targent. if ( start < arc targent < arc) we know that we 
 * need to discard it.  Uniforms from 'uSliceStart' & 'uSliceArc'  to controll it
 * 
 * In our case we are going to rotate the angle  so that its 0  is where the slicing should start
 * Warning: Using modulo on negative numbers can display different behaviour according to the environment
 * 
 * To fix the shadow we create a slicedDepthMaterial
 */

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 325 });
const debugObject = {};

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// Loaders
const rgbeLoader = new RGBELoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./draco/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Environment map
 */
rgbeLoader.load('./industrial_workshop.hdr', (environmentMap) =>{

    
    environmentMap.mapping = THREE.EquirectangularReflectionMapping;

    scene.background = environmentMap;
   // scene.backgroundBlurriness = 0.5;
    scene.environment = environmentMap;
})

/**
 * Sliced model
 */
let gearsModel;

gltfLoader.load('./gears.glb', (gltf)=>{
     gearsModel = gltf.scene;

     gearsModel.traverse((child)=> {
        if(child.isMesh){
            if(child.name === 'outerHull'){
                child.material = slicedMaterial;
                child.customDepthMaterial = slicedDepthMaterial;
            }else{
                child.material = material;
            }
            
            child.castShadow = true;
            child.receiveShadow = true;
        }
     })

    scene.add(gearsModel);

})
// Geometry
//const geometry = new THREE.IcosahedronGeometry(2.5, 5)

// Material
const uniforms = {
    uSliceStart: new THREE.Uniform(1.75),
    uSliceArc: new THREE.Uniform(1.25)
};

//PathMap
const pathMap = {
    csm_Slice: {
        '#include <colorspace_fragment>': `
        #include <colorspace_fragment>

        if(!gl_FrontFacing) gl_FragColor = vec4(0.75, 0.15, 0.3, 1.0);
        
        `
    }
};

gui.add(uniforms.uSliceStart, 'value', -Math.PI, Math.PI, 0.001).name('uSliceStart');
gui.add(uniforms.uSliceArc, 'value', 0, Math.PI * 2, 0.001).name('uSliceArc');
const material = new THREE.MeshStandardMaterial({

    metalness: 0.5,
    roughness: 0.25,
    envMapIntensity: 0.5,
    color: '#858080'
});



const slicedMaterial = new CustomShaderMaterial({
    //Custom Shader Material
    baseMaterial: THREE.MeshStandardMaterial,
    vertexShader: slicedVertexShader,
    fragmentShader: slicedFragmentShader,
    uniforms: uniforms,
    patchMap: pathMap,
    silent: true, //to silence the warnings
    //MeshStandardMaterial
    metalness: 0.5,
    roughness: 0.25,
    envMapIntensity: 0.5,
    color: '#858080',
    side: THREE.DoubleSide,
});

const slicedDepthMaterial = new CustomShaderMaterial({
    //Custom Shader Material
    baseMaterial: THREE.MeshDepthMaterial,
    vertexShader: slicedVertexShader,
    fragmentShader: slicedFragmentShader,
    uniforms: uniforms,
    patchMap: pathMap,
    silent: true, //to silence the warnings
    //MeshDepthMaterial:
   depthPacking: THREE.RGBADepthPacking
});



// Mesh
// const mesh = new THREE.Mesh(geometry, material)
// scene.add(mesh)
/**
 * Model
 */
/**
 * Plane
 */
// const plane = new THREE.Mesh(
//     new THREE.PlaneGeometry(10, 10, 10),
//     new THREE.MeshStandardMaterial({ color: '#aaaaaa' })
// );
// plane.receiveShadow = true;
// plane.position.x = - 4;
// plane.position.y = - 3;
// plane.position.z = - 4;
// plane.lookAt(new THREE.Vector3(0, 0, 0));
// scene.add(plane);

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 4);
directionalLight.position.set(6.25, 3, 4);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 30;
directionalLight.shadow.normalBias = 0.05;
directionalLight.shadow.camera.top = 8;
directionalLight.shadow.camera.right = 8;
directionalLight.shadow.camera.bottom = -8;
directionalLight.shadow.camera.left = -8;
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
};

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(sizes.pixelRatio);
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100);
camera.position.set(-5, 5, 12);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime();

    //update gearsModel
    if(gearsModel) gearsModel.rotation.y = elapsedTime * 0.1;
    
    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
}

tick();