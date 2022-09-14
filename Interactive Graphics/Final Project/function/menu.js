import * as THREE from 'three';
import * as room from "./room.js";

export function init(font,roomTexture,playerMesh){

  const material_0 = new THREE.MeshPhongMaterial( { color: 0x800000, emissive:0xff0000, emissiveIntensity:0.3} );
  const material_1 = new THREE.MeshPhongMaterial( { color: 0x800000} );
  const material_2 = new THREE.MeshPhongMaterial( { color: 0xffffff} );
  var scene,camera;
  var ButtonArray = [];

  scene = new THREE.Scene();
  scene.background = new THREE.Color('white');


  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );

  camera.position.y = 0;
  camera.position.z = 50;
/*---------------------------DOCTOR STUFF---------------------------*/
  let menu_player = playerMesh.clone();
  menu_player.position.x=-70;
  menu_player.position.y-=30;
  menu_player.position.z=-60;
  menu_player.children[0].rotation.y=Math.PI*-7/8;
  menu_player.children[0].children[0].rotation.y=Math.PI*-1/8;
  menu_player.children[0].children[1].rotation.set(0,Math.PI*-3/8,Math.PI*+2/10);
  menu_player.children[0].children[1].children[0].rotation.set(0,0,Math.PI*-2/10);
  menu_player.children[0].children[2].rotation.set(Math.PI*+2/10,Math.PI*+3/8,0);
  menu_player.children[0].children[3].rotation.set(Math.PI*+2/10,Math.PI*+3/8,0);
  scene.add(menu_player);

/*---------------------------TITLE STUFF---------------------------*/

  const title_geometry = new THREE.TextGeometry( 'DOWN THE VEINS!', {
    font:font,
    size: 5,
    height: 1,
    curveSegments: 20
  });

  var title = new THREE.Mesh( title_geometry, material_2);
  title.geometry.computeBoundingBox();
  title.position.x -= (title.geometry.boundingBox.max.x-title.geometry.boundingBox.min.x)/2;
  title.position.y += 24;
  scene.add(title);

/*---------------------------START BUTTON STUFF---------------------------*/
  const start_button_material = material_1.clone();
  start_button_material.needsUpdate=true;
  const start_button_geometry = new THREE.BoxGeometry(40, 10, 10);
  const start_button_mesh = new THREE.Mesh( start_button_geometry, start_button_material);
  start_button_mesh.position.y+=10;
  ButtonArray.push(start_button_mesh.uuid);
  scene.add(start_button_mesh);

  const start_text_material = material_2.clone();
  start_text_material.needsUpdate=true;
  const start_text_geometry = new THREE.TextGeometry( 'START', {
    font:font,
    size: 5,
    height: 1,
    curveSegments: 20
  });
  const start_text_mesh=new THREE.Mesh( start_text_geometry, start_text_material);
  start_text_mesh.geometry.computeBoundingBox();
  start_text_mesh.position.x -= (start_text_mesh.geometry.boundingBox.max.x-start_text_mesh.geometry.boundingBox.min.x)/2;
  start_text_mesh.position.y -= (start_text_mesh.geometry.boundingBox.max.y-start_text_mesh.geometry.boundingBox.min.y)/2;
  start_text_mesh.position.y += 10;
  start_text_mesh.position.z += 5;
  scene.add(start_text_mesh);


/*---------------------------OPTION BUTTON STUFF---------------------------*/
  const option_button_material = material_1.clone();
  option_button_material.needsUpdate=true;
  const option_button_geometry = new THREE.BoxGeometry(40, 10, 10);
  const option_button_mesh = new THREE.Mesh( option_button_geometry, option_button_material);
  option_button_mesh.position.y-=10;
  ButtonArray.push(option_button_mesh.uuid);
  scene.add(option_button_mesh);

  const option_text_material = material_2.clone();
  option_text_material.needsUpdate=true;
  const option_text_geometry = new THREE.TextGeometry( 'TUTORIAL', {
    font:font,
    size: 5,
    height: 1,
    curveSegments: 20
  });
  const option_text_mesh=new THREE.Mesh( option_text_geometry, option_text_material);
  option_text_mesh.geometry.computeBoundingBox();
  option_text_mesh.position.x -= (option_text_mesh.geometry.boundingBox.max.x-option_text_mesh.geometry.boundingBox.min.x)/2;
  option_text_mesh.position.y -= (option_text_mesh.geometry.boundingBox.max.y-option_text_mesh.geometry.boundingBox.min.y)/2;
  option_text_mesh.position.y -= 10;
  option_text_mesh.position.z += 5;
  scene.add(option_text_mesh);

/*---------------------------LIGHT STUFF---------------------------*/
  const light = new THREE.PointLight( 0xffffff, 2, 200 );
  light.position.set(0, 50, 0);
  const light1 = new THREE.PointLight( 0xffffff, 2, 200 );
  light1.position.set(0, -10, 60);
  scene.add(light);
  scene.add(light1);

/*---------------------------ROOM STUFF---------------------------*/
  var room1 = room.getRoom(200,300,200,roomTexture);
  for(let x = 0; x< room1.length; x++){
    room1[x].position.y-=30;
  }
  scene.add(room1[0]);
  scene.add(room1[1]);
  scene.add(room1[2]);
  scene.add(room1[3]);
  scene.add(room1[4]);

  return [scene,camera,ButtonArray];
}
