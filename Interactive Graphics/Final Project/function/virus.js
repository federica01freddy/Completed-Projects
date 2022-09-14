import * as THREE from 'three';

export function detectionVirus(player, virus, activatedGel){
  let playerX=player.position.x;
  let playerZ=player.position.z;
  var maxDetectionDistance = 80**2;
  var maxChasingDistance = 140**2;
  for(let i = 0; i<virus.length; i++){
    if (!activatedGel){
      if(virus[i].visible){
          let virusX=virus[i].position.x;
          let virusZ=virus[i].position.z;
          var distance = (playerX-virusX)**2 + (playerZ-virusZ)**2;
          if (virus[i].userData.chasing==false){
            if(distance<maxDetectionDistance){
              virus[i].userData.chasing=true;
            }
            else{
              virus[i].userData.chasing=false;
            }
          }
          else{
            if(distance<maxChasingDistance){
              virus[i].userData.chasing=true;
            }
            else{
              virus[i].userData.chasing=false;
            }
          }
        }
      }
    else {
      if (virus[i].visible){
        virus[i].userData.chasing=false;
      }
    }
  }
}

export function chasePlayer(player,virus){
  for(let i = 0; i<virus.length; i++){
    if(virus[i].visible&&virus[i].userData.chasing){
      //compute direction
      let direction = (new THREE.Vector3(0,0,0)).subVectors( player.position, virus[i].position ).normalize();
      direction.y=0;
      direction.multiplyScalar(1.8);
      //add direction to virus
      virus[i].position.add(direction);
      //compute rotation
      virus[i].lookAt(player.position.x,virus[i].position.y,player.position.z);
    }
  }
}
