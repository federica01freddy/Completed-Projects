
// Send survey data to server

function main() {
    let survey = {}

    let ws = new WebSocket('ws://localhost:9050/websocketserver')
    ws.onopen = function() {
        console.log('Connection established')
        ws.send(JSON.stringify({'getSurvey': true}))
    }
    ws.onmessage = function(event) {
        survey = JSON.parse(event.data)
    }

    let radioButtons = document.querySelectorAll('.star')

    let submit = document.querySelector('#submit')

    submit.addEventListener('click', function () {
        for (let i=0; i<radioButtons.length; i++) {
            if (radioButtons[i].checked) {
                if (radioButtons[i].name == 'rating-question1') {
                    survey.answer1 = radioButtons[i].value
                }
                else {
                    survey.answer2 = radioButtons[i].value
                }
            }
        }
        ws.send(JSON.stringify({'setSurvey': survey, 'finalSubmit': true}))
        window.location.href = "http://127.0.0.1:5500/web/interface/index.html"
    })

}

main()