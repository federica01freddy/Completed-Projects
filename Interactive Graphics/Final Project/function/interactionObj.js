import * as THREE from 'three';

export function spreadingObj(nObject, objectMesh, noPlayingField, scene){
  var objectsArray = [];
  for(var i = 0; i<nObject; i++){
    objectsArray.push(objectMesh.clone());
  }

  for(var i = 0; i<nObject; ){
    var max = 500;
    var min = -500;
    var x = Math.random() * (max - min) + min;
    var z = Math.random() * (max - min) + min;
    var values_ok;
    for(var j = 0; j<noPlayingField.length; j++){
      var x_in = noPlayingField[j]['x_min'] <= x && x <= noPlayingField[j]['x_max'];
      var z_in = noPlayingField[j]['z_min'] <= z && z <= noPlayingField[j]['z_max'];
      if(!(x_in && z_in)){
        values_ok = true;
      }
      else{
        values_ok = false;
        break;
      }
    }
    if(values_ok){
      objectsArray[i].position.set(x,55,z);
      i++;
    }
    else{
    }
  }
  for(var i = 0; i<nObject; i++){
    noPlayingField = expandNOplayingField(objectsArray[i], noPlayingField);
    scene.add(objectsArray[i]);
  }

  return [objectsArray,noPlayingField];
}

function expandNOplayingField(obj,noPlayingField){
    var noObjects = {
      "x_max":obj.position.x+(60/2),
      "x_min":obj.position.x-(60/2),
      "z_max":obj.position.z+(60/2),
      "z_min":obj.position.z-(60/2)
    };
    noPlayingField.push(noObjects);
    return noPlayingField;
}

export function removePlayerPosition(player, noPlayingField){
  noPlayingField = expandNOplayingField(player,noPlayingField);
  return noPlayingField;
}

export function interactionPlayerObject(objectsArray, playerX, playerZ, aliveObjects, d){
  var maxDistance = d;
  for(var i = 0; i<objectsArray.length; i++){
    if(objectsArray[i].visible == true){
      var distance = (playerX-objectsArray[i].position.x)**2 + (playerZ-objectsArray[i].position.z)**2; //I compute the distance squared because it is slightly more efficient to calculate.
      if(distance<maxDistance*maxDistance){
        objectsArray[i].visible = false;
        aliveObjects = aliveObjects-1;
        var caughtObjects = objectsArray.length-aliveObjects;
        if(objectsArray[0].userData.tag == 'virus') document.getElementById('virus').innerHTML = "&#129440 x " + caughtObjects;
        if(objectsArray[0].userData.tag == 'gel') document.getElementById('gel').innerHTML = "&#129524 x " + caughtObjects;
        if(objectsArray[0].userData.tag == 'mask') document.getElementById('mask').innerHTML = "&#128567 x " + caughtObjects;
        if(objectsArray[0].userData.tag == 'vaccine') document.getElementById('vaccine').innerHTML = "&#9763 x " + caughtObjects;
      }
    }
  }
  return aliveObjects;
}

export function disappearObject(objectsArray){
  for(var i = 0; i<objectsArray.length; i++){
    objectsArray[i].visible = false;
  }
}

export function vaccineVirus(nAliveObj, objectsArray){
  var remainingObj = objectsArray.length - nAliveObj - 1;
  if(objectsArray[0].userData.tag == 'vaccine') document.getElementById('vaccine').innerHTML = "&#9763 x " + remainingObj;
  return nAliveObj+1;
}

export function maskVirus(masks,countMasksAlive){
  var remain = masks.length - countMasksAlive - 1;
  document.getElementById("mask").innerHTML = "&#128567 x " + remain;
  return countMasksAlive+1;
}


export function checkNearVirus(virus,playerX,playerZ,ray){
  var bbox = [];
  for(let i = 0; i<virus.length; i++){
    var box = new THREE.Box3().setFromObject(virus[i]);
    bbox.push(box);
  }
  var inside = 0;
  for(let i = 0; i<virus.length; i++){
    if(virus[i].visible == true){
      var x_in = (bbox[i].min.x - ray) <= playerX && playerX <= (bbox[i].max.x + ray);
      var z_in = (bbox[i].min.z - ray) <= playerZ && playerZ <= (bbox[i].max.z + ray);
      if(x_in && z_in){
        inside++;
      }
    }
  }
  return inside;
}


export function contactWithVirus(virus, player, remainingLive){
  var inside = checkNearVirus(virus, player.position.x, player.position.z, 30);
  if(inside){
      remainingLive -= 0.05*inside;
      document.getElementById("contact").innerHTML = "&#128156 " + Math.round(remainingLive) + "%";
  }
  return remainingLive;
}

export function gelVirus(gels,countGelsAlive){
  var remain = gels.length - countGelsAlive - 1;
  document.getElementById("gel").innerHTML = "&#129524 x " + remain;
  return countGelsAlive+1;
}
