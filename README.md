# Master's degree projects
In this folder you will find all my projects developed during my MSc in Artificial Intelligence and Robotics at Sapienza, University of Rome from 2020 to 2023.

## Computer Vision in HCI & HRI
This project is a continuation and extension of the paper "Human attention assessment using a machine learning approach with gan-based data augmentation technique trained using a custom dataset"[^1].

Since the main issue for systems which detect the heedfulness of the interlocutor in human-robot interactions is the small amount of data needed for training, first of all we created a brand-new dataset containing about 120k images, extending an existing one with the aim of improving the overall performance accuracy with respect to the Face Orientation detection task. In a second place we aimed at solving another newly task-specific problem: determining whether the interlocutor is heedful or not based on eye orientation.\
\
The custom dataset (120k images) of [^1] is available online, while the bigger dataset expanded by us (approximately 240k images) is currently not available online.


[^1]: S. Pepe, S. Tedeschi, N. Brandizzi, S. Russo, L. Iocchi, C. Napoli, Human attention assessment using a machine learning approach with gan-based data augmentation technique trained using a custom dataset, OBM Neurobiology 6 (2022). doi: 10.21926/obm.neurobiol.2204139 
### Collaborators
Caterina Borzillo, Federica Cocci
## Deep Learning
We developed several architectures that address the "Visual QA" which is a semantic task that aims to answer questions based on an image.These questions require an understanding of vision, language and commonsense knowledge to answer.\
We used the [Visual Q&A v2.0](https://visualqa.org/download.html) dataset which contains open-ended questions about images.
### Implementation
The developed architectures are:
* _prior yes baseline_
* _random baseline_ 
* _CNN_ + _LSTM_ 
* _LXMERT_ + _GRU_
### Collaborators
Federica Cocci, Michela Proietti, Sofia Santilli

## Interactive Graphics
### Collaborators
Federica Cocci, Alberto Coluzzi
## Machine Learning
## Medical Robotics
### Collaborators
Caterina Borzillo, Federica Cocci, Damiano Gasperini, Matteo Germano
## Narrative Understanding and Storytelling (a NLP course)
## Neural Networks
### Collaborators
Federica Cocci, Sofia Santilli
## Vision and Perception
### Collaborators
Caterina Borzillo, Federica Cocci, Alberto Coluzzi
## Reasoning Agents + Human Robot Interaction
We developed RushHour which is a social and interactive robot for people’s entertainment. He plays with the human the Rush Hour game in a collaborative way: human and robot work together to reach the goal making one move alternately.\
The social interaction consists in an introductory presentation, in an initial and final surveys and in different robot animations also during the game. We used _Pepper_, from NAOqi robots family which provides us APIs for example for
speech recognition and synthesis capabilities.\
The robot reasoning aspect is developed through _AIPlan4EU_, a python framework.\
The physical communication between the several components of the project has been developed using a system of clients and servers. We exploited websockets and in order to implement them in Python we used _Tornado_.\
Thanks to _JavaScript (JS)_ and _CSS_ and _HTML_, we created a web application to reproduce the Pepper tablet. This web application allows the user and the robot play together since the human can visualize the progress of the game and play the next move for solving the problem.\
\
Actually we tested our software only on a simulated Pepper and we used Choregraphe Suite as platform for the simulation even though some of the tools of the physical NAOqi are not enable there.\
\
[Here](https://www.youtube.com/watch?v=QCYhiQG2Sl4) the video which shows the project.
### Collaborators
Caterina Borzillo, Federica Cocci, Alessio Sfregola
## Spoken Human Robot Interaction
We developed a simple spoken italian chatbot: it is an assistant for hotels research in european capitals. In particular we implemented a formbot which stores the user information and at the end it returns a recap. These informations are: the hotel city, the number of people, if the user wants a suite or a simple room, if the user wants a smoker bedroom, eventually a feedback of the user about the experience of interaction with the bot and finally if the user wants to keep hotel crew waiting for him at the airport when he arrives in the city.
### Implementation
We used _Rasa framework_ to handle the bot implementation and _Google Speech Recognition_ and the library _pyttx3_ to handle the voice interaction between user and bot.
### Collaborators
Federica Cocci, Matteo Germano
