import * as THREE from 'three';
import * as room from "./room.js";

export function init(roomTexture,playerMesh,syringeEmpty,syringeFull){
  var scene,camera;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x800000);

  scene.fog=new THREE.Fog(0x800000,60,1000);

  const light_global = new THREE.PointLight( 0xffffff, 4, 1500 );
  light_global.position.set(0, 1000, 0);
  scene.add(light_global);

  for (let x=-600;x<=600;x+=200){
    for (let y=-600;y<=600;y+=200){
      const light = new THREE.PointLight( 0x800000, 4, 200 );
      light.position.set(x, -50, y);
      scene.add(light);
    }
  }

  var maze = room.getMaze(roomTexture);
  var full_room = maze[0];
  var only_room = maze[1];
  var noPlayingField = maze[2];
  full_room.name = "full_room";
  scene.add(full_room);

  syringeFull.position.x = (((playerMesh.children[0]).children[1]).children[0]).position.x;
  syringeFull.position.y = (((playerMesh.children[0]).children[1]).children[0]).position.y-2;
  syringeFull.position.z = (((playerMesh.children[0]).children[1]).children[0]).position.z+3;
  syringeFull.rotation.x = -Math.PI/2;
  syringeFull.visible=false;
  (((playerMesh.children[0]).children[1]).children[0]).add(syringeFull);

  syringeEmpty.position.x = (((playerMesh.children[0]).children[1]).children[0]).position.x;
  syringeEmpty.position.y = (((playerMesh.children[0]).children[1]).children[0]).position.y-2;
  syringeEmpty.position.z = (((playerMesh.children[0]).children[1]).children[0]).position.z+3;
  syringeEmpty.rotation.x = -Math.PI/2;
  syringeEmpty.visible=true;
  (((playerMesh.children[0]).children[1]).children[0]).add(syringeEmpty);

  scene.add(playerMesh);

  /* CAMERA STUFF*/
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );

  var cameraTranslation = new THREE.Vector3( 0, 60, 60 );
  camera.position.set(0,cameraTranslation.y,cameraTranslation.z);
  camera.rotation.x=-Math.atan((cameraTranslation.y-40)/camera.position.z);

  return [scene, camera, playerMesh, cameraTranslation, full_room, only_room, noPlayingField];
}
