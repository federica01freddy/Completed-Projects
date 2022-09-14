import * as interaction from "./interactionObj.js";

export function init(){
  var enabled={
    "q":false,
    "w":false,
    "e":false,
    "a":false,
    "s":false,
    "d":false,
    "escape":false,
    "r":1,
    "l":false,
    "z":false,
    "old":1,
    "scale":2,
    "stato":0
  };
  return enabled;
}
export function keypressedAgent(event,enabled,end_time,time_remaining,AmbientSound) {
  switch(event.key) {
    case 'q':
      enabled[event.key]=true;
      break;
    case 'w':
      enabled[event.key]=true;
      break;
    case 'e':
      enabled[event.key]=true;
      break;
    case 'a':
      enabled[event.key]=true;
      break;
    case 's':
      enabled[event.key]=true;
      break;
    case 'd':
      enabled[event.key]=true;
      break;
    case 'Escape':
      if(enabled.stato == 1 || enabled.stato == 2 || enabled.stato == 3){
        enabled[event.key]=!enabled[event.key];
        if (enabled[event.key]) {
          AmbientSound.pause();
          enabled.old=enabled.stato;
          enabled.stato=3;
          document.getElementById( 'blocker' ).style.display = '';
          document.getElementById( 'pause_menu' ).style.display = '';
          document.getElementById( 'contact' ).style.display = 'none';
        }
        else {
          AmbientSound.play();
          enabled.stato=enabled.old;
          end_time= new Date().getTime() + time_remaining;
          document.getElementById( 'blocker' ).style.display = 'none';
          document.getElementById( 'pause_menu' ).style.display = 'none';
          document.getElementById( 'contact' ).style.display = '';
        }
      }
      if(enabled.stato == 4){
        document.getElementById( 'blocker' ).style.display = 'none';
        document.getElementById( 'instructions' ).style.display = 'none';
        enabled.stato = 0;
      }
      break;
    case 'r':
      enabled[event.key]++;
      if (enabled[event.key]==2) enabled[event.key] = 0;
      break;
    case 'l':
      enabled[event.key]=true;
      break;
    case 'z':
      enabled[event.key]=true;
      break;
    case 'x':
      enabled[event.key]=true;
      break;
    case 'c':
      enabled[event.key]=true;
      break;
  }
  return [enabled,end_time];
}

export function keyreleasedAgent(event,enabled) {
  switch(event.key) {
    case 'q':
      enabled[event.key]=false;
      break;
    case 'w':
      enabled[event.key]=false;
      break;
    case 'e':
      enabled[event.key]=false;
      break;
    case 'a':
      enabled[event.key]=false;
      break;
    case 's':
      enabled[event.key]=false;
      break;
    case 'd':
      enabled[event.key]=false;
      break;
    case 'l':
      enabled[event.key]=false;
      break;
    case 'z':
      enabled[event.key]=false;
      break;
    case 'x':
      enabled[event.key]=false;
      break;
    case 'c':
      enabled[event.key]=false;
      break;
  }
  return enabled;
}
