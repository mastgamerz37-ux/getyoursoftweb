/**
 * GetYourSoft / ANSH AI — 3D Interactive AI Orb & Neural Field
 * Powered by Three.js (r128)
 * 
 * Signature Visual Motif:
 * - 6 Dynamic States: idle, listening, thinking, speaking, warning, locked
 * - Dynamic vertex displacement, chromatic glow, floating particle matrix
 * - Smooth scroll-driven rotation & mouse-tracking parallax
 */

(function () {
  'use strict';

  // Check WebGL availability
  function isWebGLAvailable() {
    try {
      var canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  var container = document.getElementById('hero-orb-canvas');
  if (!container || !window.THREE || !isWebGLAvailable()) {
    console.warn('[ANSH 3D] Three.js or WebGL container not available, falling back gracefully.');
    return;
  }

  // 1. Scene, Camera, Renderer setup
  var scene = new THREE.Scene();
  var width = container.clientWidth || window.innerWidth;
  var height = container.clientHeight || 550;

  var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.z = 6;

  var renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);

  // 2. Color Palettes for States
  var STATES = {
    idle: {
      core: new THREE.Color(0x38bdf8),       // Sky cyan
      glow: new THREE.Color(0x818cf8),       // Indigo / soft purple
      particles: new THREE.Color(0x60a5fa),  // Blue
      speed: 1.0,
      noiseIntensity: 0.12,
      label: 'IDLE (Passive Consciousness)'
    },
    listening: {
      core: new THREE.Color(0x10b981),       // Emerald green
      glow: new THREE.Color(0x34d399),       // Mint green
      particles: new THREE.Color(0x059669),  // Deep emerald
      speed: 1.6,
      noiseIntensity: 0.25,
      label: 'LISTENING (Voice Input Active)'
    },
    thinking: {
      core: new THREE.Color(0x06b6d4),       // Bright cyan
      glow: new THREE.Color(0x3b82f6),       // Electric blue
      particles: new THREE.Color(0x0284c7),  // Azure
      speed: 2.8,
      noiseIntensity: 0.35,
      label: 'THINKING (System 2 Dual-Model Reasoning)'
    },
    speaking: {
      core: new THREE.Color(0xd946ef),       // Magenta
      glow: new THREE.Color(0xec4899),       // Pink
      particles: new THREE.Color(0xa855f7),  // Purple
      speed: 2.2,
      noiseIntensity: 0.45,
      label: 'SPEAKING (Native Zero-Dep Voice Output)'
    },
    warning: {
      core: new THREE.Color(0xf59e0b),       // Amber
      glow: new THREE.Color(0xd97706),       // Deep amber
      particles: new THREE.Color(0xfbbf24),  // Warm gold
      speed: 1.8,
      noiseIntensity: 0.28,
      label: 'WARNING (High-Risk Action Flagged)'
    },
    locked: {
      core: new THREE.Color(0xef4444),       // Crimson red
      glow: new THREE.Color(0xb91c1c),       // Deep red
      particles: new THREE.Color(0xf87171),  // Soft red
      speed: 0.8,
      noiseIntensity: 0.08,
      label: 'LOCKED (ANSH Freeze Biometric Shield)'
    }
  };

  var currentState = 'idle';
  var targetCoreColor = STATES.idle.core.clone();
  var targetGlowColor = STATES.idle.glow.clone();
  var currentSpeed = STATES.idle.speed;
  var currentNoise = STATES.idle.noiseIntensity;

  // 3. Central Core Orb (Icosahedron with Wireframe / Glow)
  var isMobile = window.innerWidth < 768;
  var detail = isMobile ? 3 : 4;
  var geometry = new THREE.IcosahedronGeometry(1.6, detail);
  
  // Store original vertex positions for mathematical deformation
  var originalPositions = geometry.attributes.position.clone();

  // Primary iridescent material
  var orbMaterial = new THREE.MeshPhysicalMaterial({
    color: STATES.idle.core,
    emissive: STATES.idle.glow,
    emissiveIntensity: 0.45,
    roughness: 0.15,
    metalness: 0.85,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    transmission: 0.6,
    opacity: 0.95,
    transparent: true,
    wireframe: false
  });

  var coreOrb = new THREE.Mesh(geometry, orbMaterial);
  scene.add(coreOrb);

  // Outer Wireframe Cage
  var wireframeGeometry = new THREE.IcosahedronGeometry(1.85, isMobile ? 1 : 2);
  var wireframeMaterial = new THREE.MeshBasicMaterial({
    color: STATES.idle.glow,
    wireframe: true,
    transparent: true,
    opacity: 0.28
  });
  var wireframeOrb = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
  scene.add(wireframeOrb);

  // Inner Geometric Nucleus
  var nucleusGeo = new THREE.IcosahedronGeometry(0.85, 1);
  var nucleusMat = new THREE.MeshBasicMaterial({
    color: STATES.idle.core,
    wireframe: true,
    transparent: true,
    opacity: 0.55
  });
  var nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
  scene.add(nucleus);

  // Equatorial Gyroscope Ring
  var ringGeo = new THREE.TorusGeometry(2.1, 0.015, 16, 80);
  var ringMat = new THREE.MeshBasicMaterial({
    color: STATES.idle.core,
    transparent: true,
    opacity: 0.45
  });
  var gyroRing = new THREE.Mesh(ringGeo, ringMat);
  gyroRing.rotation.x = Math.PI / 3;
  scene.add(gyroRing);

  // 4. Surrounding Neural Particle Field
  var particleCount = isMobile ? 350 : 850;
  var particleGeo = new THREE.BufferGeometry();
  var particlePositions = new Float32Array(particleCount * 3);
  var particleScales = new Float32Array(particleCount);

  for (var i = 0; i < particleCount * 3; i += 3) {
    var r = 2.4 + Math.random() * 3.5;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(Math.random() * 2 - 1);

    particlePositions[i] = r * Math.sin(phi) * Math.cos(theta);
    particlePositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
    particlePositions[i + 2] = r * Math.cos(phi);

    particleScales[i / 3] = Math.random() * 1.5 + 0.5;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  
  var particleMaterial = new THREE.PointsMaterial({
    color: STATES.idle.particles,
    size: 0.055,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending
  });

  var particles = new THREE.Points(particleGeo, particleMaterial);
  scene.add(particles);

  // 5. Cinematic Lighting
  var ambientLight = new THREE.AmbientLight(0x0f172a, 1.5);
  scene.add(ambientLight);

  var pointLight1 = new THREE.PointLight(0x38bdf8, 3, 20);
  pointLight1.position.set(4, 4, 4);
  scene.add(pointLight1);

  var pointLight2 = new THREE.PointLight(0x818cf8, 2.5, 20);
  pointLight2.position.set(-4, -3, 3);
  scene.add(pointLight2);

  // 6. Interactive Mouse Tracking & Parallax
  var mouseX = 0;
  var mouseY = 0;
  var targetRotationX = 0;
  var targetRotationY = 0;

  window.addEventListener('mousemove', function (e) {
    var x = (e.clientX / window.innerWidth) * 2 - 1;
    var y = -(e.clientY / window.innerHeight) * 2 + 1;
    mouseX = x * 0.4;
    mouseY = y * 0.4;
  });

  // Scroll reaction
  var scrollY = 0;
  window.addEventListener('scroll', function () {
    scrollY = window.scrollY || window.pageYOffset;
  }, { passive: true });

  // 7. Simplex-like Mathematical Wave Deformation
  function deformVertices(time, speed, intensity) {
    var pos = coreOrb.geometry.attributes.position;
    var orig = originalPositions;
    var count = pos.count;

    for (var i = 0; i < count; i++) {
      var u = orig.getX(i);
      var v = orig.getY(i);
      var w = orig.getZ(i);

      // Spherical harmonic oscillation
      var wave = Math.sin(u * 2.2 + time * speed * 2.5) *
                 Math.cos(v * 2.0 + time * speed * 2.0) *
                 Math.sin(w * 2.5 + time * speed * 1.8);

      var factor = 1 + wave * intensity;

      pos.setXYZ(i, u * factor, v * factor, w * factor);
    }
    pos.needsUpdate = true;
    coreOrb.geometry.computeVertexNormals();
  }

  // 8. Animation Loop
  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    var delta = clock.getDelta();
    var elapsedTime = clock.getElapsedTime();

    // Lerp colors towards current target state
    orbMaterial.color.lerp(targetCoreColor, 0.06);
    orbMaterial.emissive.lerp(targetGlowColor, 0.06);
    wireframeMaterial.color.lerp(targetGlowColor, 0.06);
    particleMaterial.color.lerp(targetCoreColor, 0.06);
    nucleusMat.color.lerp(targetCoreColor, 0.06);
    ringMat.color.lerp(targetGlowColor, 0.06);
    pointLight1.color.lerp(targetCoreColor, 0.06);
    pointLight2.color.lerp(targetGlowColor, 0.06);

    // Dynamic rotation
    targetRotationX = mouseY + scrollY * 0.0008;
    targetRotationY = mouseX + scrollY * 0.0012;

    coreOrb.rotation.y += 0.005 * currentSpeed;
    coreOrb.rotation.x += (targetRotationX - coreOrb.rotation.x) * 0.05;
    coreOrb.rotation.y += (targetRotationY - coreOrb.rotation.y) * 0.05;

    wireframeOrb.rotation.y -= 0.007 * currentSpeed;
    wireframeOrb.rotation.x += 0.004 * currentSpeed;

    particles.rotation.y += 0.0015 * currentSpeed;
    particles.rotation.x -= 0.001 * currentSpeed;

    nucleus.rotation.y += 0.012 * currentSpeed;
    nucleus.rotation.x -= 0.008 * currentSpeed;
    gyroRing.rotation.z += 0.006 * currentSpeed;
    gyroRing.rotation.y += 0.004 * currentSpeed;

    // Pulse scale
    var breathing = 1 + Math.sin(elapsedTime * currentSpeed * 1.8) * 0.045;
    coreOrb.scale.set(breathing, breathing, breathing);

    // Apply vertex deformation
    deformVertices(elapsedTime, currentSpeed, currentNoise);

    renderer.render(scene, camera);
  }

  animate();

  // 9. Resize Handling
  function onWindowResize() {
    if (!container) return;
    var w = container.clientWidth || window.innerWidth;
    var h = container.clientHeight || 550;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onWindowResize);

  // 10. Public API for Switching States
  window.setAnshOrbState = function (stateName) {
    if (!STATES[stateName]) return;
    currentState = stateName;
    var cfg = STATES[stateName];
    targetCoreColor = cfg.core.clone();
    targetGlowColor = cfg.glow.clone();
    currentSpeed = cfg.speed;
    currentNoise = cfg.noiseIntensity;

    // Update state pill indicator in UI if present
    var stateBadge = document.getElementById('orb-state-indicator');
    if (stateBadge) {
      stateBadge.textContent = cfg.label;
      stateBadge.setAttribute('data-state', stateName);
    }

    // Highlight corresponding state button
    var buttons = document.querySelectorAll('.orb-state-btn');
    buttons.forEach(function (btn) {
      if (btn.getAttribute('data-state-target') === stateName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  };

  // Wire up state buttons if they exist in DOM
  document.addEventListener('DOMContentLoaded', function () {
    var buttons = document.querySelectorAll('.orb-state-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var st = this.getAttribute('data-state-target');
        if (st && window.setAnshOrbState) {
          window.setAnshOrbState(st);
        }
      });
    });
  });

})();
