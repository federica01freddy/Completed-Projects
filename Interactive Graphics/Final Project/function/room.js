import * as THREE from 'three';


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
export function getRoom (width, height, depth, veinTex) {
    var mesh = new THREE.Mesh();
    //var room = new THREE.Group();
    veinTex.wrapS = THREE.RepeatWrapping;
    veinTex.wrapT = THREE.RepeatWrapping;
    var tex_base=veinTex.clone();
    tex_base.needsUpdate = true;
    var tex_wall12=veinTex.clone(true);
    tex_wall12.needsUpdate = true;
    var tex_wall34=veinTex.clone(true);
    tex_wall34.needsUpdate = true;

    tex_base.repeat.set(width/width*5,depth/width*5);
    tex_wall12.repeat.set(depth/height*3,height/height*3);
    tex_wall34.repeat.set(width/height*3,height/height*3);

    const material_base = new THREE.MeshPhongMaterial( { color: 0x800000, map: tex_base, bumpMap: tex_base } );
    const material_1 = new THREE.MeshPhongMaterial( { color: 0x800000, map: tex_wall12, bumpMap: tex_wall12 } );
    const material_2 = new THREE.MeshPhongMaterial( { color: 0x800000, map: tex_wall34, bumpMap: tex_wall34 } );

    var base_width = width;
    var base_height = 0.1;
    var base_depth = depth;
    const geometry_1 = new THREE.BoxGeometry(base_width, base_height, base_depth);


    const base = new THREE.Mesh( geometry_1, material_base);
    base.position.set(0.0, 0.0, 0.0);

    var wall_width = base_height;
    var wall_height =  height;
    var wall_depth = base_depth;
    const geometry_2 = new THREE.BoxGeometry(wall_width, wall_height, wall_depth);
    const wall1 = new THREE.Mesh( geometry_2, material_1);
    const wall2 = new THREE.Mesh( geometry_2, material_1);
    wall1.position.set(-(base_width/2 - wall_width/2), (wall_height/2 + base_height/2), 0.0);
    wall2.position.set((base_width/2 - wall_width/2), (wall_height/2 + base_height/2), 0.0);

    wall_width = base_width;
    wall_depth = base_height;
    const geometry_3 = new THREE.BoxGeometry(wall_width, wall_height, wall_depth);
    const wall3 = new THREE.Mesh( geometry_3, material_2);
    const wall4 = new THREE.Mesh( geometry_3, material_2);
    wall3.position.set(0.0, wall_height/2 + base_height/2, -(wall_depth/2 - base_depth/2));
    wall4.position.set(0.0, wall_height/2 + base_height/2, (wall_depth/2 - base_depth/2));

    //room.translateX(100)
    return [base, wall1, wall2, wall3, wall4];
}

export function getObstacle (width, height, depth, veinTex) {
    veinTex.wrapS = THREE.RepeatWrapping;
    veinTex.wrapT = THREE.RepeatWrapping;

    var tex_0=veinTex.clone();
    tex_0.needsUpdate = true;
    var tex_1=veinTex.clone(true);
    tex_1.needsUpdate = true;
    var tex_2=veinTex.clone(true);
    tex_2.needsUpdate = true;

    tex_0.repeat.set(width/height*5,depth/height*5);
    tex_1.repeat.set(depth/height*5,height/height*5);
    tex_2.repeat.set(width/height*5,height/height*5);

    const material_0 = new THREE.MeshPhongMaterial( { color: 0x800000, map: tex_0, bumpMap: tex_0 } );
    const material_1 = new THREE.MeshPhongMaterial( { color: 0x800000, map: tex_1, bumpMap: tex_1 } );
    const material_2 = new THREE.MeshPhongMaterial( { color: 0x800000, map: tex_2, bumpMap: tex_2 } );

    var material=[material_1,material_1,material_0,material_0,material_2,material_2];

    const geometry = new THREE.BoxGeometry(width, height, depth);

    const obstacle = new THREE.Mesh( geometry, material);
    obstacle.position.y=height/2;

    return(obstacle);
}

export function getMaze(veinTex){
  var noPlayingField = [];
  var full_room = new THREE.Group();
  var room = new THREE.Group();
  var temp = getRoom(1000.0, 700.0, 1000.0, veinTex);
  room.add(temp[0].clone());
  room.add(temp[1].clone());
  room.add(temp[2].clone());
  room.add(temp[3].clone());
  room.add(temp[4].clone());

  full_room.add(temp[0]);
  full_room.add(temp[1]);
  full_room.add(temp[2]);
  full_room.add(temp[3]);
  full_room.add(temp[4]);
//1
  temp = getObstacle(200.0, 700.0, 200.0, veinTex);
  temp.translateX(400.0);
  temp.translateZ(400.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//2
  temp = getObstacle(100.0, 700.0, 100.0, veinTex);
  temp.translateX(200.0);
  temp.translateZ(200.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//3
  temp = getObstacle(250.0, 700.0, 250.0, veinTex);
  temp.translateX(-375.0);
  temp.translateZ(375.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//4
  temp = getObstacle(100.0, 700.0, 100.0, veinTex);
  temp.translateX(-250.0);
  temp.translateZ(200.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//5
  temp = getObstacle(100.0, 700.0, 200.0, veinTex);
  temp.translateX(-150.0);
  temp.translateZ(300.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//6
  temp = getObstacle(400.0, 700.0, 150.0, veinTex);
  temp.translateX(-300.0);
  temp.translateZ(-425.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//7
  temp = getObstacle(100.0, 700.0, 80.0, veinTex);
  temp.translateX(-50.0);
  temp.translateZ(-460.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//8
  temp = getObstacle(200.0, 700.0, 50.0, veinTex);
  temp.translateX(-5.0);
  temp.translateZ(-350.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//9
  temp = getObstacle(200.0, 700.0, 200.0, veinTex);
  temp.translateX(250.0);
  temp.translateZ(-350.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//10
  temp = getObstacle(100.0, 700.0, 100.0, veinTex);
  temp.translateX(250.0);
  temp.translateZ(-250.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//11
  temp = getObstacle(200.0, 700.0, 50.0, veinTex);
  temp.translateX(340.0);
  temp.translateZ(-370.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//12
  temp = getObstacle(200.0, 700.0, 200.0, veinTex);
  temp.translateX(-200.0);
  temp.translateZ(-50.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//13
  temp = getObstacle(160.0, 700.0, 200.0, veinTex);
  temp.translateX(240.0);
  temp.translateZ(80.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//14
  temp = getObstacle(50.0, 700.0, 200.0, veinTex);
  temp.translateX(230.0);
  temp.translateZ(-5.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//15
  temp = getObstacle(100.0, 700.0, 400.0, veinTex);
  temp.translateX(50.0);
  temp.translateZ(300.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//16
  temp = getObstacle(100.0, 700.0, 100.0, veinTex);
  temp.translateX(-50.0);
  temp.translateZ(-75.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//17
  temp = getObstacle(20.0, 700.0, 140.0, veinTex);
  temp.translateX(160.0); //200
  temp.translateZ(400.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//18
  temp = getObstacle(20.0, 700.0, 140.0, veinTex);
  temp.translateX(240.0); //280
  temp.translateZ(400.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//19
  temp = getObstacle(80.0, 700.0, 20.0, veinTex);
  temp.translateX(200.0);
  temp.translateZ(340.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//20
  temp = getObstacle(100.0, 700.0, 20.0, veinTex);
  temp.translateX(450.0);
  temp.translateZ(-150.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//20
  temp = getObstacle(20.0, 700.0, 350.0, veinTex);
  temp.translateX(400.0);
  temp.translateZ(-65.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//21
  temp = getObstacle(20.0, 700.0, 220.0, veinTex);
  temp.translateX(-450.0);
  temp.translateZ(-250.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//22
  temp = getObstacle(150.0, 700.0, 20.0, veinTex);
  temp.translateX(-380.0);
  temp.translateZ(-270.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//23
  temp = getObstacle(20.0, 700.0, 60.0, veinTex);
  temp.translateX(-330.0);
  temp.translateZ(-230.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//24
  temp = getObstacle(120.0, 700.0, 20.0, veinTex);
  temp.translateX(-440.0);
  temp.translateZ(-50.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//25
  temp = getObstacle(20.0, 700.0, 150.0, veinTex);
  temp.translateX(-390.0);
  temp.translateZ(-110.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
//26
  temp = getObstacle(400.0, 700.0, 20.0, veinTex);
  temp.translateX(-300.0);
  temp.translateZ(100.0);
  full_room.add(temp);
  noPlayingField = NOplayingField(temp,noPlayingField);
  return[full_room, room, noPlayingField];
}

function NOplayingField(temp,noPlayingField){
    var x = temp.position.x;
    var z = temp.position.z;
    var width = temp.geometry.parameters.width;
    var depth = temp.geometry.parameters.depth;
    var x_max = x+(width/2);// + 15;
    var x_min = x-(width/2);// - 15;
    var z_max = z+(depth/2);// + 15;
    var z_min = z-(depth/2);// - 15;
    var noObjects = {
      "x_max":x_max,
      "x_min":x_min,
      "z_max":z_max,
      "z_min":z_min,
    };
    noPlayingField.push(noObjects);
    return noPlayingField;
}
