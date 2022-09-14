import * as THREE from 'three';
import * as MODEL from "./function/model.js";
import * as menu from "./function/menu.js";
import * as main_game from "./function/main_game.js";
import * as room from "./function/room.js";
import * as timer from "./function/timer.js";
import * as interaction from "./function/interactionObj.js";
import * as controls from "./function/controls.js";
import * as animation from "./function/animation.js";
import * as virus_func from "./function/virus.js";
import * as player_func from "./function/player.js";
import * as camera_func from "./function/camera.js";

//resource that has to be loaded
var virusMesh,roomTexture,vaccineMesh,font,sound,playerMesh,maskMesh,gelMesh,syringeFullMesh,syringeEmptyMesh,HeartBeat;

var camera, scene, renderer;
var scene_menu,camera_menu;

var pointer,raycaster,INTERSECTED;

var ButtonArrayId;

var player;
var cameraTranslation;
var enabled;

var RayCasterArray,RayCasterCameraArray;

var CameraRayCast;

var full_room;
var only_room;
var using_only_room = false;

var noPlayingField;

var syringesFull = [];
var countSyringesFullAlive;
var syringesEmpty = [];
var countSyringesEmptyAlive;
var virus = [];
var countVirusAlive;
var masks = [];
var countMasksAlive;
var gels = [];
var countGelsAlive;
var vaccines = [];
var countVaccinesAlive;

var general_time,end_time;


var remainingLive = 100;

var timerGel;
var timerMask;
var activatedMask=false;
var activatedGel=false;

var isStabbing=false;

var AmbientSound;

var mixerLeg,clockLeg,AnimationActionLeg;
var mixerArm,clockArm,AnimationActionArm;
var mixerStab,clockStab,AnimationActionStab;

var onGameLoad;

loader();

/*-----------------------LOADING MODEL WITH PROMISES-------------------------*/
function loader(){
  var virusMeshPromise = MODEL.getVirusMesh();
  var playerMeshPromise = MODEL.getPlayerMesh();
  var roomTexturePromise = MODEL.getTexture();
  var vaccinePromise = MODEL.getVaccineMesh();
  var maskPromise = MODEL.getMaskMesh();
  var gelPromise = MODEL.getGelMesh();
  var syringeEmptyPromise = MODEL.getSyringeEmptyMesh();
  var syringeFullPromise = MODEL.getSyringeFullMesh();
  var fontPromise = MODEL.getFont();
  var audioPromise = MODEL.getAudioFile();
  Promise.all([virusMeshPromise,roomTexturePromise,vaccinePromise,fontPromise,playerMeshPromise,maskPromise,gelPromise,syringeFullPromise,syringeEmptyPromise,audioPromise]).then(
    data => {
    virusMesh = data[0];
    roomTexture = data[1];
    vaccineMesh=data[2];
    font=data[3];
    playerMesh=data[4];
    maskMesh=data[5];
    gelMesh=data[6];
    syringeFullMesh=data[7];
    syringeEmptyMesh=data[8];
    HeartBeat=data[9];
    init();
  },error => {
    console.log( 'An error happened:',error );
  });
}

/*-----------------------INITIALIZING THE SCENES-------------------------*/
function init() {
  enabled=controls.init();

  pointer = new THREE.Vector2();

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth,window.innerHeight);
  document.body.appendChild(renderer.domElement);

/*---------------------------MAIN MENU STUFF---------------------------*/
  var temp = menu.init(font,roomTexture,playerMesh);
  scene_menu = temp[0];
  camera_menu = temp [1];
  ButtonArrayId = temp [2];

/*---------------------------MAIN SCENE STUFF---------------------------*/
  syringeFullMesh.name = 'syringeFull';
  syringeEmptyMesh.userData.tag = 'syringeEmpty';
  virusMesh.userData.tag = 'virus';
  vaccineMesh.userData.tag = 'vaccine';
  maskMesh.userData.tag = 'mask';
  gelMesh.userData.tag = 'gel';

  temp = main_game.init(roomTexture,playerMesh,syringeEmptyMesh,syringeFullMesh);
  scene = temp[0];
  camera = temp [1];
  player = temp[2];
  cameraTranslation = temp[3];
  full_room = temp[4];
  only_room = temp[5];
  noPlayingField = temp[6];



  noPlayingField = interaction.removePlayerPosition(player, noPlayingField);

  countMasksAlive = 10;
  temp = interaction.spreadingObj(countMasksAlive, maskMesh, noPlayingField, scene);
  masks = temp[0];
  noPlayingField = temp[1];

  countGelsAlive = 10;
  temp = interaction.spreadingObj(countGelsAlive, gelMesh, noPlayingField, scene);
  gels = temp[0];
  noPlayingField = temp[1];

  countVaccinesAlive = 40;
  temp  = interaction.spreadingObj(countVaccinesAlive, vaccineMesh, noPlayingField, scene);
  vaccines = temp[0];
  noPlayingField = temp[1];

  temp = animation.walkingPlayerLeg(player);
  mixerLeg = temp[0];
  clockLeg = temp[1];
  AnimationActionLeg = temp[2];

  temp = animation.walkingPlayerArm(player);
  mixerArm = temp[0];
  clockArm = temp[1];
  AnimationActionArm = temp[2];

  temp = animation.stabVirus(player);
  mixerStab = temp[0];
  clockStab = temp[1];
  AnimationActionStab = temp[2];

  // instantiate a listener
  const audioListener = new THREE.AudioListener();

  AmbientSound = new THREE.Audio( audioListener );

  camera.add( audioListener );
  scene.add( AmbientSound );

  AmbientSound.setBuffer( HeartBeat );
  AmbientSound.setLoop(true);


/*---------------------------MENU RAYCASTER---------------------------*/
  raycaster=new THREE.Raycaster();

/*---------------------------PLAYER RAYCASTER---------------------------*/
  RayCasterArray = player_func.initPlayerRay();

/*---------------------------EVENT LISTENER---------------------------*/
  document.addEventListener( 'mousemove', onPointerMove );
  document.addEventListener( 'click', onMouseClick );
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('keydown',function(event){
    temp=controls.keypressedAgent(event,enabled,end_time,general_time,AmbientSound);
    enabled=temp[0];
    end_time=temp[1];
  }, false);
  window.addEventListener('keyup',function(event){enabled=controls.keyreleasedAgent(event,enabled);}, false);

/*---------------------------ANIMATION LOOP---------------------------*/
  window.requestAnimationFrame(animate);
}



function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  camera_menu.aspect = window.innerWidth / window.innerHeight;
  camera_menu.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
  window.requestAnimationFrame(animate);
}

function onPointerMove( event ) {
  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onMouseClick( event ) {
  switch(enabled.stato) {
    case 0:
      if(INTERSECTED!=null){
        if (INTERSECTED.uuid == ButtonArrayId[0]){
          enabled.stato=1;
          onGameLoad=true;
          document.getElementById( 'blocker' ).style.display = '';
          document.getElementById( 'loading' ).style.display = '';
        }
        if (INTERSECTED.uuid == ButtonArrayId[1]){
          document.getElementById( 'blocker' ).style.display = 'block';
          document.getElementById( 'instructions' ).style.display = '';
          enabled.stato = 4;
        }
      }
      break;
  }
}

function animate() {
   setTimeout( function() {

       requestAnimationFrame( animate );
       render();
       update();

   }, 1000 / 60 );
 }

function render(){
  switch( enabled.stato) {
    case 0:
      renderer.render( scene_menu, camera_menu );
      break;
    case 1:
      renderer.render( scene, camera );
      mixerLeg.update(clockLeg.getDelta());
      mixerArm.update(clockArm.getDelta());
      break;
    case 2:
      renderer.render( scene, camera );
      mixerLeg.update(clockLeg.getDelta());
      mixerArm.update(clockArm.getDelta());
      mixerStab.update(clockStab.getDelta());
      break;
    case 3:
      renderer.render( scene, camera );
      break;
  }
}

function update(){
  switch( enabled.stato) {

    //MAIN MENU
    case 0:
      raycaster.setFromCamera( pointer, camera_menu );
      const intersects = raycaster.intersectObjects( scene_menu.children);

      if ( intersects.length > 0 && (ButtonArrayId.includes(intersects[ 0 ].object.uuid))) {
        if ( INTERSECTED != intersects[ 0 ].object) {
          if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
          INTERSECTED = intersects[ 0 ].object;
          INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
          INTERSECTED.material.emissive.setHex( 0xff0000 );
        }
      }
      else if ( intersects.length > 2 && (ButtonArrayId.includes(intersects[ 1 ].object.uuid))) {
        if ( INTERSECTED != intersects[ 1 ].object) {
          if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
          INTERSECTED = intersects[ 1 ].object;
          INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
          INTERSECTED.material.emissive.setHex( 0xff0000 );
        }
      }
      else {
        if ( INTERSECTED ) {
          INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
        }
        INTERSECTED = null;
      }

      break;

    //PUZZLE PART
    case 1:
      //ON LOAD WHAT HAPPENS
      if (onGameLoad){
        document.getElementById( 'blocker' ).style.display = 'none';
        document.getElementById( 'loading' ).style.display = 'none';
        end_time=timer.setTimer(1,30);
        AmbientSound.play();
        onGameLoad=false;
      }

      general_time=timer.timerUpdate(end_time);
      timer.generalTimerHTMLUpdater(timer.timerUpdate(end_time));

      //Get player movement
      var direction = player_func.getPlayerMovement(player,camera,enabled,RayCasterArray,full_room);

      /*---------------------------KEYFRAME ANIMATION---------------------------*/
      if (direction.equals(new THREE.Vector3(0,0,0))){
        AnimationActionLeg.stop();
        AnimationActionArm.stop();
      }
      else{
        AnimationActionLeg.play();
        AnimationActionArm.play();
      }

      /*---------------------------OBJECT SPINNING ANIMATION---------------------------*/
      animation.spinObjects(vaccines);
      animation.spinObjects(masks);
      animation.spinObjects(gels);

      /*---------------------------INTERACTION OBJECTS---------------------------*/
      countVaccinesAlive = interaction.interactionPlayerObject(vaccines, player.position.x, player.position.z, countVaccinesAlive, 20);
      countMasksAlive = interaction.interactionPlayerObject(masks, player.position.x, player.position.z, countMasksAlive, 20);
      countGelsAlive = interaction.interactionPlayerObject(gels, player.position.x, player.position.z, countGelsAlive, 20);

      /*---------------------------INTERACTION OBJECTS---------------------------*/
      if (countVaccinesAlive<40){
        playerMesh.children[0].children[1].children[0].children[0].visible=true;
        playerMesh.children[0].children[1].children[0].children[1].visible=false;
      }

      //END OF MAZE PART TRIGGER
      if(timer.CheckDistance(general_time)){
        //CHANGE TIMER TO VIRUS INFECTION
        timer.generalTimerChange();

        //SWAP ROOM
        scene.add(only_room);
        scene.remove(scene.children.find((child) => child.name === "full_room"));

        //REMOVE ALL THE OBJECTS
        interaction.disappearObject(vaccines);
        interaction.disappearObject(masks);
        interaction.disappearObject(gels);

        noPlayingField = interaction.removePlayerPosition(player, []);
        countVirusAlive = 10;
        var temp = interaction.spreadingObj(countVirusAlive, virusMesh, noPlayingField, scene);
        virus = temp[0];
        noPlayingField = temp[1];

        document.getElementById("contact").innerHTML = "&#128156 " + remainingLive + "%";

        enabled.stato = 2;
        AmbientSound.pause();
        AmbientSound.playbackRate=2;
        AmbientSound.play();
      }

      break;
    //VIRUS FIGHT
    case 2:

      //Get player movement
      direction = player_func.getPlayerMovement(player,camera,enabled,RayCasterArray,only_room);

      /*---------------------------KEYFRAME ANIMATION---------------------------*/
      if (direction.equals(new THREE.Vector3(0,0,0))){
        AnimationActionLeg.stop();
        AnimationActionArm.stop();
      }
      else{
        AnimationActionLeg.play();
        if(!isStabbing){
          AnimationActionArm.play();
        }
      }

      /*---------------------------STABBING ANIMATION---------------------------*/
      if(enabled.z){
        if(vaccines.length - countVaccinesAlive > 0){
          countVirusAlive = interaction.interactionPlayerObject(virus, player.position.x, player.position.z, countVirusAlive, 70);
          countVaccinesAlive = interaction.vaccineVirus(countVaccinesAlive, vaccines);
        }
        AnimationActionArm.stop();
        AnimationActionStab.play();
        enabled.z=false;
        isStabbing=true;
      }
      mixerStab.addEventListener( 'finished', function( e ) {
        isStabbing=false;
        AnimationActionStab.stop();
        AnimationActionArm.play();
      } );
      if(vaccines.length - countVaccinesAlive<=0){
        playerMesh.children[0].children[1].children[0].children[0].visible=false;
        playerMesh.children[0].children[1].children[0].children[1].visible=true;
      }

      /*---------------------------VIRUS LOGIC---------------------------*/
      virus_func.detectionVirus(player, virus,activatedGel);
      virus_func.chasePlayer(player,virus);

      /*---------------------------VIRUS DAMAGE---------------------------*/
      if(!activatedMask){
        remainingLive = interaction.contactWithVirus(virus,player,remainingLive);
      }

      /*---------------------------MASK LOGIC---------------------------*/
      //activate the mask
      if(enabled.x && !activatedMask &&(masks.length-countMasksAlive) > 0){
        countMasksAlive = interaction.maskVirus(masks,countMasksAlive);
        timerMask=timer.setTimer(0,5);
        activatedMask = true;
      }

      //deactivate the mask after elapsed time
      if(activatedMask&&timer.CheckTimer(timerMask)){
        activatedMask = false;
      }

      /*---------------------------GEL LOGIC---------------------------*/
      if (enabled.c && !activatedGel && (gels.length-countGelsAlive) > 0){
        countGelsAlive = interaction.gelVirus(gels,countGelsAlive);
        timerGel=timer.setTimer(0,5);
        enabled.scale=6;
        activatedGel = true;
      }

      //deactivate the gel after elapsed time
      if(activatedGel&&timer.CheckTimer(timerGel)){
        enabled.scale=2;
        activatedGel = false;
      }

      /*---------------------------END OF GAME TRIGGER---------------------------*/
      //YOU LOSE
      if (remainingLive<=0){
        enabled.stato=5;
        document.getElementById('blocker').style.display = '';
        document.getElementById('end_page').style.display = '';
        document.getElementById('end_page').innerHTML = "YOU HAVE BEEN DEFEATED";
        let arrayDisactivation = ['virus','gel','mask','vaccine','timer','contact'];
        for (let x =0; x<arrayDisactivation.length;x++){
          document.getElementById(arrayDisactivation[x]).style.display = 'none';
        }
        AmbientSound.pause();
      }
      //YOU WIN
      if (countVirusAlive<=0){
        enabled.stato=5;
        document.getElementById('blocker').style.display = '';
        document.getElementById('end_page').style.display = '';
        document.getElementById('end_page').innerHTML = "YOU WON</br>YOU HAVE DEFEATED THE INFECTION!!!";
        let arrayDisactivation = ['virus','gel','mask','vaccine','timer','contact'];
        for (let x =0; x<arrayDisactivation.length;x++){
          document.getElementById(arrayDisactivation[x]).style.display = 'none';
        }
        AmbientSound.pause();
      }

      break;
  }
}
