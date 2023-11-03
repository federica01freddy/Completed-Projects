import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web
import socket
import time
import argparse
import qi
from threading import Thread, Timer
import os
import sys
import json

from tornado.websocket import websocket_connect


sys.path.append(os.getenv('PEPPER_TOOLS_HOME')+'/cmd_server')

from sonar import initSonar, scanEnvironment
from pepperAnimations import *

import pepper_cmd
from pepper_cmd import *

websocket_server = None     # websocket handler
run = True                  # main_loop run flag
difficultyLevel = 0         # difficulty level
surveyResults = []
currentPlayer = None
startFromZero = True

class PlannerClient(object):
    def __init__(self, message, websocket_server):
        self.message = message
        self.websocket_server = websocket_server
        self.ws_client = None
        self.connect()

    @tornado.gen.coroutine
    def on_message(self, message):
        #print "Received message: %s" % message
        
        if (message == None):
            return
        config = json.loads(message)
        if ('level' in config['id']):
            self.websocket_server.write_message(json.dumps(config, indent=4))
        elif (config['id'] == 'nextMove'):
            #print 'Sto ricevendo la configurazione dal planner'
            self.websocket_server.write_message(json.dumps(config, indent=4))
        
        
        

    @tornado.gen.coroutine
    def send_message(self, message):
        self.write_message(message)

    @tornado.gen.coroutine
    def connect(self):
        self.ws_client = yield websocket_connect('ws://localhost:9020/websocketserver', on_message_callback=self.on_message)
        #print "Test here"
        self.ws_client.write_message(self.message)
        

class HumanSpeakClient(object):
    def __init__(self, message, websocket_server):
        self.message = message
        self.websocket_server = websocket_server
        self.ws_client = None
        self.connect()

    @tornado.gen.coroutine
    def on_message(self, message):
        global robot
        if (message == None):
            return
        elif ('answer' in message):
            config = json.loads(message)
            print "Human said: %s" % config['answer']
            tm = int(time.time())
            robot.memory_service.raiseEvent('FakeRobot/ASR', config['answer'])
            robot.memory_service.insertData('FakeRobot/ASRevent', config['answer'])
            robot.memory_service.insertData('FakeRobot/ASRtime', tm)
            self.websocket_server.write_message(json.dumps(config, indent=4))
            
        self.ws_client.close()
        

    @tornado.gen.coroutine
    def send_message(self, message):
        self.write_message(message)

    @tornado.gen.coroutine
    def connect(self):
        self.ws_client = yield websocket_connect('ws://localhost:9030/websocketserver', on_message_callback=self.on_message)
        #print "Connnected to humanSpeakServer"
        self.ws_client.write_message(self.message)



class MyWebSocketServer(tornado.websocket.WebSocketHandler):

    def open(self):
        global websocket_server, run
        websocket_server = self
        #print 'New connection'
       
    def on_message(self, message):
        global code, status, robot, difficultyLevel, surveyResults, currentPlayer, startFromZero
        #print 'ricevuto messaggio %s' % message
        

        if (message == 'Just finished game?'):
            if startFromZero:
                self.write_message(json.dumps({'answer': 'startFromZero'}))
            else:
                #print 'Survey results: %s' % surveyResults
                survey = None
                for el in surveyResults:
                    if (el['username'] == currentPlayer):
                        survey = el
                self.write_message(json.dumps({'answer': 'justFinishedMatch', 'survey': survey}))
                

        elif ('interface started' in message):
            initSonar(robot)

            human = raw_input("Waiting for human ")

            if (human == 'enter scene'):
                if (scanEnvironment(robot, 1.2)):
                    #print "parte l'interfaccia"
                    self.write_message(json.dumps({'answer': 'start'}, indent=4))
        
        elif ('gameSetup' in message):
            #print 'Mando richiesta del livello al planner'
            startFromZero = False
            newMessage = json.dumps({'id': 'level%d' % difficultyLevel}, indent=4)
            client = PlannerClient(newMessage, self)

        elif ('boardStatus' in message):
            robot.say('I am thinking about the next move...')
            client = PlannerClient(message, self)

        elif ('vocabulary' in message):
            client = HumanSpeakClient(message, self)
            config = json.loads(message)
            robot.say(config['sentence'])
            if (config['scene'] == 'welcome'):
                hello(robot)
            if (config['scene'] == 'presentation'):
                handShaking(robot)

        elif ('motionDirection' in message):
            config = json.loads(message)
            if (config['motionDirection'] == 'right'):
                moveHorizontalRight(robot)
            elif (config['motionDirection'] == 'left'):
                moveHorizontalLeft(robot)
            elif (config['motionDirection'] == 'up'):
                moveVerticalUp(robot)
            elif (config['motionDireciton'] == 'down'):
                moveVerticalDown(robot)

        elif ('wonGame' in message):
            robot.say('Congratulations! We solved the puzzle!')
            pepperVictory(robot)

        elif ('pepperSad' in message):
            config = json.loads(message)
            robot.say(config['sentence'])
            pepperSad(robot)

        elif ('setLevel' in message):
            config = json.loads(message)
            difficultyLevel = config['setLevel']

        elif ('setSurvey' in message):
            config = json.loads(message)
            currentPlayer = config['setSurvey']['username']
            for el in surveyResults:
                if (el['username'] == currentPlayer):
                    surveyResults.remove(el)
            surveyResults.append(config['setSurvey'])
            #print surveyResults
            if (config['finalSubmit']):
                startFromZero = True
                currentPlayer = None

        elif ('getSurvey' in message):
            for el in surveyResults:
                if (el['username'] == currentPlayer):
                    self.write_message(json.dumps(el, indent=4))
            
        else:
            #print 'Message received:\n%s' % message
            #robot.say(message)
            '''
            if (status=='Idle'):
                t = Thread(target=run_code, args=(message,))
                t.start()
            else:
                print 'Program running. This code is discarded.'
            '''
        #self.write_message('OK')

    def on_close(self):
        print 'Connection closed'
  
    def on_ping(self, data):
        print 'ping received: %s' %(data)
  
    def on_pong(self, data):
        print 'pong received: %s' %(data)
  
    def check_origin(self, origin):
        #print "-- Request from %s" %(origin)
        return True

# Main loop (asynchrounous thread)

def main_loop(data):
    global run, websocket_server, status, tablet_service
    while (run):
        time.sleep(1)
        #if (run and not websocket_server is None):
            #try:
                #websocket_server.write_message(status)
                #print status
            #except tornado.websocket.WebSocketClosedError:
                #print 'Connection closed.'
                #websocket_server = None

    print "Main loop quit."


def main():
    global run,session,tablet_service, robot

    parser = argparse.ArgumentParser()
    parser.add_argument("--pip", type=str, default=os.environ['PEPPER_IP'],
                        help="Robot IP address.  On robot or Local Naoqi: use '127.0.0.1'.")
    parser.add_argument("--pport", type=int, default=9559,
                        help="Naoqi port number")
    parser.add_argument("--serverport", type=int, default=9050,
                        help="Server port")

    args = parser.parse_args()
    pip = args.pip
    pport = args.pport
    server_port = args.serverport 


    # Run main thread
    t = Thread(target=main_loop, args=(None,))
    t.start()

    # Run robot
    robot = PepperRobot()
    robot.connect(os.environ['PEPPER_IP'], pport, False)
    #begin()

    # Run web server
    application = tornado.web.Application([
        (r'/websocketserver', MyWebSocketServer),])  
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(server_port)
    print "%sWebsocket server listening on port %d%s" %(GREEN,server_port,RESET)
#    tablet_service.showWebview(webview)


    try:
        tornado.ioloop.IOLoop.instance().start()
    except KeyboardInterrupt:
        print " -- Keyboard interrupt --"



    # Quit
    end()

    if (not websocket_server is None):
        websocket_server.close()
    print "Web server quit."
    run = False    
    print "Waiting for main loop to quit..."

if __name__ == "__main__":
    main()
