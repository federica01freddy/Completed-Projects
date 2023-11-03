from rasa.utils.endpoints import EndpointConfig
from rasa.core import config
from rasa.core.agent import Agent
from rasa.core.interpreter import RasaNLUInterpreter

import asyncio

import speech_recognition as sr
r = sr.Recognizer()
mic = sr.Microphone()
import pyttsx3
engine = pyttsx3.init()


def speaker_setting():
    voices = engine.getProperty("voices")
    engine.setProperty("voice", voices[36].id)
    engine.setProperty("rate", 160)

def speaker(voice_output):
    engine.say(voice_output)
    engine.runAndWait() 

async def path_core():
    await chat('./models/prova_aereo', './models/prova_aereo/nlu', "http://localhost:5055/webhook")

async def chat(core_model_path, nlu_model_path, action_endpoint_url):

    nlu_interpreter = RasaNLUInterpreter(nlu_model_path)
    action_endpoint = EndpointConfig(url=action_endpoint_url)
    agent = Agent.load(core_model_path, interpreter=nlu_interpreter, action_endpoint=action_endpoint)

    for i in range(30): print("\n")

    print("É tutto pronto. Per fermare il bot basta dire STOP ")

    while True:
        
        with mic as source:
            r.adjust_for_ambient_noise(source)
            print("|--  PUOI PARLARE --|")
            audio = r.listen(source)
            print("Google Speech Recognition sta elaborando...")
        try:
            voice_input=r.recognize_google(audio, language='it-IT')
            inp = voice_input.lower()
            print("Google Speech Recognition ha capito: " + inp)            
        except sr.UnknownValueError:
            print("Google Speech Recognition non ha capito l'audio")
            inp = "errore"
        except sr.RequestError as e:
            print("Problemi con Google Speech Recognition; {0}".format(e))
            inp = "errore"
        
        if inp == "stop":
            break

        if inp == "errore":
            voice_output = "Per favore ripeti"
            print(voice_output)
            speaker(voice_output)
            continue
        
        bot_answers = await agent.handle_text(inp)
        for answer in bot_answers:
            blocks = answer["text"].split("\n")
            for block in blocks:
                if "aereoporto" in block:
                    valore_aereoporto = block.split("aereoporto")[1]
                    if ("False" in valore_aereoporto ):
                        block = "Ecco il riepilogo. Non vi aspetteremo in aereoporto."
                    else:
                        block = "Ecco il riepilogo. Vi aspetteremo in aereoporto."
                else:
                    block = block.replace("True", "Si")
                    block = block.replace("False", "No")

                print(block)
                speaker(block)
                    
    return agent



def start_everything():
    speaker_setting()
    loop = asyncio.get_event_loop()
    loop.run_until_complete(path_core())

start_everything() 


