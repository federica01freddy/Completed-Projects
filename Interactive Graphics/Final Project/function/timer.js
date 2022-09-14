export function setTimer(minutes, seconds){
  var countDownDate = new Date().getTime() + minutes*60*1000 + seconds*1000;
  return countDownDate;
}

export function timerUpdate(countDownDate){
  // Get today's date and time
  var now = new Date().getTime();

  // Find the distance between now and the count down date
  var distance = countDownDate - now;

  return distance;
}

export function generalTimerHTMLUpdater(distance){
  // Time calculations for minutes and seconds
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((distance % (1000 * 60)) / 1000);
  document.getElementById("timer").innerHTML = "Remaining time: <br /><br />" + minutes + "m " + seconds + "s ";
}

export function generalTimerChange(){
  document.getElementById("timer").innerHTML = "VIRUS INFECTION BEGUN!!";
}

export function CheckDistance(distance){
  if (distance >= 0) {
    return false;
  }
  else
    return true;
}

export function CheckTimer(countDownDate){
  // Get today's date and time
  var now = new Date().getTime();

  // Find the distance between now and the count down date
  var distance = countDownDate - now;

  if (distance >= 0) {
    return false;
  }
  else
    return true;
}
