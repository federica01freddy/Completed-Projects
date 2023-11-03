from unified_planning.shortcuts import *
import time
import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web
from threading import Thread
import json

'''
    File containing all the logic for the planner and the server to communicate with the other modules of the projects
'''

websocket_server = None     # websocket handler
run = True                  # main_loop run flag

class MyWebSocketServer(tornado.websocket.WebSocketHandler):

    def open(self):
        global websocket_server, run
        websocket_server = self
        print('New connection')
       
    def on_message(self, message):
        global code, status, robot
        content = json.loads(message)
        # Handle requests for all levels of the game
        if (content['id'] == 'level1'):
            config = {'id': content['id'],
                      'cars': '[[1,1,2,1,1],[2,1,4,2,4],[3,3,1,4,1],[4,5,6,5,5],[5,4,3,4,2],[6,5,1,6,1],[7,5,2,6,2]]',
                      'trucks': '[[8,3,4,4,4,5,4]]'}
            config = json.dumps(config, indent=4)
            self.write_message(config)
        elif (content['id'] == 'level2'):
            config = {'id': content['id'],
                      'cars': '[[1,5,2,5,1],[2,2,4,3,4],[3,5,6,6,6],[4,3,6,4,6],[5,4,4,5,4],[6,1,5,1,4]]',
                      'trucks': '[[7,4,3,5,3,6,3],[8,2,1,3,1,4,1]]'}
            config = json.dumps(config, indent=4)
            self.write_message(config)
        elif (content['id'] == 'level3'):
            config = {'id': content['id'],
                      'cars': '[[1,3,2,3,1],[2,5,2,6,2],[3,5,4,5,3]]',
                      'trucks': '[[4,1,3,2,3,3,3],[5,4,5,5,5,6,5]]'}
            config = json.dumps(config, indent=4)
            self.write_message(config)
        # Handle request for next move made by Pepper
        elif (content['id'] == 'boardStatus'):
            vehicle, move_type, nCells = problemDefinition(content['cars'], content['trucks'])
            nextMove = {'id': 'nextMove',
                        'vehicle': vehicle,
                        'move_type': move_type,
                        'nCells': str(nCells)}
            nextMove = json.dumps(nextMove, indent=4)
            self.write_message(nextMove)
        else:
            print('Message received:\n%s' % message)
  
    def on_close(self):
        print('Connection closed')
  
    def on_ping(self, data):
        print('ping received: %s' %(data))
  
    def on_pong(self, data):
        print('pong received: %s' %(data))
  
    def check_origin(self, origin):
        return True

def problemSolver(problem):
    problem_kind = problem.kind
    print(problem_kind)
    print(problem)
    with OneshotPlanner(name='fast-downward') as planner: #fast-downward pyperplan tamer enhsp
        assert planner.supports(problem_kind)
        result = planner.solve(problem)
        if result.status == up.engines.PlanGenerationResultStatus.SOLVED_SATISFICING:
            print("Pyperplan returned: %s" % result.plan)
            completePlan = (str(result.plan)[1:-1]) # Make the plan a string without considering the squared brackets
            movesPlan = completePlan.split(', move_') # Sequence of moves
            move = movesPlan[0].split("(")[0][5:] # First move
            vehicle = movesPlan[0].split("vehicle_")[1].split(",")[0] # Vehicle of the first move
            n_cells = 1 # Counter of the moves for the vehicle
            for m in movesPlan[1:]:
                v = m.split("vehicle_")[1].split(",")[0]
                if move in m and vehicle==v:
                    n_cells+=1
                if move not in m or vehicle!=v:
                    break

            if "forward" in move:
                return vehicle, "forward", n_cells
            else:
                return vehicle, "backward", n_cells
        else:
            noPlan = "No plan found"
            return 0,noPlan,0


def problemDefinition(cars, trucks): 
    num_rows = 6
    num_cols = 6
    cells_list = []
    for i in range(num_rows):
        for j in range(num_cols):
            cells_list.append(f"cell_{i+1}{j+1}")
    print(f"List of cells: {cells_list}")
    
    Cell = UserType('Cell')
    Vehicle = UserType('Vehicle')

    # Here we create the dictionary s2o where the keys are strings and values are objects in order to track the cells
    s2o = {str(i) : unified_planning.model.Object(str(i), Cell) for i in cells_list}

    free_cell = unified_planning.model.Fluent('free_cell', BoolType(), fc=Cell)
    is_car = unified_planning.model.Fluent('is_car', BoolType(), vehicle=Vehicle)
    is_truck = unified_planning.model.Fluent('is_truck', BoolType(), vehicle=Vehicle)
    car_at = unified_planning.model.Fluent('car_at', BoolType(), vehicle=Vehicle, cell_1=Cell, cell_2=Cell)
    truck_at = unified_planning.model.Fluent('truck_at', BoolType(), vehicle=Vehicle, cell_1=Cell, cell_2=Cell, cell_3=Cell)
    adj_3 = unified_planning.model.Fluent('adj_3', BoolType(), c1=Cell, c2=Cell, c3=Cell)

    move_forward_CAR = unified_planning.model.InstantaneousAction('move_forward_CAR', v_forward_CAR=Vehicle, c1_forward_CAR=Cell, c2_forward_CAR=Cell, c3_forward_CAR=Cell)
    v_forward_CAR = move_forward_CAR.parameter('v_forward_CAR')
    c1_forward_CAR = move_forward_CAR.parameter('c1_forward_CAR')
    c2_forward_CAR = move_forward_CAR.parameter('c2_forward_CAR')
    c3_forward_CAR = move_forward_CAR.parameter('c3_forward_CAR')

    move_forward_CAR.add_precondition(is_car(v_forward_CAR))
    move_forward_CAR.add_precondition(car_at(v_forward_CAR,c1_forward_CAR,c2_forward_CAR))
    move_forward_CAR.add_precondition(free_cell(c3_forward_CAR))
    move_forward_CAR.add_precondition(adj_3(c3_forward_CAR,c1_forward_CAR,c2_forward_CAR))

    move_forward_CAR.add_effect(free_cell(c2_forward_CAR), True)
    move_forward_CAR.add_effect(free_cell(c3_forward_CAR), False)
    move_forward_CAR.add_effect(free_cell(c1_forward_CAR), False)
    move_forward_CAR.add_effect(car_at(v_forward_CAR, c3_forward_CAR, c1_forward_CAR), True)
    move_forward_CAR.add_effect(car_at(v_forward_CAR, c1_forward_CAR, c2_forward_CAR), False)

    move_forward_TRUCK = unified_planning.model.InstantaneousAction('move_forward_TRUCK', v_forward_TRUCK=Vehicle, c1_forward_TRUCK=Cell, c2_forward_TRUCK=Cell, c3_forward_TRUCK=Cell, c4_forward_TRUCK=Cell)
    v_forward_TRUCK = move_forward_TRUCK.parameter('v_forward_TRUCK')
    c1_forward_TRUCK = move_forward_TRUCK.parameter('c1_forward_TRUCK')
    c2_forward_TRUCK = move_forward_TRUCK.parameter('c2_forward_TRUCK')
    c3_forward_TRUCK = move_forward_TRUCK.parameter('c3_forward_TRUCK')
    c4_forward_TRUCK = move_forward_TRUCK.parameter('c4_forward_TRUCK')

    move_forward_TRUCK.add_precondition(is_truck(v_forward_TRUCK))
    move_forward_TRUCK.add_precondition(truck_at(v_forward_TRUCK,c1_forward_TRUCK,c2_forward_TRUCK,c3_forward_TRUCK))
    move_forward_TRUCK.add_precondition(free_cell(c4_forward_TRUCK))
    move_forward_TRUCK.add_precondition(adj_3(c4_forward_TRUCK,c1_forward_TRUCK,c2_forward_TRUCK))
    move_forward_TRUCK.add_precondition(adj_3(c1_forward_TRUCK,c2_forward_TRUCK,c3_forward_TRUCK))

    move_forward_TRUCK.add_effect(free_cell(c3_forward_TRUCK), True)
    move_forward_TRUCK.add_effect(free_cell(c4_forward_TRUCK), False)
    move_forward_TRUCK.add_effect(free_cell(c1_forward_TRUCK), False)
    move_forward_TRUCK.add_effect(free_cell(c2_forward_TRUCK), False)
    move_forward_TRUCK.add_effect(truck_at(v_forward_TRUCK, c4_forward_TRUCK, c1_forward_TRUCK, c2_forward_TRUCK), True)
    move_forward_TRUCK.add_effect(truck_at(v_forward_TRUCK, c1_forward_TRUCK, c2_forward_TRUCK, c3_forward_TRUCK), False)

    move_backward_CAR = unified_planning.model.InstantaneousAction('move_backward_CAR', v_backward_CAR=Vehicle, c1_backward_CAR=Cell, c2_backward_CAR=Cell, c3_backward_CAR=Cell)
    v_backward_CAR = move_backward_CAR.parameter('v_backward_CAR')
    c1_backward_CAR = move_backward_CAR.parameter('c1_backward_CAR')
    c2_backward_CAR = move_backward_CAR.parameter('c2_backward_CAR')
    c3_backward_CAR = move_backward_CAR.parameter('c3_backward_CAR')

    move_backward_CAR.add_precondition(is_car(v_backward_CAR))
    move_backward_CAR.add_precondition(car_at(v_backward_CAR,c1_backward_CAR,c2_backward_CAR))
    move_backward_CAR.add_precondition(free_cell(c3_backward_CAR))
    move_backward_CAR.add_precondition(adj_3(c1_backward_CAR,c2_backward_CAR,c3_backward_CAR))

    move_backward_CAR.add_effect(free_cell(c1_backward_CAR), True)
    move_backward_CAR.add_effect(free_cell(c2_backward_CAR), False)
    move_backward_CAR.add_effect(free_cell(c3_backward_CAR), False)
    move_backward_CAR.add_effect(car_at(v_backward_CAR, c2_backward_CAR, c3_backward_CAR), True)
    move_backward_CAR.add_effect(car_at(v_backward_CAR, c1_backward_CAR, c2_backward_CAR), False)

    move_backward_TRUCK = unified_planning.model.InstantaneousAction('move_backward_TRUCK', v_backward_TRUCK=Vehicle, c1_backward_TRUCK=Cell, c2_backward_TRUCK=Cell, c3_backward_TRUCK=Cell, c4_backward_TRUCK=Cell)
    v_backward_TRUCK = move_backward_TRUCK.parameter('v_backward_TRUCK')
    c1_backward_TRUCK = move_backward_TRUCK.parameter('c1_backward_TRUCK')
    c2_backward_TRUCK = move_backward_TRUCK.parameter('c2_backward_TRUCK')
    c3_backward_TRUCK = move_backward_TRUCK.parameter('c3_backward_TRUCK')
    c4_backward_TRUCK = move_backward_TRUCK.parameter('c4_backward_TRUCK')

    move_backward_TRUCK.add_precondition(is_truck(v_backward_TRUCK))
    move_backward_TRUCK.add_precondition(truck_at(v_backward_TRUCK,c1_backward_TRUCK,c2_backward_TRUCK,c3_backward_TRUCK))
    move_backward_TRUCK.add_precondition(free_cell(c4_backward_TRUCK))
    move_backward_TRUCK.add_precondition(adj_3(c1_backward_TRUCK,c2_backward_TRUCK,c3_backward_TRUCK))
    move_backward_TRUCK.add_precondition(adj_3(c2_backward_TRUCK,c3_backward_TRUCK,c4_backward_TRUCK))

    move_backward_TRUCK.add_effect(free_cell(c1_backward_TRUCK), True)
    move_backward_TRUCK.add_effect(free_cell(c2_backward_TRUCK), False)
    move_backward_TRUCK.add_effect(free_cell(c3_backward_TRUCK), False)
    move_backward_TRUCK.add_effect(free_cell(c4_backward_TRUCK), False)
    move_backward_TRUCK.add_effect(truck_at(v_backward_TRUCK, c2_backward_TRUCK, c3_backward_TRUCK, c4_backward_TRUCK), True)
    move_backward_TRUCK.add_effect(truck_at(v_backward_TRUCK, c1_backward_TRUCK, c2_backward_TRUCK, c3_backward_TRUCK), False)

    problem = unified_planning.model.Problem('Rush Hour')

    # Adding fluents
    problem.add_fluent(free_cell, default_initial_value=False)
    problem.add_fluent(is_car, default_initial_value=False)
    problem.add_fluent(is_truck, default_initial_value=False)
    problem.add_fluent(car_at, default_initial_value=False)
    problem.add_fluent(truck_at, default_initial_value=False)
    problem.add_fluent(adj_3, default_initial_value=False)

    # Add actions
    problem.add_action(move_forward_CAR)
    problem.add_action(move_backward_CAR)
    problem.add_action(move_forward_TRUCK)
    problem.add_action(move_backward_TRUCK)

    # Add objects
    problem.add_objects(s2o.values())

    # Initial values ("small-world assumption": it suffices to indicate the fluents that are initially true)
    
    cells = []
    all_cells = []
    # vertical adjs
    for r in range(num_rows-2):
        for c in range(num_cols):
            for rr in range (r,r+3):
                cells.append([rr+1,c+1])
            all_cells.append(cells)
            cells=[]
    # horizontal adjs
    for r in range(num_rows):
        for c in range(num_cols-2):
            for cc in range (c,c+3):
                cells.append([r+1,cc+1])
            all_cells.append(cells)
            cells=[]

    for c in all_cells:
        problem.set_initial_value(adj_3(s2o[f"cell_{c[0][0]}{c[0][1]}"],s2o[f"cell_{c[1][0]}{c[1][1]}"],s2o[f"cell_{c[2][0]}{c[2][1]}"]),True)
        problem.set_initial_value(adj_3(s2o[f"cell_{c[2][0]}{c[2][1]}"],s2o[f"cell_{c[1][0]}{c[1][1]}"],s2o[f"cell_{c[0][0]}{c[0][1]}"]),True)


    occupied_cells = []
    objects = []

    RED_object = unified_planning.model.Object(f"vehicle_{cars[0][0]}", Vehicle)
    objects.append(RED_object)
    RED_initial_row_head = cars[0][1]
    RED_initial_col_head = cars[0][2]
    RED_initial_row_tail = cars[0][3]
    RED_initial_col_tail = cars[0][4]
    problem.set_initial_value(car_at(RED_object,s2o[f"cell_{RED_initial_row_head}{RED_initial_col_head}"],s2o[f"cell_{RED_initial_row_tail}{RED_initial_col_tail}"]),True)
    problem.set_initial_value(is_car(RED_object),True)
    occupied_cells.append([cars[0][1],cars[0][2]])
    occupied_cells.append([cars[0][3],cars[0][4]])

    for v in cars[1:]: 
        v_object = unified_planning.model.Object(f"vehicle_{v[0]}", Vehicle)
        objects.append(v_object)
        problem.set_initial_value(car_at(v_object,s2o[f"cell_{v[1]}{v[2]}"],s2o[f"cell_{v[3]}{v[4]}"]),True)
        problem.set_initial_value(is_car(v_object),True)
        occupied_cells.append([v[1],v[2]])
        occupied_cells.append([v[3],v[4]])
    for v in trucks: 
        v_object = unified_planning.model.Object(f"vehicle_{v[0]}", Vehicle)
        objects.append(v_object)
        problem.set_initial_value(truck_at(v_object,s2o[f"cell_{v[1]}{v[2]}"],s2o[f"cell_{v[3]}{v[4]}"],s2o[f"cell_{v[5]}{v[6]}"]),True)
        problem.set_initial_value(is_truck(v_object),True)
        occupied_cells.append([v[1],v[2]])
        occupied_cells.append([v[3],v[4]])
        occupied_cells.append([v[5],v[6]])

    problem.add_objects(objects)

    for i in range(num_rows):
        for j in range(num_cols):
            if [i+1,j+1] not in occupied_cells:
                problem.set_initial_value(free_cell(s2o[f"cell_{i+1}{j+1}"]),True)
    
    # Add goal
    problem.add_goal(car_at(RED_object,s2o[f"cell_{RED_initial_row_head}{6}"],s2o[f"cell_{RED_initial_row_tail}{5}"]))


    vehicle, move_type, nCells = problemSolver(problem)

    return vehicle, move_type, nCells

def main_loop(data):
    global run, websocket_server, status, tablet_service
    while (run):
        time.sleep(1)

    print("Main loop quit.")

def main():
    global run,session,tablet_service, robot
    # Run main thread
    t = Thread(target=main_loop, args=(None,))
    t.start()

    # Run web server
    application = tornado.web.Application([
        (r'/websocketserver', MyWebSocketServer),])  
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(9020)
    print("Websocket server listening on port %d" %(9020))

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

