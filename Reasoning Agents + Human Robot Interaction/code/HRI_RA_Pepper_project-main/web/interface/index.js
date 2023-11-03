/*
    Main file for the visual interface.
    Here we manage the various scenes of the initial survey and launch the game itself.
*/

let userName = ''
let chosenLevel = 0                 //  1 = easy; 2 = medium; 3 = hard
let doneWriting = false             //  Used to check whether the whole sentence has been written
let currentScene = 'waitingToStart'
let ws = null                       //  Websocket connection     
let waitingToStart = null           
let surveyResults = []              //  Array containing the results of the surveys
let data = {}                       //  Temporary result of the survey for the current player

// Source for the text animation: https://codepen.io/Tbgse/pen/dYaJyJ
function textAnimation(sentence) {
    let target = document.querySelector('.welcome-text')
    let letterCount = 1

    let interval = window.setInterval(function() {
        if (letterCount === sentence.length+1) {
            window.clearInterval(interval)
            doneWriting = true
            return
        }
        target.innerHTML = sentence.substring(0, letterCount)
        letterCount += 1
    }, 100)
}

function changeScene(props, flag='') {
    currentScene = props.sceneName

    let buttonContainer = document.querySelector('.button-container')
    if (buttonContainer.children.length != 0) {
        buttonContainer.classList.remove('buttons-in')
        buttonContainer.classList.add('buttons-out')
    }

    buttonContainer.innerHTML = ''

    if (currentScene != 'waitingToStart') {
        ws.send(JSON.stringify({'vocabulary': props.buttons, 'sentence': props.text(), 'scene': props.sceneName}))
    }
    else {
        ws.send(JSON.stringify({'message': 'interface started'}))
    }

    textAnimation(props.text())

    if (currentScene == 'noGame') {
        ws.send(JSON.stringify({'pepperSad': true, sentence: props.text()}))
        window.setTimeout(function() {
            console.log('resetting')
            changeScene(waitingToStart)
        }, 15000)
        return
    }

    // Keeps cheking every 0.2 seconds wether the whole sentence has been written to let the buttons appear
    let buttonInterval = window.setInterval(function() {
        if (doneWriting) {
            if (props.buttons.length == 0) {
                if (currentScene != 'waitingToStart') {
                    window.setTimeout(function() {
            
                        input = document.createElement('input')
                        input.classList.add('input-name')
                        input.addEventListener('keypress', function(e) {
                            if (e.key == 'Enter') {
                                userName = input.value
                                props.listeners[0]()
                            }
                        })
                        buttonContainer.appendChild(input)
            
                    }, 1000)
                }
            }
            else {
                window.setTimeout(function() {
                    // If the player won the previous game, the button for the next level is suggested
                    if (flag == 'levelWon') {
                        console.log(data)
                        chosenLevel = data.levelsPlayed.at(-1)
                        console.log(chosenLevel)
                        for (let i=0; i<props.buttons.length; i++) {
                            let button = document.createElement('button')
                            button.classList.add('button')
                            button.innerHTML = props.buttons[i]
                            button.style.backgroundColor = props.colors[i]
                            button.addEventListener('click', props.listeners[i])
                            if (i == chosenLevel) {
                                let buttonDiv = document.createElement('div')
                                buttonDiv.classList.add('button-div')
                                let belowButton = document.createElement('div')
                                belowButton.innerHTML = 'Since you won the previous game, why not try a bigger challenge?'
                                belowButton.classList.add('below-button')

                                buttonDiv.appendChild(button)
                                buttonContainer.appendChild(buttonDiv)
                                button.style.maxWidth = `${button.offsetWidth}px`
                                belowButton.style.top = `${button.offsetHeight}px`
                                belowButton.style.left = `${-button.offsetWidth/2}px`
                                belowButton.style.width = `${button.offsetWidth*2}px`
                                buttonDiv.appendChild(belowButton)
                            }
                            else {
                                buttonContainer.appendChild(button)
                            }
                        }
                    }
                    else {
                        for (let i=0; i<props.buttons.length; i++) {
                            let button = document.createElement('button')
                            button.classList.add('button')
                            button.innerHTML = props.buttons[i]
                            button.style.backgroundColor = props.colors[i]
                            button.addEventListener('click', props.listeners[i])
                            buttonContainer.appendChild(button)
                        }
                    }
        
                    buttonContainer.classList.remove('buttons-out')
                    buttonContainer.classList.add('buttons-in')
            
                }, 200)
            }
            doneWriting = false
            window.clearInterval(buttonInterval)
        }
    })
}

function main() {
    // Websocket to communicate with the server
    ws = new WebSocket('ws://localhost:9050/websocketserver')
    ws.onopen = function() {
        console.log('Connection established')
        ws.send('Just finished game?')
    }
    ws.onmessage = function(event) {
        console.log(event.data)
        humanMessage = JSON.parse(event.data)

        // Handle sentences sent from the simulation of human speech
        if (humanMessage.answer == 'startFromZero') {
            changeScene(waitingToStart)
            data = {
                'username': '',
                'isNovice': true,
                'levelsPlayed': [],
                'answer1': 0,
                'answer2': 0
            }
        }
        else if (humanMessage.answer == 'justFinishedMatch') {
            changeScene(endGame)
            data = humanMessage.survey
        }

        else if (humanMessage.answer == 'start') {
            changeScene(welcome)
        }

        else if (currentScene == 'welcome') {
            if (humanMessage.answer == 'Yes') {
                changeScene(presentation)
            }
            else if (humanMessage.answer == 'No') {
                changeScene(noGame)
            }
        }
        else if (currentScene == 'presentation') {
            userName = humanMessage.answer
            changeScene(isNovice)
        }
        else if (currentScene == 'isNovice') {
            if (humanMessage.answer == 'Yes') {
                data.isNovice = false
                changeScene(playedBefore)
            }
            else if (humanMessage.answer == 'No') {
                data.isNovice = true
                chosenLevel = 1
                ws.send(JSON.stringify({'setLevel': 1}))
                data.levelsPlayed.push(chosenLevel)
                changeScene(rules)
            }
        }
        else if (currentScene == 'playedBefore') {
            if (humanMessage.answer == 'Yes') {
                changeScene(rules)
            }
            else if (humanMessage.answer == 'No') {
                changeScene(level)
            }
        }
        else if (currentScene == 'rules') {
            if (chosenLevel == 0) {
                changeScene(level)
            }
            else {
                surveyResults.push(data)
                ws.send(JSON.stringify({'setSurvey': data, 'finalSubmit': false}))
                window.location.href = "http://127.0.0.1:5500/web/rushHour/rushhour.html"
            }
        }
        else if (currentScene == 'level') {
            if (humanMessage.answer == 'Easy') {
                chosenLevel = 1
                ws.send(JSON.stringify({'setLevel': 1}))
            }
            else if (humanMessage.answer == 'Medium') {
                chosenLevel = 2
                ws.send(JSON.stringify({'setLevel': 2}))
            }
            else if (humanMessage.answer == 'Hard') {
                chosenLevel = 3
                ws.send(JSON.stringify({'setLevel': 3}))
            }
            data.levelsPlayed.push(chosenLevel)
            surveyResults.push(data)
            ws.send(JSON.stringify({'setSurvey': data, 'finalSubmit': false}))
            window.location.href = "http://127.0.0.1:5500/web/rushHour/rushhour.html"
        }
        else if (currentScene == 'endGame') {
            if (humanMessage.answer == 'Play again') {
                changeScene(level, 'levelWon')
            }
            else if (humanMessage.answer == 'Go to survey') {
                window.location.href = "http://127.0.0.1:5500/web/survey/survey.html"
            }
        }
    }

    // Button colors
    let green = '#6ef86e'
    let red = '#ff4a4a'
    let yellow = '#ffd54a'
    let lightblue = '#8cf1e9'

    // Managing the different scenes. These objects are then passed to the changeScene function

    // *** Welcome screen ***
    let welcome = {
        sceneName: 'welcome',
        text: () => 'Hello Human! Do you want to play a Rush Hour match?',
        buttons: ['Yes', 'No'],
        colors: [green, red],
        listeners: [() => {
                        ws.send(JSON.stringify({'buttonPressed': 'Yes'}))
                        changeScene(presentation)
                    },
                    () => {
                        ws.send(JSON.stringify({'buttonPressed': 'No'}))
                        changeScene(noGame)
                    }
                ]
    }

    // *** Human does not want to play ***
    let noGame = {
        sceneName: 'noGame',
        text: () => 'Oh ok, that\'s a pity. I hope you have a nice day!',
        buttons: [],
        colors: [],
        listeners: []
    }

    // *** Presentation screen ***
    let presentation = {
        sceneName: 'presentation',
        text: () => `Great, I'm Pepper! What's your username?`,
        buttons: [],
        colors: [],
        listeners: [() => {
                        ws.send(JSON.stringify({'buttonPressed': userName}))
                        data.username = userName
                        changeScene(isNovice)
                    }
                ]
    }

    // *** Ask if has ever played the game ***
    let isNovice = {
        sceneName: 'isNovice',
        text: () => `${userName}, such a nice name! Have you ever played Rush Hour?`,
        buttons: ['Yes', 'No'],
        colors: [green, red],
        listeners: [() => {
                        ws.send(JSON.stringify({'buttonPressed': 'Yes'}))
                        data.isNovice = false
                        changeScene(playedBefore)
                    },
                    () => {
                        // Has never played before, so we automatically put difficulty to easy
                        chosenLevel = 1
                        ws.send(JSON.stringify({'buttonPressed': 'No'}))
                        ws.send(JSON.stringify({'setLevel': 1}))
                        data.isNovice = true
                        data.levelsPlayed.push(chosenLevel)
                        changeScene(rules)
                    }
                ]
    }

    // *** User has played the game before ***
    let playedBefore = {
        sceneName: 'playedBefore',
        text: () => 'Great! Do you want to be reminded the rules of the game?',
        buttons: ['Yes', 'No'],
        colors: [green, red],
        listeners: [() => {
                        ws.send(JSON.stringify({'buttonPressed': 'Yes'}))
                        changeScene(rules)
                    },
                    () => {
                        ws.send(JSON.stringify({'buttonPressed': 'No'}))
                        changeScene(level)
                    }
                ]
    }

    // *** Explanation of rules of the game ***
    let rules = {
        sceneName: 'rules',
        text: () => 'The goal of the game is to let the red car to the exit of the board. To do so, shift the cars and trucks up and down, left and right, until the path is cleared for the vehicle to exit.',
        buttons: ['Got it'],
        colors: [lightblue],
        listeners: [() => {
            // if I haven't chosen a level yet, it means that the player has already played the game
            // and is eligible to choose difficulty
            ws.send(JSON.stringify({'buttonPressed': 'Got it'}))
            if (chosenLevel === 0) {
                changeScene(level)
            }
            else {
                surveyResults.push(data)
                ws.send(JSON.stringify({'setSurvey': data, 'finalSubmit': false}))
                window.location.href = "http://127.0.0.1:5500/web/rushHour/rushhour.html"
            }
        }]
    }

    // *** Level choice ***
    let level = {
        sceneName: 'level',
        text: () => 'What difficulty level do you want to play?',
        buttons: ['Easy', 'Medium', 'Hard'],
        colors: [green, yellow, red],
        listeners: [() => {
                        ws.send(JSON.stringify({'setLevel': 1}))
                        chosenLevel = 1
                        data.levelsPlayed.push(chosenLevel)
                        surveyResults.push(data)
                        ws.send(JSON.stringify({'setSurvey': data, 'finalSubmit': false}))
                        window.location.href = "http://127.0.0.1:5500/web/rushHour/rushhour.html"
                    },
                    () => {
                        ws.send(JSON.stringify({'setLevel': 2}))
                        chosenLevel = 2
                        data.levelsPlayed.push(chosenLevel)
                        surveyResults.push(data)
                        ws.send(JSON.stringify({'setSurvey': data, 'finalSubmit': false}))
                        window.location.href = "http://127.0.0.1:5500/web/rushHour/rushhour.html"
                    },
                    () => {
                        ws.send(JSON.stringify({'setLevel': 3}))
                        chosenLevel = 3
                        data.levelsPlayed.push(chosenLevel)
                        surveyResults.push(data)
                        ws.send(JSON.stringify({'setSurvey': data, 'finalSubmit': false}))
                        window.location.href = "http://127.0.0.1:5500/web/rushHour/rushhour.html"
                    }
                ]
    }

    // *** Player end game screen ***
    let endGame = {
        sceneName: 'endGame',
        text: () => `Nice game! Do you want to play another level?`,
        buttons: ['Play new game', 'Go to survey'],
        colors: [green, yellow],
        listeners: [() => {
                        ws.send(JSON.stringify({'buttonPressed': 'Play again'}))
                        changeScene(level, 'levelWon')
                    }, 
                    () => {
                        ws.send(JSON.stringify({'buttonPressed': 'Go to survey'}))
                        window.location.href = "http://127.0.0.1:5500/web/survey/survey.html"
                    }
                ]
    }

    // *** Initial screen, waiting for someone to approach Pepper ***
    waitingToStart = {
        sceneName: 'waitingToStart',
        text: () => 'Waiting for a human to play with me...',
        buttons: [],
        colors: [],
        listeners: []
    }
}

main()