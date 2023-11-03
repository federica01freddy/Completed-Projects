import os
import sys

sys.path.append(os.getenv('PEPPER_TOOLS_HOME')+'/cmd_server')

import pepper_cmd
from pepper_cmd import *

memkey = {
        'SonarFront': 'Device/SubDeviceList/Platform/Front/Sonar/Sensor/Value',
        'SonarBack':  'Device/SubDeviceList/Platform/Back/Sonar/Sensor/Value' }

# Initially setup sonar sensors to a large distance (10 meters)
def initSonar(robot):
    robot.memory_service.insertData(memkey['SonarFront'], 10.0)
    robot.memory_service.insertData(memkey['SonarBack'], 10.0)
    
    print 'SonarFront: ' + str(robot.memory_service.getData(memkey['SonarFront']))
    print 'SonarBack: ' + str(robot.memory_service.getData(memkey['SonarBack']))

# Pretend to scan the environment for a human. In reality, the human position is passed as a parameter to the function
# The position is then inserted into the memory relative to the sonar sensor and retrieved as we would do in a real scenario
# The function returns True if a human closer than 1.5m is detected, False otherwise
def scanEnvironment(robot, humanPos):

    robot.memory_service.insertData(memkey['SonarFront'], float(humanPos))
    
    # Detect human only if at a distance of less than 1.5 meters
    humanDetected = True if robot.memory_service.getData(memkey['SonarFront']) < 1.5 else False
    print 'SonarFront: ' + str(robot.memory_service.getData(memkey['SonarFront']))

    return humanDetected

    

