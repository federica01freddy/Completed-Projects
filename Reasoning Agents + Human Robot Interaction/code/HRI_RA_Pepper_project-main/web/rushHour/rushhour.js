let ws = null
let logs = null

// The 6x6 board in which the game is played
class Board {
    constructor(htmlBoard) {
        this.size = 6
        this.status = [['_', '_', '_', '_', '_', '_'],
                        ['_', '_', '_', '_', '_', '_'],
                        ['_', '_', '_', '_', '_', '_'],
                        ['_', '_', '_', '_', '_', '_'],
                        ['_', '_', '_', '_', '_', '_'],
                        ['_', '_', '_', '_', '_', '_']]
        this.htmlBoard = htmlBoard
        this.pieces = {}
        this.colors = ['#ff5454', '#ff9c54', '#ffdc54', '#b4ff54', '#54ffdc', '#54b4ff', '#5454ff', '#9c54ff', '#dc54ff', '#ff54b4']
        this.goal = 0
    }

    // Setup the board in the initial configuration
    setup(config) {
        let cars = JSON.parse(config.cars)
        let trucks = JSON.parse(config.trucks)
        for (let car of cars) {
            let orientation = 'horizontal'
            if (car[1] != car[3]) {orientation = 'vertical'}
            if (car[0] == 1) {
                new Piece(car[0], 'red', orientation, 2, car[1]-1, car[2]-1, this)
                this.goal = car[1]-1
                this.setGoal()
            }
            else {
                new Piece(car[0], this.colors.shift(), orientation, 2, car[1]-1, car[2]-1, this)
            }
        }
        for (let truck of trucks) {
            let orientation = 'horizontal'
            if (truck[1] != truck[3]) {orientation = 'vertical'}
            new Piece(truck[0], this.colors.shift(), orientation, 3, truck[1]-1, truck[2]-1, this)
        }
    }

    // Graphically represent the goal of the current problem
    setGoal() {
        document.querySelector(`#cell-${this.goal}5`).style.borderRight = '10px solid #08ff00'
    }

    // Check whether we won the game. If so, head over to a new screen where the user is prompted to either go to the survey or to play another match
    hasWon() {
        if (this.status[this.goal][this.size-1] == '1') {
            console.log('You won!')
            let buttons = document.getElementsByClassName('arrow-keys')
            console.log(buttons)
            for (let button of buttons) {
                button.disabled = true
                button.classList.add('inactive')
            }
            ws.send(JSON.stringify({'wonGame': true}))
            logs.innerHTML = '<b>Congratulations!</b> We solved the puzzle!'
            window.setTimeout(() => {window.location.href = "http://127.0.0.1:5500/web/interface/index.html"}, 10000)
            return true
        }
    }

    // Export the status of the board to be sent to the planner
    exportStatus() {
        let cars = []
        let trucks = []

        for (let piece of Object.values(this.pieces)) {
            let vehicle = [piece.id, piece.row+1, piece.col+1]
            if (piece.orientation == 'horizontal') {
                vehicle.push(piece.row+1)
                vehicle.push(piece.col)
            }
            else if (piece.orientation == 'vertical') {
                vehicle.push(piece.row+2)
                vehicle.push(piece.col+1)
            }

            if (piece.size == 2) {
                cars.push(vehicle)
            }
            else if (piece.size == 3) {
                if (piece.orientation == 'horizontal') {
                    vehicle.push(piece.row+1)
                    vehicle.push(piece.col-1)
                }
                else if (piece.orientation == 'vertical') {
                    vehicle.push(piece.row+3)
                    vehicle.push(piece.col+1)
                }
                trucks.push(vehicle)
            }
        }
        return {'id': 'boardStatus', 'cars': cars, 'trucks': trucks}
    }
    
    printStatus() {
        console.log(`${this.size}x${this.size} board`)
        for (let row of this.status) {
            console.log(row.join(' '))
        } 
    }
}

// A piece of the board, either a car or a truck
class Piece {
    constructor(id, color, orientation, size, row, col, board) {
        this.id = id
        this.color = color
        this.orientation = orientation
        this.size = size
        this.row = row
        this.col = col

        this.board = board
        //this.board.setPiece(this)
        this.board.pieces[this.id] = this
        this.setBoard()
    }

    // Move the piece on the board
    move(direction) {
        this.checkMove(direction)
        this.reset()
        this.dehighlight()
        if (direction == 'left') {this.col -= 1}
        else if (direction == 'right') {this.col += 1}
        else if (direction == 'up') {this.row -= 1}
        else if (direction == 'down') {this.row += 1}
        this.setBoard()
        if (this == selectedPiece) {
            this.highlight()
        }
        this.board.printStatus()
        return this.board.hasWon()
    }

    // Helper function to get all the cells occupied by the piece
    getCells() {
        let list = []
        for (let i=0; i<this.size; i++) {
            if (this.orientation == 'horizontal') {
                list.push(document.querySelector(`#cell-${this.row}${this.col-i}`))
            }
            else if (this.orientation == 'vertical') {
                list.push(document.querySelector(`#cell-${this.row+i}${this.col}`))
            }
        }
        return list
    }

    // Checks whether move is admissible
    checkMove(direction) {
        if (direction == 'left') {
            if (this.orientation == 'vertical' || this.col-this.size+1 == 0 || this.board.status[this.row][this.col-this.size] != '_') {
                throw new Error('Can\'t move left')
            }
        }
        else if (direction == 'right') {
            if (this.orientation == 'vertical' || this.col+1 == this.board.size || this.board.status[this.row][this.col+1] != '_') {
                throw new Error('Can\'t move right')
            }
        }
        else if (direction == 'up') {
            if (this.orientation == 'horizontal' || this.row == 0 || this.board.status[this.row-1][this.col] != '_') {
                throw new Error('Can\'t move up')
            }
        }
        else if (direction == 'down') {
            if (this.orientation == 'horizontal' || this.row+this.size == this.board.size || this.board.status[this.row+this.size][this.col] != '_') {
                throw new Error('Can\'t move down')
            }
        }
        else {
            throw new Error(`${direction} is not an admissible direction`)
        }
    }

    // Resets the cells of the board occupied by the piece to their original state
    reset() {
        if (this.orientation == 'horizontal') {
            for (let i=0; i<this.size; i++) {
                this.board.status[this.row][this.col-i] = '_'
                let cell = document.querySelector(`#cell-${this.row}${this.col-i}`)
                cell.style.backgroundColor = 'white'
                cell.style.borderRight = '2px solid black'
                cell.style.borderBottom = '2px solid black'
                cell.classList.remove(this.id)
                if (this.row == 0) {cell.style.borderTop = '2px solid black'}
                if (this.col-i == 0) {cell.style.borderLeft = '2px solid black'}
            }
        }
        else if (this.orientation == 'vertical') {
            for (let i=0; i<this.size; i++) {
                this.board.status[this.row+i][this.col] = '_'
                let cell = document.querySelector(`#cell-${this.row+i}${this.col}`)
                cell.style.backgroundColor = 'white'
                cell.style.borderRight = '2px solid black'
                cell.style.borderBottom = '2px solid black'
                cell.classList.remove(this.id)
                if (this.row+i == 0) {cell.style.borderTop = '2px solid black'}
                if (this.col == 0) {cell.style.borderLeft = '2px solid black'}
            }
        }
    }

    // Fill the cells corresponding to the piece on the board
    setBoard() {
        if (this.orientation == 'horizontal') {
            for (let i=0; i<this.size; i++) {
                this.board.status[this.row][this.col-i] = this.id
                let cell = document.querySelector(`#cell-${this.row}${this.col-i}`)
                cell.style.backgroundColor = this.color
                cell.classList.add(this.id)
                if (i == this.size-1) {
                    cell.style.borderRight = `2px solid ${this.color}`
                }
            }
        }
        else if (this.orientation == 'vertical') {
            for (let i=0; i<this.size; i++) {
                this.board.status[this.row+i][this.col] = this.id
                let cell = document.querySelector(`#cell-${this.row+i}${this.col}`)
                cell.style.backgroundColor = this.color
                cell.classList.add(this.id)
                if (i != this.size-1) {
                    cell.style.borderBottom = `2px solid ${this.color}`
                }
            }
        }
    }

    // Change piece appearence to show that it is selected
    highlight() {
        let cells = []
        for (let i=0; i<this.size; i++) {
            if (this.orientation == 'horizontal') {
                cells.push(document.querySelector(`#cell-${this.row}${this.col-i}`))
            }
            else if (this.orientation == 'vertical') {
                cells.push(document.querySelector(`#cell-${this.row+i}${this.col}`))
            }
        }
        for (let i=0; i<this.size; i++) {
            //cells[i].style.opacity = 0.5
            cells[i].style.top = '-5px'
            cells[i].style.left = '-5px'
            cells[i].style.boxShadow = '5px 5px 0 #000'
            cells[i].style.zIndex = '10'
            if (this.orientation == 'horizontal') {
                if (i == 0) {cells[i].style.zIndex = 100}
            }
        }
    }

    // Change piece appearence to show that it is not selected
    dehighlight() {
        let cells = this.getCells()
        for (let i=0; i<this.size; i++) {
            cells[i].style.top = '0'
            cells[i].style.left = '0'
            cells[i].style.opacity = 1
            cells[i].style.boxShadow = 'none'
            cells[i].style.zIndex = '1'
        }
        this.board.setGoal()
    }
}


let selectedPiece = null

function main() {
    logs = document.querySelector('.logs')
    let htmlBoard = document.querySelector('.board')
    let board = new Board(htmlBoard)
    let timer = null

    // Websocket to connect to the server
    ws = new WebSocket('ws://localhost:9050/websocketserver')
    ws.onopen = function() {
        //ws.send('Opened web client socket')
        ws.send(JSON.stringify({id: 'gameSetup'}))
    }
    ws.onmessage = function(e) {
        let config = JSON.parse(e.data)
        if (config.id.includes('level')) {
            board.setup(config)
        }
        else if (config.id == 'nextMove') {
            let movingPiece = board.pieces[config.vehicle]
            for (let i=0; i<config.nCells; i++) {
                if (movingPiece.orientation == 'horizontal' && config.move_type == 'forward') {
                    movingPiece.move('right')
                    console.log(`Planner said: move piece ${config.vehicle} right`)
                    if (i == 0) {
                        ws.send(JSON.stringify({'motionDirection': 'right'}))
                    }
                }
                else if (movingPiece.orientation == 'horizontal' && config.move_type == 'backward') {
                    movingPiece.move('left')
                    console.log(`Planner said: move piece ${config.vehicle} left`)
                    if (i == 0) {
                        ws.send(JSON.stringify({'motionDirection': 'left'}))
                    }
                }
                else if (movingPiece.orientation == 'vertical' && config.move_type == 'forward') {
                    movingPiece.move('up')
                    console.log(`Planner said: move piece ${config.vehicle} up`)
                    if (i == 0) {
                        ws.send(JSON.stringify({'motionDirection': 'up'}))
                    }
                }
                else if (movingPiece.orientation == 'vertical' && config.move_type == 'backward') {
                    movingPiece.move('down')
                    console.log(`Planner said: move piece ${config.vehicle} down`)
                    if (i == 0) {
                        ws.send(JSON.stringify({'motionDirection': 'down'}))
                    }
                }
            }
            // after one minute from the last Pepper move, Pepper asks human if they are struggling
            timer = window.setTimeout(() => {
                ws.send(JSON.stringify({'pepperSad': true, 'sentence': 'Are you struggling with your next move?'}))
            }, 1000*60) // 180 seconds
        }
    }


    for (let i = 0; i < board.size; i++) {
        let row = document.createElement('div')
        row.classList.add('row')
        htmlBoard.appendChild(row)

        for (let j = 0; j < board.size; j++) {
            let cell = document.createElement('div')
            cell.classList.add('cell')
            cell.id = `cell-${i}${j}`
            if (i == 0) {cell.style.borderTop = '2px solid black'}
            if (j == 0) {cell.style.borderLeft = '2px solid black'}
            cell.addEventListener('click', () => {
                for (let piece in board.pieces) {
                    if (cell.classList.contains(piece)) {
                        if (selectedPiece != null) {
                            selectedPiece.dehighlight()
                        }
                        selectedPiece = board.pieces[piece]
                        selectedPiece.highlight()
                        return
                    }   
                }
                console.log('oggetto non trovato')
            })   
            row.appendChild(cell)
        }
    }

    let buttons = document.getElementsByClassName('arrow-keys')
    console.log(buttons)
    for (let button of buttons) {
        button.addEventListener('click', () => {
            try {
                if (!selectedPiece.move(button.id)) {
                    ws.send(JSON.stringify(board.exportStatus()))
                }
                window.clearTimeout(timer)
                logs.innerText = ''
            }
            catch(err) {
                logs.innerText = err
                ws.send(JSON.stringify({'pepperSad': true, 'sentence': 'This move is not allowed, please try again'}))
            }
        })
    }

    board.printStatus()

}

main()