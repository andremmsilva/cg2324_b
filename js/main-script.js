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
let wireframe = false;

const objects = {};
const materials = {};

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

  // scene.add(new THREE.AxesHelper(10));

  createContainer(13, 0, 0);
  createCrane(0, 0, 0);
  createCraneTop(0, 19, 0);
  createCart(13, 0, 0);
  createHook(0, -5, 0);
  scene.add(objects.crane);
  scene.add(objects.container);
  objects.crane.add(objects.craneTop);
  objects.craneTop.add(objects.craneCart);
  objects.craneCart.add(objects.craneHook);
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
function createBoxMesh(key, material, x, y, z) {
  "use strict";

  const geometry = new THREE.BoxGeometry(...dimensions[key]);
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  return mesh;
}

/* Loads (cargas) */
function randomNumberSign() {
  return Math.random() < 0.5 ? -1 : 1;
}

function createLoads() {
  "use strict";

  
}

/* Crane */
function createCrane(x, y, z) {
  "use strict";

  const crane = new THREE.Object3D();
  let material = new THREE.MeshBasicMaterial({
    color: 0xfdda0d,
    wireframe: false,
  });

  crane.add(createBoxMesh("base", material, 0, 1.5, 0));
  crane.add(createBoxMesh("torre", material, 0, 11, 0));

  crane.position.x = x;
  crane.position.y = y;
  crane.position.z = z;

  objects["crane"] = crane;
  materials["crane"] = material;
}

/* Container */
function createContainer(x, y, z) {
  "use strict";

  const container = new THREE.Object3D();
  let material = new THREE.MeshBasicMaterial({
    color: 0x000000,
    wireframe: false,
  });

  materials["containerFloor"] = material;

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

  container.add(createBoxMesh("containerChao", material, 0, 0.25, 0));

  material = new THREE.MeshBasicMaterial({ color: 0x964b00, wireframe: false });

  let wall;
  for (let i = 0; i < 4; i++) {
    wall = createBoxMesh(
      "containerWall",
      material,
      getWallX(i),
      1.75,
      getWallZ(i)
    );
    wall.rotation.y += (Math.PI / 2) * (i + 1);
    container.add(wall);
  }

  container.position.set(x, y, z);
  objects["container"] = container;
  materials["containerWalls"] = material;
}

/* Crane top */
function createPortaLanca(material, x, y, z) {
  "use strict";
  const geometry = new THREE.CylinderGeometry(0, 1, 4, 4);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.y += -Math.PI / 2;

  return mesh;
}

function createTirante(point1, point2) {
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
  materials["tirante"] = material;
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

  return mesh;
}

function createCraneTop(x, y, z) {
  "use strict";

  const craneTop = new THREE.Object3D();
  craneTop.userData = { rotating: false, direction: 1 };

  const material = new THREE.MeshBasicMaterial({
    color: 0xfddadd,
    wireframe: false,
  });

  craneTop.add(createBoxMesh("lanca", material, 5, 1, 0));
  craneTop.add(createBoxMesh("contrapeso", material, -4.5, -1, 0));
  craneTop.add(createBoxMesh("cabine", material, 1.5, -0.5, 0));
  craneTop.add(createPortaLanca(material, 0, 4, 0));
  craneTop.add(createTirante([0, 6, 0], [17, 2, 0]));
  craneTop.add(createTirante([0, 6, 0], [-7, 2, 0]));

  craneTop.position.x = x;
  craneTop.position.y = y;
  craneTop.position.z = z;

  objects["craneTop"] = craneTop;
  materials["craneTop"] = material;
}

/* Cart */
function createCart(x, y, z) {
  "use strict";

  const craneCart = new THREE.Object3D();
  craneCart.userData = { moving: false, direction: 1 };

  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false });

  craneCart.add(createBoxMesh("carrinho", material, 0, -0.5, 0));
  craneCart.add(createTirante([0, -1, 0], [0, -5, 0])); // Cabo de aço

  craneCart.position.x = x;
  craneCart.position.y = y;
  craneCart.position.z = z;

  objects["craneCart"] = craneCart;
  materials["craneCart"] = material;
}

/* Hook */
function createClaw(material, x, y, z) {
  "use strict";

  const geometry = new THREE.CylinderGeometry(0.5, 0, 2, 4);

  z > 0 ? geometry.translate(0, -0.5, -0.5) : geometry.translate(0, -0.5, 0.5);

  let mesh = new THREE.Mesh(geometry, material);
  z > 0
    ? mesh.position.set(x, y + 0.5, z + 0.5)
    : mesh.position.set(x, y + 0.5, z - 0.5);

  return mesh;
}

function createHook(x, y, z) {
  "use strict";

  const craneHook = new THREE.Object3D();
  craneHook.userData = {
    moving: false,
    direction: 1,
    clawRotating: false,
    clawDirection: 1,
  };

  const material = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: false });

  craneHook.add(createBoxMesh("blocoGancho", material, 0, -0.5, 0));
  craneHook.add(createClaw(material, 0.5, -1.2, 0.5));
  craneHook.add(createClaw(material, 0.5, -1.2, -0.5));
  craneHook.add(createClaw(material, -0.5, -1.2, 0.5));
  craneHook.add(createClaw(material, -0.5, -1.2, -0.5));

  craneHook.position.x = x;
  craneHook.position.y = y;
  craneHook.position.z = z;

  objects["craneHook"] = craneHook;
  materials["craneHook"] = material;
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
  if (objects.craneTop.userData.rotating) {
    objects.craneTop.rotation.y += (objects.craneTop.userData.direction * Math.PI) / 128;
  }

  // Cart
  if (objects.craneCart.userData.moving) {
    const nextPosX = objects.craneCart.position.x + objects.craneCart.userData.direction * 0.1;
    if (nextPosX < 16 && nextPosX > 3) {
      objects.craneCart.position.x = nextPosX;
    }
  }

  // Hook
  if (objects.craneHook.userData.moving) {
    const nextPosY = objects.craneHook.position.y + objects.craneHook.userData.direction * 0.1;
    objects.craneHook.position.y = nextPosY;
    objects.craneCart.traverse((obj) => {
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
  if (objects.craneHook.userData.clawRotating) {
    objects.craneHook.traverse((obj) => {
      if (
        obj instanceof THREE.Mesh &&
        obj.geometry instanceof THREE.CylinderGeometry
      ) {
        const rotationDir =
          objects.craneHook.userData.clawDirection * obj.position.z > 0 ? 1 : -1;
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
  objects.craneHook.getWorldPosition(hookPos);
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
      objects.craneTop.userData.rotating = true;
      objects.craneTop.userData.direction = 1;
      break;
    case 65: //A
    case 97: //a
      objects.craneTop.userData.rotating = true;
      objects.craneTop.userData.direction = -1;
      break;
    case 83: //S
    case 115: //s
      objects.craneCart.userData.moving = true;
      objects.craneCart.userData.direction = 1;
      break;
    case 87: // W
    case 119: // w
      objects.craneCart.userData.moving = true;
      objects.craneCart.userData.direction = -1;
      break;
    case 68: // D
    case 100: // d
      objects.craneHook.userData.moving = true;
      objects.craneHook.userData.direction = 1;
      break;
    case 69: //E
    case 101: //e
      objects.craneHook.userData.moving = true;
      objects.craneHook.userData.direction = -1;
      break;
    case 82: //R
    case 114: //r
      objects.craneHook.userData.clawRotating = true;
      objects.craneHook.userData.clawDirection = 1;
      break;
    case 70: //F
    case 102: //f
      objects.craneHook.userData.clawRotating = true;
      objects.craneHook.userData.clawDirection = -1;
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
      objects.craneTop.userData.rotating = false;
      break;
    case 65: //A
    case 97: //a
      objects.craneTop.userData.rotating = false;
      break;
    case 83: //S
    case 115: //s
      objects.craneCart.userData.moving = false;
      break;
    case 87: // W
    case 119: // w
      objects.craneCart.userData.moving = false;
      break;
    case 68: // D
    case 100: // d
      objects.craneHook.userData.moving = false;
      break;
    case 69: //E
    case 101: //e
      objects.craneHook.userData.moving = false;
      break;
    case 82: //R
    case 114: //r
      objects.craneHook.userData.clawRotating = false;
      break;
    case 70: //F
    case 102: //f
      objects.craneHook.userData.clawRotating = false;
      break;
  }
}

init();
animate();
