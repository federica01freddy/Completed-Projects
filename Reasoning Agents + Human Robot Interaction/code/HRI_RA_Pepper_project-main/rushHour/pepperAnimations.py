import sys
import os

sys.path.append(os.getenv('PEPPER_TOOLS_HOME')+'/cmd_server')
import pepper_cmd
from pepper_cmd import *
    
def hello(robot):

  session = robot.session_service("ALMotion")

  isAbsolute = True
  # hello posture
  jointNames = ["RElbowRoll", "RElbowYaw", "RHand", "RShoulderPitch", "RShoulderRoll", "RWristYaw"]
  #jointValues_gradi = [76.2, 81.9, 0.98, -1.9, -6.2, -58.2]
  # jointValues is expressed in radiant, in particular: [rad/10, rad/10, rad, rad, rad/10, rad/10]
  jointValues = [1.32, 1.42, 1.71, -0.03, -0.10, -1.01]
  times = [0.8, 0.8, 0.8, 0.8, 0.8, 0.8]
  session.angleInterpolation(jointNames, jointValues, times, isAbsolute)
  
  # arm to the right
  session.angleInterpolation("RElbowYaw", 1.83, 0.8, isAbsolute)
  
  # arm to the left
  session.angleInterpolation("RElbowYaw", 1.04, 0.8, isAbsolute)
  
  # arm to the right
  session.angleInterpolation("RElbowYaw", 1.42, 0.8, isAbsolute)

  robot.normalPosture()
  return

def pepperSad(robot):
  # animazione del robot quando perde
  session = robot.session_service("ALMotion")
  
  isAbsolute = True
  # defeat posture
  jointNames = ["RElbowRoll", "RElbowYaw", "RShoulderPitch", "RShoulderRoll", "LElbowRoll", "LElbowYaw", "LShoulderPitch", "LShoulderRoll", "HeadPitch", "HipPitch"]
  # jointValues_gradi = [79.2, 21.9, 76.3, -40.0, -81.6, -19.1, 71.1, 40.1, 25.5, -30]
  # jointValues is expressed in radiant, in particular: [rad/10, rad/10, rad/10, rad, rad/10, rad/10, rad/10, rad/10, rad/10, rad]
  jointValues = [1.38, 0.382, 1.33, -0.69, -1.42, -0.333, 1.24, 0.699, 0.445, -0.52]
  times = [0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6]
  session.angleInterpolation(jointNames, jointValues, times, isAbsolute)
  [22.0, -22.0]

  # pepper shakes his head
  # gradi = 22.0 --> rad = 0.38
  session.angleInterpolation("HeadYaw", 0.30, 0.4, isAbsolute)
  
  # gradi = -22.0 --> rad = -0.38
  session.angleInterpolation("HeadYaw", -0.30, 0.4, isAbsolute)

  # gradi = 22.0 --> rad = 0.38
  session.angleInterpolation("HeadYaw", 0.30, 0.4, isAbsolute)
  
  robot.normalPosture()
  return

def pepperVictory(robot):
  # animazione del robot quando vince il gioco
  session = robot.session_service("ALMotion")

  isAbsolute = True

  jointNames = ["RShoulderPitch", "RShoulderRoll", "RElbowRoll", "RWristYaw", "RHand", "HipRoll", "HeadPitch", "LShoulderPitch", "LShoulderRoll", "LElbowRoll", "LWristYaw", "LHand"]
  jointValues = [-0.141, -0.46, 0.892, -0.8, 0.98, -0.07, -0.07, -0.141, 0.46, -0.892, 0.8, 0.98]
  times  = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
  session.angleInterpolation(jointNames, jointValues, times, isAbsolute)
  
  for i in range(2):
    jointNames = ["RElbowYaw", "LElbowYaw", "HipRoll", "HeadPitch"]
    jointValues = [2.7, -1.3, -0.07, -0.07]
    times  = [0.6, 0.6, 0.6, 0.6]
    session.angleInterpolation(jointNames, jointValues, times, isAbsolute)

    jointNames = ["RElbowYaw", "LElbowYaw", "HipRoll", "HeadPitch"]
    jointValues = [1.3, -2.7, -0.07, -0.07]
    times  = [0.6, 0.6, 0.6, 0.6]
    session.angleInterpolation(jointNames, jointValues, times, isAbsolute)
  
  robot.normalPosture()
  return

def handShaking(robot):
  # animazione del robot quando stringe la mano all'umano
  session = robot.session_service("ALMotion")
  
  isAbsolute = True

  # pepper raises his arm and opens his hand
  jointNames = ["RElbowRoll","RElbowYaw","RHand","HeadPitch","HeadYaw"]
  jointValues = [1.25,1.63,0.98,0.052,-0.31] #in degree [71.61,93.39,0.98,3,-18]
  session.angleInterpolation(jointNames, jointValues, 0.8, isAbsolute)
  # pepper shakes the hand of the human
  for i in range(3):
    jointNames = ["RElbowRoll","RHand"]
    jointValues = [1.53,0.54] #in degree [87.66,0.54]
    session.angleInterpolation(jointNames, jointValues, 0.3, isAbsolute)
    jointValues = [1.15,0.54] #in degree [65.89,0.54]
    session.angleInterpolation(jointNames, jointValues, 0.3, isAbsolute)
    if i==2:
      jointNames = ["RElbowRoll","RHand"]
      jointValues = [1.53,0.54] #in degree [87.66,0.54]
      session.angleInterpolation(jointNames, jointValues, 0.3, isAbsolute)
  # pepper opens his hand to release the human hand
  session.angleInterpolation("RHand", 0.98, 0.3, isAbsolute)
  
  robot.normalPosture()
  return



def moveHorizontalRight(robot):
  # animazione del robot quando muove la macchina in orizzontale verso destra
  session = robot.session_service("ALMotion")
  isAbsolute = True

  # move posture
  jointNames = ["RElbowRoll", "RElbowYaw", "RHand", "RShoulderPitch", "RShoulderRoll", "RWristYaw"]
  jointValues = [1.30, 1.28,  0.92, 1.20, -0.92, -0.60]
  times = [0.8, 0.8, 0.8, 0.8, 0.8, 0.8]
  session.angleInterpolation(jointNames, jointValues, times, isAbsolute)
  
  # robot hand grasps cars
  session.angleInterpolation("RHand", 0.52, 0.3, isAbsolute)
  
  # arm that slides to move the car
  jointNames = ["RElbowRoll", "RElbowYaw", "RShoulderRoll", "RWristYaw"]
  jointValues = [1.38, 1.23, -0.25, -1.22]
  times = [0.6, 0.6, 0.6, 0.6]
  session.angleInterpolation(jointNames, jointValues, times, isAbsolute)

  robot.normalPosture()
  return

def moveHorizontalLeft(robot):
  # animazione del robot quando muove la macchina in orizzontale verso sinistra
  session = robot.session_service("ALMotion")
  isAbsolute = True

  # move posture
  jointNames = ["RElbowRoll", "RElbowYaw", "RHand", "RShoulderPitch", "RShoulderRoll", "RWristYaw"]
  jointValues = [1.38, 1.23, 0.92, 1.20, -0.25, -1.22]
  times = [0.8, 0.8, 0.8, 0.8, 0.8, 0.8]
  session.angleInterpolation(jointNames, jointValues, times, isAbsolute)
  
  # hand grasps cars
  session.angleInterpolation("RHand", 0.52, 0.3, isAbsolute)
  
  # arm that slides to move the car
  jointNames = ["RElbowRoll", "RElbowYaw", "RShoulderRoll", "RWristYaw"]
  jointValues = [1.30, 1.28, -0.92, -0.60]
  times = [0.6, 0.6, 0.6, 0.6]
  session.angleInterpolation(jointNames, jointValues, times, isAbsolute)

  robot.normalPosture()
  return

def moveVerticalUp(robot):
  # animazione del robot quando muove la macchina in verticale verso l'alto
  session = robot.session_service("ALMotion")
  isAbsolute = True

  # move posture
  jointNames = ["RElbowRoll", "RElbowYaw", "RHand", "RShoulderPitch", "RShoulderRoll", "RWristYaw"]
  jointValues = [1.34, 1.39, 0.92, 1.20, -0.26, -1.17]
  times = [0.8, 0.8, 0.8, 0.8, 0.8, 0.8]
  session.angleInterpolation(jointNames, jointValues, times, isAbsolute)
  
  # hand grasps cars
  session.angleInterpolation("RHand", 0.52, 0.3, isAbsolute)
  
  # arm that slides to move the car
  jointNames = ["RElbowRoll", "RShoulderPitch"]
  jointValues = [0.91, 0.83]
  times = [0.6, 0.6]
  session.angleInterpolation(jointNames, jointValues, times, isAbsolute)
  
  robot.normalPosture()
  return

def moveVerticalDown(robot):
  # animazione del robot quando muove la macchina in verticale verso il basso
  session = robot.session_service("ALMotion")
  isAbsolute = True

  # move posture
  jointNames = ["RElbowRoll", "RElbowYaw", "RHand", "RShoulderPitch", "RShoulderRoll", "RWristYaw"]
  jointValues = [0.91, 1.39, 0.92, 0.83, -0.26, -1.17]
  times = [0.8, 0.8, 0.8, 0.8, 0.8, 0.8]
  session.angleInterpolation(jointNames, jointValues, times, isAbsolute)
  
  # hand grasps cars
  session.angleInterpolation("RHand", 0.52, 0.3, isAbsolute)
  
  # arm that slides to move the car
  jointNames = ["RElbowRoll", "RShoulderPitch"]
  jointValues = [1.34, 1.20]
  times = [0.6, 0.6]
  session.angleInterpolation(jointNames, jointValues, times, isAbsolute)
  
  robot.normalPosture()
  return