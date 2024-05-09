import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

let cameras = [];
let selectedCamera = 0,
  previousCamera = -1;
let scene, renderer;
let geometry, material, mesh;
let wireframe = false;

let craneHook, craneCart, craneTop, crane, container;

let dimensions = {
  lanca: [24, 2, 2],
  contrapeso: [3, 2, 2],
  torre: [2, 16, 2],
  base: [6, 3, 6],
  cabine: [1, 1, 1],
  carrinho: [2, 1, 2],
  blocoGancho: [2, 1, 2],
  containerChao: [4, 0.5, 4],
  containerWall: [4, 3, 0.5],
};

/////////////////////
/* CREATE SCENE(S) */
/////////////////////

function createScene() {
  "use strict";

  scene = new THREE.Scene();
  scene.background = new THREE.Color("skyblue");

  scene.add(new THREE.AxesHelper(10));

  createContainer(13, 0, 0);
  createCrane(0, 0, 0);
  createCraneTop(0, 19, 0);
  createCart(13, 0, 0);
  createHook(0, -5, 0);
  scene.add(crane);
  scene.add(container);
  crane.add(craneTop);
  craneTop.add(craneCart);
  craneCart.add(craneHook);
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const d = 30; // Dimension for orthographic view

  // Orthographic cameras
  const orthoFront = new THREE.OrthographicCamera(
    -d * aspect,
    d * aspect,
    d,
    -d,
    1,
    1000
  );
  const orthoSide = new THREE.OrthographicCamera(
    -d * aspect,
    d * aspect,
    d,
    -d,
    1,
    1000
  );
  const orthoTop = new THREE.OrthographicCamera(
    -d * aspect,
    d * aspect,
    d,
    -d,
    1,
    1000
  );

  orthoFront.position.set(0, 0, 30);
  orthoSide.position.set(30, 0, 0);
  orthoTop.position.set(0, 30, 0);

  // Fixed cameras at the same point
  const cameraPosition = new THREE.Vector3(40, 40, 40); // A shared position for both cameras

  const orthoFixed = new THREE.OrthographicCamera(
    -d * aspect,
    d * aspect,
    d,
    -d,
    1,
    1000
  );
  orthoFixed.position.copy(cameraPosition);
  orthoFixed.lookAt(scene.position);

  const perspFixed = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  perspFixed.position.copy(cameraPosition);
  perspFixed.lookAt(scene.position);

  // Mobile perspective camera
  const perspMobile = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  perspMobile.position.set(0, 10, 0); // Starting position, presumably on a crane

  orthoFront.lookAt(scene.position);
  orthoSide.lookAt(scene.position);
  orthoTop.lookAt(scene.position);
  perspMobile.lookAt(new THREE.Vector3(0, 0, 0));
  cameras.push(orthoFront);
  cameras.push(orthoSide);
  cameras.push(orthoTop);
  cameras.push(orthoFixed);
  cameras.push(perspFixed);
  cameras.push(perspMobile);
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function createBoxGeometry(obj, key, x, y, z) {
  "use strict";
  geometry = new THREE.BoxGeometry(...dimensions[key]);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  obj.add(mesh);

  return mesh;
}

/* Crane */
function createCrane(x, y, z) {
  "use strict";

  crane = new THREE.Object3D();

  material = new THREE.MeshBasicMaterial({ color: 0xfdda0d, wireframe: false });

  createBoxGeometry(crane, "base", 0, 1.5, 0);
  createBoxGeometry(crane, "torre", 0, 11, 0);

  crane.position.x = x;
  crane.position.y = y;
  crane.position.z = z;
}

/* Container */
function createContainer(x, y, z) {
  "use strict";

  container = new THREE.Object3D();

  material = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: false });

  const getWallX = (i) => {
    if (i === 0) return 2;
    if (i === 2) return -2;
    return 0;
  };

  const getWallZ = (i) => {
    if (i === 0 || i === 2) return 0;
    if (i === 1) return 2;
    return -2;
  };

  createBoxGeometry(container, "containerChao", 0, 0.25, 0);
  material = new THREE.MeshBasicMaterial({ color: 0x964b00, wireframe: false });
  let wall;
  for (let i = 0; i < 4; i++) {
    wall = createBoxGeometry(container, "containerWall", getWallX(i), 1.75, getWallZ(i));
    wall.rotation.y += (Math.PI / 2) * (i + 1);
  }

  container.add(mesh);
  container.position.set(x, y, z);
}

/* Crane top */
function addPortaLanca(obj, x, y, z) {
  "use strict";
  geometry = new THREE.CylinderGeometry(0, 1, 4, 4);
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.y += -Math.PI / 2;
  obj.add(mesh);
}

function addTirante(obj, point1, point2) {
  "use strict";
  // Calculate the length of the tirante
  let tiranteLen = Math.sqrt(
    (point2[0] - point1[0]) ** 2 +
      (point2[1] - point1[1]) ** 2 +
      (point2[2] - point1[2]) ** 2
  );

  // Create the geometry of the cylinder
  let geometry = new THREE.CylinderGeometry(0.1, 0.1, tiranteLen, 32);
  let material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
  let mesh = new THREE.Mesh(geometry, material);

  // Calculate the midpoint for initial positioning
  let middlePoint = new THREE.Vector3(
    (point1[0] + point2[0]) / 2,
    (point1[1] + point2[1]) / 2,
    (point1[2] + point2[2]) / 2
  );

  // Calculate the rotation needed to align the cylinder with the points
  const direction = new THREE.Vector3(
    point2[0] - point1[0],
    point2[1] - point1[1],
    point2[2] - point1[2]
  );
  const orientation = new THREE.Vector3(0, 1, 0); // Default direction of the cylinder along the y-axis
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    orientation,
    direction.clone().normalize()
  );

  // Set position and rotation
  mesh.position.copy(middlePoint);
  mesh.quaternion.copy(quaternion);

  // Add the mesh to the object
  obj.add(mesh);
}

function createCraneTop(x, y, z) {
  "use strict";

  craneTop = new THREE.Object3D();
  craneTop.userData = { rotating: false, direction: 1 };

  material = new THREE.MeshBasicMaterial({ color: 0xfddadd, wireframe: false });

  createBoxGeometry(craneTop, "lanca", 5, 1, 0);
  createBoxGeometry(craneTop, "contrapeso", -4.5, -1, 0);
  createBoxGeometry(craneTop, "cabine", 1.5, -0.5, 0);
  addPortaLanca(craneTop, 0, 4, 0);
  addTirante(craneTop, [0, 6, 0], [17, 2, 0]);
  addTirante(craneTop, [0, 6, 0], [-7, 2, 0]);

  craneTop.position.x = x;
  craneTop.position.y = y;
  craneTop.position.z = z;
}

/* Cart */
function createCart(x, y, z) {
  "use strict";

  craneCart = new THREE.Object3D();
  craneCart.userData = { moving: false, direction: 1 };

  material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false });

  createBoxGeometry(craneCart, "carrinho", 0, -0.5, 0);
  addTirante(craneCart, [0, -1, 0], [0, -5, 0]); // Cabo de aço

  craneCart.position.x = x;
  craneCart.position.y = y;
  craneCart.position.z = z;
}

/* Hook */
function addClaw(obj, x, y, z) {
  "use strict";
  geometry = new THREE.CylinderGeometry(0.5, 0, 2, 4);
  z > 0 ? geometry.translate(0, -0.5, -0.5) : geometry.translate(0, -0.5, 0.5);
  mesh = new THREE.Mesh(geometry, material);
  z > 0
    ? mesh.position.set(x, y + 0.5, z + 0.5)
    : mesh.position.set(x, y + 0.5, z - 0.5);
  obj.add(mesh);
}

function createHook(x, y, z) {
  "use strict";

  craneHook = new THREE.Object3D();
  craneHook.userData = {
    moving: false,
    direction: 1,
    clawRotating: false,
    clawDirection: 1,
  };

  material = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: false });

  createBoxGeometry(craneHook, "blocoGancho", 0, -0.5, 0);
  addClaw(craneHook, 0.5, -1.2, 0.5);
  addClaw(craneHook, 0.5, -1.2, -0.5);
  addClaw(craneHook, -0.5, -1.2, 0.5);
  addClaw(craneHook, -0.5, -1.2, -0.5);

  craneHook.position.x = x;
  craneHook.position.y = y;
  craneHook.position.z = z;
}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions() {
  "use strict";
}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions() {
  "use strict";
}

////////////
/* UPDATE */
////////////
function update() {
  "use strict";

  // Crane Top
  if (craneTop.userData.rotating) {
    craneTop.rotation.y += (craneTop.userData.direction * Math.PI) / 128;
  }

  // Cart
  if (craneCart.userData.moving) {
    const nextPosX = craneCart.position.x + craneCart.userData.direction * 0.1;
    if (nextPosX < 16 && nextPosX > 3) {
      craneCart.position.x = nextPosX;
    }
  }

  // Hook
  if (craneHook.userData.moving) {
    const nextPosY = craneHook.position.y + craneHook.userData.direction * 0.1;
    craneHook.position.y = nextPosY;
    craneCart.traverse((obj) => {
      if (
        obj instanceof THREE.Mesh &&
        obj.geometry instanceof THREE.CylinderGeometry &&
        obj.position.x === 0
      ) {
        obj.geometry = new THREE.CylinderGeometry(0.1, 0.1, -1 + nextPosY, 32);
        obj.position.y = nextPosY - (-1 + nextPosY) / 2;
      }
    });
  }

  // Claw
  if (craneHook.userData.clawRotating) {
    craneHook.traverse((obj) => {
      if (
        obj instanceof THREE.Mesh &&
        obj.geometry instanceof THREE.CylinderGeometry
      ) {
        const rotationDir =
          craneHook.userData.clawDirection * obj.position.z > 0 ? 1 : -1;
        const nextRotX = obj.rotation.x + (rotationDir * Math.PI) / 128;
        if (obj.position.z > 0) {
          if (nextRotX < Math.PI / 12 && nextRotX > -Math.PI / 4)
            obj.rotation.x += (rotationDir * Math.PI) / 128;
        } else {
          if (nextRotX < Math.PI / 4 && nextRotX > -Math.PI / 12)
            obj.rotation.x += (rotationDir * Math.PI) / 128;
        }
      }
    });
  }

  const perspMobile = cameras[5];
  let hookPos = new THREE.Vector3();
  craneHook.getWorldPosition(hookPos)
  perspMobile.position.set(hookPos.x, hookPos.y - 1, hookPos.z);
  perspMobile.lookAt(new THREE.Vector3(hookPos.x, 0, hookPos.z));

  // Cameras
  if (previousCamera === -1) {
    document.getElementById(`hud${1}`).classList.add("active-camera");
    previousCamera = selectedCamera;
  }

  if (
    selectedCamera !== previousCamera &&
    document.getElementById(`hud${previousCamera + 1}`) !== null
  ) {
    document
      .getElementById(`hud${previousCamera + 1}`)
      .classList.remove("active-camera");
    document
      .getElementById(`hud${selectedCamera + 1}`)
      .classList.add("active-camera");
    previousCamera = selectedCamera;
  }
}

/////////////
/* DISPLAY */
/////////////
function render() {
  "use strict";
  renderer.render(scene, cameras[selectedCamera]);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
  "use strict";
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  createScene();
  createCamera();

  render();

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("resize", onResize);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
  "use strict";

  update();
  render();

  requestAnimationFrame(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {
  "use strict";

  renderer.setSize(window.innerWidth, window.innerHeight);

  cameras.forEach((camera) => {
    if (window.innerHeight > 0 && window.innerWidth > 0) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
  });
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
  "use strict";

  if (document.getElementById(`hud${e.key}`) !== null)
    document.getElementById(`hud${e.key}`).classList.add("active-hud");

  switch (e.keyCode) {
    case 49: // 1
      selectedCamera = 0;
      wireframe = !wireframe;
      scene.traverse(function (node) {
        if (node instanceof THREE.Mesh) {
          node.material.wireframe = wireframe;
        }
      });
      break;
    case 50: // 2
    case 51: // 3
    case 52: // 4
    case 53: // 5
    case 54: // 6
      selectedCamera = 6 - (54 - e.keyCode) - 1;
      break;
    case 81: // Q
    case 113: // q
      craneTop.userData.rotating = true;
      craneTop.userData.direction = 1;
      break;
    case 65: //A
    case 97: //a
      craneTop.userData.rotating = true;
      craneTop.userData.direction = -1;
      break;
    case 83: //S
    case 115: //s
      craneCart.userData.moving = true;
      craneCart.userData.direction = 1;
      break;
    case 87: // W
    case 119: // w
      craneCart.userData.moving = true;
      craneCart.userData.direction = -1;
      break;
    case 68: // D
    case 100: // d
      craneHook.userData.moving = true;
      craneHook.userData.direction = 1;
      break;
    case 69: //E
    case 101: //e
      craneHook.userData.moving = true;
      craneHook.userData.direction = -1;
      break;
    case 82: //R
    case 114: //r
      craneHook.userData.clawRotating = true;
      craneHook.userData.clawDirection = 1;
      break;
    case 70: //F
    case 102: //f
      craneHook.userData.clawRotating = true;
      craneHook.userData.clawDirection = -1;
      break;
  }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {
  "use strict";
  if (document.getElementById(`hud${e.key}`) !== null)
    document.getElementById(`hud${e.key}`).classList.remove("active-hud");
  switch (e.keyCode) {
    case 81: // Q
    case 113: // q
      craneTop.userData.rotating = false;
      break;
    case 65: //A
    case 97: //a
      craneTop.userData.rotating = false;
      break;
    case 83: //S
    case 115: //s
      craneCart.userData.moving = false;
      break;
    case 87: // W
    case 119: // w
      craneCart.userData.moving = false;
      break;
    case 68: // D
    case 100: // d
      craneHook.userData.moving = false;
      break;
    case 69: //E
    case 101: //e
      craneHook.userData.moving = false;
      break;
    case 82: //R
    case 114: //r
      craneHook.userData.clawRotating = false;
      break;
    case 70: //F
    case 102: //f
      craneHook.userData.clawRotating = false;
      break;
  }
}

init();
animate();
