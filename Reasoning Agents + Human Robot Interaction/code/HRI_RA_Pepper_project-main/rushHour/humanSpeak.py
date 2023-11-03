import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web
import os
import sys
import json
import select
import time
from threading import Thread

'''
    Websocket server that we use as a simulation of human speach, given that in our simulated environment it's not possible to directly speak to Pepper.
    The user can write in the terminal the text that he wants to say to Pepper, and the websocket server will send it to the robot.
'''

websocket_server = None     # websocket handler
run = True                  # main_loop run flag

answer = ''

class MyWebSocketServer(tornado.websocket.WebSocketHandler):

    def open(self):
        global websocket_server, run
        websocket_server = self
       
    def on_message(self, message):
        global code, status, robot, answer
        if (message=='stop'):
            print('Stop code and robot')

        elif ('vocabulary' in message):
            content = json.loads(message)
            answer = ''
            
            # We give the user 10 seconds to say something. If they don't say anything, we assumed they pressed a button in the interface
            print("Talk to Pepper: %s" % content['vocabulary'])
            i, o, e = select.select([sys.stdin], [], [], 10)

            if (answer != ''):
                print("A button was pressed before you said something: %s" % answer)
            else:
                if (i):
                    answer = sys.stdin.readline().strip()
                    print("You said: %s" % answer.capitalize())
                    self.write_message(json.dumps({'answer': answer.capitalize()}, indent=4))
                else:
                    print("You said nothing")


        elif ('buttonPressed' in message):
            content = json.loads(message)
            answer = content['buttonPressed']

    def on_close(self):
        return
  
    def on_ping(self, data):
        print('ping received: %s' %(data))
  
    def on_pong(self, data):
        print('pong received: %s' %(data))
  
    def check_origin(self, origin):
        print("-- Request from %s" %(origin))
        return True

    
def main_loop(data):
    global run, websocket_server, status, tablet_service
    
    while (run):
        time.sleep(1)


    print("Main loop quit.")

def main():
    global run
    t = Thread(target=main_loop, args=(None,))
    t.start()

    server_port = 9030
    application = tornado.web.Application([
        (r'/websocketserver', MyWebSocketServer),])  
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(server_port)
    print("HumanSpeakWebsocket server listening on port %d" %(server_port))

    try:
        tornado.ioloop.IOLoop.instance().start()
    except KeyboardInterrupt:
        print(" -- Keyboard interrupt --")


    if (not websocket_server is None):
        websocket_server.close()
    print("Web server quit.")
    run = False    
    print("Waiting for main loop to quit...")

if __name__ == "__main__":
    main()