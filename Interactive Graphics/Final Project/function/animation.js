import * as THREE from 'three';

export function walkingPlayerLeg(player){
  var values;
  var times;
  var position;
  var duration = 16;
  var angleArray=[-Math.PI,             //0
                  -Math.PI*3/4,         //1
                  -Math.PI/2*3,         //2
                  -Math.PI/2,           //3
                  -Math.PI/3,           //4
                  -Math.PI/4,           //5
                  0,                    //6
                  Math.PI/4,            //7
                  Math.PI/3,            //8
                  Math.PI/2,            //9
                  Math.PI*2/3,          //10
                  Math.PI*3/4,          //11
                  Math.PI];             //12
  var qArray=[];
  for (let x=0;x<angleArray.length;x++){
    qArray.push(new THREE.Quaternion().setFromEuler(new THREE.Euler( angleArray[x], 0, 0, 'XYZ' )));
  }

  times = [0, 4, 8, 12, 16];
  values = [player.children[0].position.x,player.children[0].position.y,player.children[0].position.z,
            player.children[0].position.x,player.children[0].position.y+2,player.children[0].position.z,
            player.children[0].position.x,player.children[0].position.y,player.children[0].position.z,
            player.children[0].position.x,player.children[0].position.y-2,player.children[0].position.z,
            player.children[0].position.x,player.children[0].position.y,player.children[0].position.z,];
  var posBody = new THREE.VectorKeyframeTrack('Body.position', times, values);

  times = [0, 2, 4, 6, 8, 10, 12, 14, 16];
  position=[6,6,7,9,8,7,6,5,6];
  values = [];
  for (let x=0;x<position.length;x++){
    values.push(qArray[position[x]].x);
    values.push(qArray[position[x]].y);
    values.push(qArray[position[x]].z);
    values.push(qArray[position[x]].w);
  }
  var rotationUpperLeft = new THREE.QuaternionKeyframeTrack( 'UpperLeftLeg.quaternion', times, values);

  times = [0, 2, 4, 6, 8, 10, 12, 14, 16];
  position=[4,3,3,3,4,6,5,5,4];
  values = [];
  for (let x=0;x<position.length;x++){
    values.push(qArray[position[x]].x);
    values.push(qArray[position[x]].y);
    values.push(qArray[position[x]].z);
    values.push(qArray[position[x]].w);
  }
  var rotationLowerLeft = new THREE.QuaternionKeyframeTrack( 'LowerLeftLeg.quaternion', times, values);

  times = [0, 2, 4, 6, 8, 10, 12, 14, 16];
  position=[8,7,6,5,6,6,6,7,9];
  values = [];
  for (let x=0;x<position.length;x++){
    values.push(qArray[position[x]].x);
    values.push(qArray[position[x]].y);
    values.push(qArray[position[x]].z);
    values.push(qArray[position[x]].w);
  }
  var rotationUpperRight = new THREE.QuaternionKeyframeTrack( 'UpperRightLeg.quaternion',times,values);

  times = [0, 2, 4, 6, 8, 10, 12, 14, 16];
  position=[4,6,5,5,4,4,3,3,3];
  values = [];
  for (let x=0;x<position.length;x++){
    values.push(qArray[position[x]].x);
    values.push(qArray[position[x]].y);
    values.push(qArray[position[x]].z);
    values.push(qArray[position[x]].w);
  }
  var rotationLowerRight = new THREE.QuaternionKeyframeTrack( 'LowerRightLeg.quaternion',times,values);

  var clip = new THREE.AnimationClip("walk", duration, [posBody, rotationUpperLeft, rotationUpperRight, rotationLowerLeft, rotationLowerRight]);
  var mixer = new THREE.AnimationMixer(player);

  var AnimationAction = mixer.clipAction(clip);
  AnimationAction.clampWhenFinished=true;
  AnimationAction.timeScale = duration;

  var clock = new THREE.Clock();
  return [mixer,clock,AnimationAction];
}

export function walkingPlayerArm(player){
  var values;
  var times;
  var position;
  var duration = 8;
  var angleArray=[-Math.PI,             //0
                  -Math.PI*3/4,         //1
                  -Math.PI/2*3,         //2
                  -Math.PI/2,           //3
                  -Math.PI/3,           //4
                  -Math.PI/4,           //5
                  0,                    //6
                  Math.PI/4,            //7
                  Math.PI/3,            //8
                  Math.PI/2,            //9
                  Math.PI*2/3,          //10
                  Math.PI*3/4,          //11
                  Math.PI];             //12
  var qArray=[];
  for (let x=0;x<angleArray.length;x++){
    qArray.push(new THREE.Quaternion().setFromEuler(new THREE.Euler( angleArray[x], 0, 0, 'XYZ' )));
  }

  times = [0, 2, 4, 6, 8];
  position=[6,7,6,5,6];
  values = [];
  for (let x=0;x<position.length;x++){
    values.push(qArray[position[x]].x);
    values.push(qArray[position[x]].y);
    values.push(qArray[position[x]].z);
    values.push(qArray[position[x]].w);
  }
  var rotationUpperLeft = new THREE.QuaternionKeyframeTrack( 'UpperLeftArm.quaternion', times, values);

  times = [0, 2, 4, 6, 8];
  position=[7,6,7,8,7];
  values = [];
  for (let x=0;x<position.length;x++){
    values.push(qArray[position[x]].x);
    values.push(qArray[position[x]].y);
    values.push(qArray[position[x]].z);
    values.push(qArray[position[x]].w);
  }
  var rotationLowerLeft = new THREE.QuaternionKeyframeTrack( 'LowerLeftArm.quaternion', times, values);

  times = [0, 2, 4, 6, 8];
  position=[6,5,6,7,6];
  values = [];
  for (let x=0;x<position.length;x++){
    values.push(qArray[position[x]].x);
    values.push(qArray[position[x]].y);
    values.push(qArray[position[x]].z);
    values.push(qArray[position[x]].w);
  }
  var rotationUpperRight = new THREE.QuaternionKeyframeTrack( 'UpperRightArm.quaternion',times,values);

  times = [0, 2, 4, 6, 8];
  position=[7,8,7,6,7];
  values = [];
  for (let x=0;x<position.length;x++){
    values.push(qArray[position[x]].x);
    values.push(qArray[position[x]].y);
    values.push(qArray[position[x]].z);
    values.push(qArray[position[x]].w);
  }
  var rotationLowerRight = new THREE.QuaternionKeyframeTrack( 'LowerRightArm.quaternion',times,values);

  var clip = new THREE.AnimationClip("walk", duration, [rotationUpperLeft, rotationUpperRight, rotationLowerLeft, rotationLowerRight]);
  var mixer = new THREE.AnimationMixer(player);

  var AnimationAction = mixer.clipAction(clip);
  AnimationAction.clampWhenFinished=true;
  AnimationAction.timeScale = duration;

  var clock = new THREE.Clock();
  return [mixer,clock,AnimationAction];
}

export function stabVirus(player){
  var values;
  var times;
  var position;
  var duration = 12;

  var angleArray=[Math.PI*2/3,  //0
                  Math.PI*5/6,  //1
                  0,            //2
                  Math.PI/4,    //3
                  Math.PI/2];   //4

  var qArray=[];
  for (let x=0;x<angleArray.length;x++){
    qArray.push(new THREE.Quaternion().setFromEuler(new THREE.Euler( angleArray[x], 0, 0, 'XYZ' )));
  }

  times = [0, 2, 4, 12];
  position=[2, 3, 4, 2];
  values = [];
  for (let x=0;x<position.length;x++){
    values.push(qArray[position[x]].x);
    values.push(qArray[position[x]].y);
    values.push(qArray[position[x]].z);
    values.push(qArray[position[x]].w);
  }
  var rotationUpperLeft = new THREE.QuaternionKeyframeTrack( 'UpperLeftArm.quaternion', times, values);

  times = [0, 2, 4, 6, 10, 12];
  position=[2, 3, 4, 1, 4, 2];
  values = [];
  for (let x=0;x<position.length;x++){
    values.push(qArray[position[x]].x);
    values.push(qArray[position[x]].y);
    values.push(qArray[position[x]].z);
    values.push(qArray[position[x]].w);
  }
  var rotationLowerLeft = new THREE.QuaternionKeyframeTrack( 'LowerLeftArm.quaternion', times, values);


  var clip = new THREE.AnimationClip("stab", duration, [rotationUpperLeft,rotationLowerLeft]);
  var mixer = new THREE.AnimationMixer(player);

  var AnimationAction = mixer.clipAction(clip);
  AnimationAction.loop = THREE.LoopOnce;
  AnimationAction.timeScale = duration;

  var clock = new THREE.Clock();
  return [mixer,clock,AnimationAction];

}

export function spinObjects(Array){
  for (let x=0;x<Array.length;x++){
    let rotationEuler = new THREE.Euler( 0, Math.PI/25, 0, 'XYZ' );
    let rotationQuaternion = new THREE.Quaternion();
    rotationQuaternion.setFromEuler(rotationEuler);
    Array[x].applyQuaternion(rotationQuaternion);
  }
}
