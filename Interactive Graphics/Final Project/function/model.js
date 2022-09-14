import * as THREE from 'three';
import {GLTFLoader} from 'gltf-url';

export function getTexture (){
  const myPromise = new Promise((resolve, reject) => {
    var textureLoader = new THREE.TextureLoader();
    textureLoader.load( "./resources/texture/surfaces.jpg", function ( map ) {
      resolve(map);
    },function ( xhr ) {
    },
    function ( error ) {
      reject(error);
    });
  });
  return myPromise;
}

export function getFont (){
  const myPromise = new Promise((resolve, reject) => {
    var fontLoader = new THREE.FontLoader();
    fontLoader.load( 'https://threejs.org/examples/fonts/gentilis_regular.typeface.json',
    function (font) {
      resolve(font);
    },
    function ( xhr ) {
    },
    function ( error ) {
      reject(error);
    });
  });
  return myPromise;
}

export function getVirusMesh () {
  const myPromise = new Promise((resolve, reject) => {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('./resources/models/Virus.gltf',
    function ( gltf ) {
      let scale=0.4;
      const virusMesh = gltf.scene.children.find((child) => child.name === "Body");
      virusMesh.scale.set(virusMesh.scale.x * scale, virusMesh.scale.y * scale, virusMesh.scale.z * scale);
      virusMesh.position.y = 60;
      virusMesh.rotation.y = Math.PI/2;
      resolve(virusMesh);
    },
    function ( xhr ) {
    },
    function ( error ) {
      console.log( 'An error happened' );
      reject(error);
    });
  });
  return myPromise;
}

export function getPlayerMesh () {
  const myPromise = new Promise((resolve, reject) => {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('./resources/models/Player.gltf',
    function ( gltf ) {
      let scale=1.5;
      const playerMesh = gltf.scene;
      playerMesh.scale.set(playerMesh.scale.x * scale, playerMesh.scale.y * scale, playerMesh.scale.z * scale);
      resolve(playerMesh);
    },
    function ( xhr ) {
    },
    function ( error ) {
      console.log( 'An error happened' );
      reject(error);
    });
  });
  return myPromise;
}

export function getVaccineMesh () {
  const myPromise = new Promise((resolve, reject) => {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('./resources/models/Vaccine.gltf',
    function ( gltf ) {
      let scale=1.5;
      const VaccineMesh = gltf.scene;
      VaccineMesh.scale.set(VaccineMesh.scale.x * scale, VaccineMesh.scale.y * scale, VaccineMesh.scale.z * scale);
      VaccineMesh.position.y += 40;
      resolve(VaccineMesh);
    },
    function ( xhr ) {
    },
    function ( error ) {
      console.log( 'An error happened' );
      reject(error);
    });
  });
  return myPromise;
}

export function getGelMesh () {
  const myPromise = new Promise((resolve, reject) => {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('./resources/models/Gel.gltf',
    function ( gltf ) {
      let scale=1.5;
      const GelMesh = gltf.scene;
      GelMesh.scale.set(GelMesh.scale.x * scale, GelMesh.scale.y * scale, GelMesh.scale.z * scale);
      GelMesh.position.y += 40;
      resolve(GelMesh);
    },
    function ( xhr ) {
    },
    function ( error ) {
      console.log( 'An error happened' );
      reject(error);
    });
  });
  return myPromise;
}

export function getMaskMesh () {
  const myPromise = new Promise((resolve, reject) => {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('./resources/models/Face_Mask.gltf',
    function ( gltf ) {
      let scale=1.5;
      const MaskMesh = gltf.scene;
      MaskMesh.scale.set(MaskMesh.scale.x * scale, MaskMesh.scale.y * scale, MaskMesh.scale.z * scale);
      MaskMesh.position.y += 40;
      resolve(MaskMesh);
    },
    function ( xhr ) {
    },
    function ( error ) {
      console.log( 'An error happened' );
      reject(error);
    });
  });
  return myPromise;
}

export function getSyringeFullMesh () {
  const myPromise = new Promise((resolve, reject) => {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('./resources/models/Syringe_full.gltf',
    function ( gltf ) {
      //let scale=1.5;
      let scale = 0.5;
      const SyringeFullMesh = gltf.scene;
      SyringeFullMesh.scale.set(SyringeFullMesh.scale.x * scale, SyringeFullMesh.scale.y * scale, SyringeFullMesh.scale.z * scale);
      SyringeFullMesh.position.y += 40;
      resolve(SyringeFullMesh);
    },
    function ( xhr ) {
    },
    function ( error ) {
      console.log( 'An error happened' );
      reject(error);
    });
  });
  return myPromise;
}

export function getSyringeEmptyMesh () {
  const myPromise = new Promise((resolve, reject) => {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('./resources/models/Syringe_empty.gltf',
    function ( gltf ) {
      let scale=0.5;
      const SyringeEmptyMesh = gltf.scene;
      SyringeEmptyMesh.scale.set(SyringeEmptyMesh.scale.x * scale, SyringeEmptyMesh.scale.y * scale, SyringeEmptyMesh.scale.z * scale);
      SyringeEmptyMesh.position.y += 40;
      resolve(SyringeEmptyMesh);
    },
    function ( xhr ) {
    },
    function ( error ) {
      console.log( 'An error happened' );
      reject(error);
    });
  });
  return myPromise;
}

export function getAudioFile () {
  const myPromise = new Promise((resolve, reject) => {
    const AudioLoader = new THREE.AudioLoader();
    AudioLoader.load('./resources/audio/HeartBeat.ogg',
    function ( audioBuffer ) {
      resolve(audioBuffer);
    },
    function ( xhr ) {
    },
    function ( error ) {
      console.log( 'An error happened' );
      reject(error);
    });
  });
  return myPromise;
}
