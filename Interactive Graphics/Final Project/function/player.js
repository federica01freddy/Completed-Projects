import * as THREE from 'three';
import * as camera_func from "./camera.js";

export function checkPlayerCollision(direction,raycasterArray,room){
  var Collision_Distance = 17;

  var normalArray=[];
  var collisionResults;
  for (let rayIndex = 0; rayIndex < raycasterArray.length; rayIndex++) {
    collisionResults = raycasterArray[rayIndex].intersectObjects(room.children);
    if(collisionResults.length > 0) {
      if(collisionResults[0].distance < Collision_Distance) {
        if(!normalArray.includes(collisionResults[0].face.normal))
          normalArray.push(collisionResults[0].face.normal.clone());
      }
    }
  }
  var results=direction.clone();
  var final_normal=new THREE.Vector3();
  for (let x=0;x<normalArray.length;x++){
    if(direction.clone().dot(normalArray[x])<0)
      results=results.sub(normalArray[x].multiplyScalar(direction.clone().dot(normalArray[x])));
  }
  return results;
}

export function initPlayerRay(){
  var RayCasterArray=[];
  let rayNumbers = 8;
  for (let x=0;x<rayNumbers;x++){
    let angle= -x*(Math.PI*2/rayNumbers);
    let rotationEuler = new THREE.Euler( 0, angle, 0, 'XYZ' );
    let rotationQuaternion = new THREE.Quaternion();
    rotationQuaternion.setFromEuler(rotationEuler);
    let RayDirection = new THREE.Vector3( 1, 0, 0 );
    RayDirection.applyQuaternion(rotationQuaternion);
    var RayCasterElement = new THREE.Raycaster(new THREE.Vector3( 0, 40, 0 ),RayDirection);
    RayCasterArray.push(RayCasterElement);
  }
  return RayCasterArray;
}
export function updatePlayerRayPosition(player,RayCasterArray){
  for (let x=0;x<RayCasterArray.length;x++){
    RayCasterArray[x].ray.origin=player.position.clone();
    RayCasterArray[x].ray.origin.y=40;
  }
  return RayCasterArray;
}

export function updatePlayerRayRotation(rotation,RayCasterArray){
  for (let x=0;x<RayCasterArray.length;x++){
    let rotationEuler = new THREE.Euler( 0, rotation, 0, 'XYZ' );
    let rotationQuaternion = new THREE.Quaternion();
    rotationQuaternion.setFromEuler(rotationEuler);
    RayCasterArray[x].ray.direction.applyQuaternion(rotationQuaternion);
  }
  return RayCasterArray;
}

export function updatePlayerRunningRotation(enabled,player){
  if (enabled.r==1){
    let direction_1 = new THREE.Vector3(0,0,1);
    let direction_2 = new THREE.Vector3(1,0,0);
    let direction = new THREE.Vector3(0,0,0);

    if (enabled.w) {
      direction.sub(direction_1);
    }
    if (enabled.a) {
      direction.sub(direction_2);
    }
    if (enabled.s) {
      direction.add(direction_1);
    }
    if (enabled.d) {
      direction.add(direction_2);
    }

    if (direction.equals(new THREE.Vector3(1,0,0))){
      player.children[0].rotation.y=-Math.PI/2;
    }
    if (direction.equals(new THREE.Vector3(1,0,1))){
      player.children[0].rotation.y=-Math.PI*3/4;
    }
    if (direction.equals(new THREE.Vector3(1,0,-1))){
      player.children[0].rotation.y=-Math.PI/4;
    }
    if (direction.equals(new THREE.Vector3(0,0,1))){
      player.children[0].rotation.y=Math.PI;
    }
    if (direction.equals(new THREE.Vector3(0,0,-1))){
      player.children[0].rotation.y=0;
    }
    if (direction.equals(new THREE.Vector3(-1,0,1))){
      player.children[0].rotation.y=Math.PI*3/4;
    }
    if (direction.equals(new THREE.Vector3(-1,0,0))){
      player.children[0].rotation.y=Math.PI/2;
    }
    if (direction.equals(new THREE.Vector3(-1,0,-1))){
      player.children[0].rotation.y=Math.PI/4;
    }
    if (direction.equals(new THREE.Vector3(0,0,0))){
      player.children[0].rotation.y=0;
    }
  }
  if (enabled.r==0){
    player.children[0].rotation.y=0;
  }
}

export function getPlayerDirection(player,enabled){
  var dirZ = new THREE.Vector3(0,0,1);
  var dirX = new THREE.Vector3(1,0,0);


  dirZ.applyQuaternion(player.quaternion);
  dirX.applyQuaternion(player.quaternion);

  var direction = new THREE.Vector3(0,0,0);

  if (enabled.w) {
    direction.sub(dirZ);
  }
  if (enabled.a) {
    direction.sub(dirX);
  }
  if (enabled.s) {
    direction.add(dirZ);
  }
  if (enabled.d) {
    direction.add(dirX);
  }
  return direction;
}

export function getPlayerRotation(enabled){
  var rotation=0;
  if (enabled.q){
    rotation += Math.PI/60;
  }
  if (enabled.e){
    rotation -= Math.PI/60;
  }
  return rotation;
}

export function getPlayerMovement(player,camera,enabled,RayCasterArray,room){

    /*---------------------------PLAYER ROTATION---------------------------*/
    var rotation = getPlayerRotation(enabled);
    if (rotation!=0){
      player.rotation.y += rotation;
      RayCasterArray= updatePlayerRayRotation(rotation,RayCasterArray);
    }

    /*---------------------------PLAYER MOVEMENT---------------------------*/
    var direction=getPlayerDirection(player,enabled);
    direction.normalize().multiplyScalar(enabled.scale);

    if (!direction.equals(new THREE.Vector3(0,0,0))){
      direction= checkPlayerCollision(direction,RayCasterArray,room);
      player.position.add(direction);
      RayCasterArray= updatePlayerRayPosition(player,RayCasterArray);
    }

    /*---------------------------PLAYER ROTATION ANIMATION---------------------------*/
    updatePlayerRunningRotation(enabled,player);

    /*---------------------------CAMERA MOVEMENT---------------------------*/
    camera_func.checkCameraCollision (player,camera,enabled,room,RayCasterArray[2]);
    return direction;
}