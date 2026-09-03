import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

document.addEventListener('DOMContentLoaded', () => {
  const starfield = document.getElementById('starfield');
  const starCount = 800; 
  let shadowString = '';

  for (let i = 0; i < starCount; i++) {
    // Distribute stars horizontally across the screen width
    const x = Math.floor(Math.random() * window.innerWidth);
    const y = Math.floor(Math.random() * window.innerHeight); 
    
    shadowString += `${x}px ${y}px #fff`;
    if (i < starCount - 1) shadowString += ', ';
  }

  starfield.style.boxShadow = shadowString;
});

let modPlayer;

document.querySelector('.transparent-overlay').addEventListener('click', () => {
  if (modPlayer) {
    return;
  }

  modPlayer = new ScripTracker();
  modPlayer.on(ScripTracker.Events.playerReady, (player) => {
    player.play();
  });
  modPlayer.loadModule("./music/pow_-_wonderful_life.mod");
  play();

});

function play() {
  // run animation on text to turn it 3d, so disable the text, and enable the 3d model, and run the animation
  const button = document.getElementById('shader-text');
  button.style.display = 'none';
  // run the animation
  const modelContainer = document.getElementById('model-container');
  modelContainer.style.display = 'block';
  // load 3d model using three.js (Text.glb)
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const startPosition = new THREE.Vector3(0, 8, 0.1);
  const endPosition = new THREE.Vector3(-5, 3, 6);
  camera.position.copy(startPosition);
  const transitionDuration = 10000;
  const holdDuration = 2000;   
  const animationStart = performance.now();
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0); // Set background to transparent
  renderer.setClearAlpha(0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  modelContainer.appendChild(renderer.domElement);
  const ambientLight = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  directionalLight.position.set(2, 2, 5);
  scene.add(directionalLight);
  const loader = new GLTFLoader();
  const clock = new THREE.Clock();
  let model;
  loader.load('./models/Text.glb', (gltf) => {
    model = gltf.scene;
    model.scale.set(2, 2, 2);

    scene.add(model);

    model.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(model);
    const minX = bounds.min.x;
    const maxX = bounds.max.x;

    model.traverse((object) => {
      if (!object.isMesh) {
        return;
      }

      object.material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uMinX: { value: minX },
          uMaxX: { value: maxX }
        },

        vertexShader: `
          varying vec3 vWorldPosition;

          void main() {
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

            gl_Position = projectionMatrix
              * modelViewMatrix
              * vec4(position, 1.0);
          }
        `,

        fragmentShader: `
          uniform float uTime;
          uniform float uMinX;
          uniform float uMaxX;

          varying vec3 vWorldPosition;

          vec3 hsv2rgb(vec3 color) {
            vec4 values = vec4(
              1.0,
              2.0 / 3.0,
              1.0 / 3.0,
              3.0
            );

            vec3 absolute = abs(
              fract(color.xxx + values.xyz) * 6.0 - values.www
            );

            return color.z * mix(
              values.xxx,
              clamp(absolute - values.xxx, 0.0, 1.0),
              color.y
            );
          }

          void main() {
            float modelWidth = max(uMaxX - uMinX, 0.001);

            // Convert the model's X position into a value from 0 to 1
            float normalizedX =
              (vWorldPosition.x - uMinX) / modelWidth;

            normalizedX = clamp(normalizedX, 0.0, 0.9999);

            // Divide the model into exactly 12 color sections
            float scaledPosition =
              fract(normalizedX + uTime * 0.5) * 12.0;

            float section = floor(scaledPosition);
            float sectionPosition = fract(scaledPosition);

            // Smooth only the edge of each section
            float transition = smoothstep(
              0.85,
              1.0,
              sectionPosition
            );

            float hue = fract((section + transition) / 12.0);

            vec3 rainbow = hsv2rgb(vec3(hue, 0.85, 1.0));

            gl_FragColor = vec4(rainbow, 1.0);
          }
        `
      });
    });

  },
  undefined,
  (error) => {
    console.error('Failed to load model:', error);
  });

function animate() {
  requestAnimationFrame(animate);
  const currentTime = performance.now();
  const elapsed = currentTime - animationStart;
  let easedProgress = 0;

  if (elapsed > holdDuration) {
    const transitionElapsed = elapsed - holdDuration;
    const progress = Math.min(
      transitionElapsed / transitionDuration,
      1
    );

    // Smoothly move after the top-down pause
    easedProgress = 1 - Math.pow(1 - progress, 3);
  }

  camera.position.lerpVectors(
    startPosition,
    endPosition,
    easedProgress
  );

  camera.lookAt(0, 0, 0);
  const time = clock.getElapsedTime();
  model.traverse((object) => {
    if (object.isMesh && object.material.uniforms) {
      object.material.uniforms.uTime.value = time;
    }
  });
  renderer.render(scene, camera);
}

animate();
}