// library
import * as THREE from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

let canvas = document.querySelector("canvas.webgl");
let sizes = {
    width : window.innerWidth,
    height : window.innerHeight
}

let aspectRatio = sizes.width / sizes.height;

let textureLoader = new THREE.TextureLoader();
let taget = textureLoader.load('shoot.jpg')

// scene
const scene = new THREE.Scene();
scene.background = new THREE.Color('#feb47b');
// objects

let material = new THREE.MeshStandardMaterial({side: THREE.DoubleSide, map: taget});

let goe = new THREE.CircleGeometry(1);
let mesh = new THREE.Mesh(goe,material);
let mesh2 = new THREE.Mesh(goe,material);
mesh2.position.x = -3;
let mesh3 = new THREE.Mesh(goe,material);
mesh3.position.x = -6;
let mesh4 = new THREE.Mesh(goe,material);
mesh4.position.x = 3;
let mesh5 = new THREE.Mesh(goe,material);
mesh5.position.x = 6;

let shapesGroup = new THREE.Group();
shapesGroup.add(mesh, mesh2, mesh3, mesh4, mesh5);
shapesGroup.position.y = 0.5;

shapesGroup.children.forEach((obj) => {
    obj.castShadow = true;
})

let objArr = [];
objArr.push(mesh, mesh2, mesh3, mesh4, mesh5);


let plane = new THREE.PlaneGeometry(30, 30);
let planeMat = new THREE.MeshStandardMaterial({color: 'green'});
let planeMesh = new THREE.Mesh(plane, planeMat);
planeMesh.position.y = -4;
planeMesh.rotation.x = -Math.PI / 2;
planeMesh.receiveShadow = true;

scene.add(mesh, mesh2, mesh3, mesh4, mesh5, planeMesh);

// Gun
let gunGeometry = new THREE.BoxGeometry(0.5, 0.5, 2);
let gunMaterial = new THREE.MeshStandardMaterial({ color: 'black' });
let gun = new THREE.Mesh(gunGeometry, gunMaterial);
gun.position.set(0, -1, 10);
scene.add(gun);

// Bullets array
let bullets = [];

// camera
let camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 100);
camera.position.set(0, 0, 15);
camera.lookAt(shapesGroup.position);
scene.add(camera);

// lights

let light = new THREE.AmbientLight( 'white', 3 );
scene.add(light);

// renderer
let renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width , sizes.height);
renderer.render(scene, camera);

// resize
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    renderer.setSize(sizes.width , sizes.height);
    aspectRatio = sizes.width / sizes.height
    camera.aspect = aspectRatio;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.render(scene, camera);
})

// ORBIT CONTROLS
let controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.01;

//
// RAYCASTING
//
const raycaster = new THREE.Raycaster();

// 
// Mouse handler
// 
const mouse = new THREE.Vector2();

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = - (event.clientY / sizes.height) * 2 + 1;
})

window.addEventListener('click', () => {
    if (currentIntersectFlag) {
        const mesh = currentIntersectFlag.object;
        if (!mesh.originalPosition) {
            mesh.originalPosition = mesh.position.y;
        }
        
        if (mesh.position.y > -3) {
            const interval = setInterval(() => {
                if (mesh.position.y > -3) {
                    mesh.rotation.x = - Math.PI / 1.5;
                    mesh.position.y -= 0.1;
                } else {
                    clearInterval(interval);
                    setTimeout(() => {
                        const resetInterval = setInterval(() => {
                            if (mesh.position.y < mesh.originalPosition) {
                                mesh.rotation.x = 0;
                                mesh.position.y += 0.1;
                            } else {
                                clearInterval(resetInterval);
                            }
                        }, 50);
                    }, 3000);
                }
            }, 50);
        }
        // Rotate gun towards target
        let targetDirection = new THREE.Vector3().subVectors(mesh.position, gun.position).normalize();
        let quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), targetDirection);
        gun.quaternion.slerp(quaternion, 0.2);
        
        // Shoot bullet towards mesh
        let bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        let bulletMaterial = new THREE.MeshStandardMaterial({ color: 'red' });
        let bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bullet.position.set(gun.position.x, gun.position.y, gun.position.z - 1);
        scene.add(bullet);
        bullets.push({ mesh: bullet, target: mesh.position.clone() });
    }
});

// animation / game loop
let clock = new THREE.Clock();

let currentIntersectFlag;

let animation = () => {
    
    let time = clock.getElapsedTime();

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(objArr);

    if (intersects.length) {
        if (!currentIntersectFlag) {
            // console.log('entered a mesh');
        }
        currentIntersectFlag = intersects[0];
    }
    else {
        if (currentIntersectFlag) {
            // console.log('exited a mesh');
        }
        currentIntersectFlag = false;
    }   
    
    // Move bullets towards target
    bullets.forEach((bulletObj, index) => {
      let direction = new THREE.Vector3().subVectors(bulletObj.target, bulletObj.mesh.position).normalize();
      bulletObj.mesh.position.addScaledVector(direction, 0.2);
      if (bulletObj.mesh.position.distanceTo(bulletObj.target) < 0.2) {
          scene.remove(bulletObj.mesh);
          bullets.splice(index, 1);
      }
    });

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animation);
}

animation();