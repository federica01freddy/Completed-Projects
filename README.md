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
### Homework 1
Implementation of basic tasks in computer graphics, such as rendering a scene, shadowing, variable lighting.
### Homework 2
Implementation of animations with WebGL.
### Project
We developed the game "Down the Veins!". The name is inspired by the situation about the Covid-19 pandemic and the game wants to reproduce the inside of the human veins when the vaccine is inoculated: we imagine a micro-doctor who wanders around veins to pick up masks, hand sanitizers and vaccine doses to fight the enemy, the SARS-CoV-2 virus.

We used _JavaScript_, _HTML_ and _WebGl_; models of the objects were created in _Blender_.

To play the demo of the game, click on the below link:\
[Down the Veins!](https://sapienzainteractivegraphicscourse.github.io/final-project-coco-team/)

#### Collaborators
Federica Cocci, Alberto Coluzzi
## Machine Learning
### Homework 1
This homework has been assigned during the seminar ”Bug Finding in Compiler Toolchains”. A compiler toolchain is made of compiler and debugger and other modules; inside it, there can be bugs in different points of the chain. The given dataset is a mapping between Assembly and C instructions and the task consists in looking either for a correspondence or for a bug. 
#### Implementation
In order to resolve the task, I used several Machine Learning approaches to find the best one:
*  _Bernoulli Naive Bayes classifier_
*  _Multinomial Naive Bayes classifier_
*  _Gaussian Naive Bayes classifier_
* _pruned decision tree_
* _not pruned decision tree_
* _random forest_

### Homework 2
Generally speaking the problem I faced up in this homework is a classification problem having a small dataset. Using pre-trained networks and, using as basic architecture the Residual Network (ResNet), I was asked to play with hyperparameters, customizing a network architecture or changing the optimizer.
## Medical Robotics
In our project, we were asked to implement impedance control for a manipulator with the future goal of remotely performing a commanded tele-echographic examination. The simulated manipulator is equipped with an ultra-sound probe which will be in contact with an abdomen phantom. Starting from an initial position above the phantom, the probe approaches the abdomen perpendicularly and then slides on it, keeping low contact forces.

The final version of the project is based on _ROS_ and _ViSP_ library which allows us to control the Panda robot from Franka Emika. The manipulator is simulated in a _CoppeliaSim_ scene.
### Collaborators
Caterina Borzillo, Federica Cocci, Damiano Gasperini, Matteo Germano
## Narrative Understanding and Storytelling (a NLP course)
This miniproject aims at the generation of titles giving in input the plot of a TV series episode.
I used the pre-trained model _distilGPT2_ for title generation and then compare the obtained results with the use of the pre-trained model _T5_ focusing on the metrics to make some comparisons. As metrics for the evaluation I have implemented the _Catchiness Score_ and also the _Cosine Similarity_ in order to measure the semantic similarity. The dataset is custom-made and consists in episodes taken directly from Wikipedia through a [scraper](https://github.com/federicobass/wiki-tvseries-scraper), made by Federico Bassetti.
## Neural Networks
We reimplemented the approach proposed by the paper "Learning strides in convolutional neural network"[^2]. We used a pooling layer in the place of strides in the convolutional layers. The pooling layer works in the frequency domain and we tried two different pooling layer to understand the best one: the first one is the fixed spectral pooling and the second one is the learnable spectral pooling. We also substituted the classical Conv2d layers in the network with Parametrized Hypercomplex Convolutional layers (from "Lightweight convolutional neural networks by hypercomplex parametrization"[^3] paper), which allow to reduce the overall number of parameters by a factor of N.

[^2]: Rachid Riad, Olivier Teboul, David Grangier, Neil Zeghidour, Learning strides in convolutional neural network, https://arxiv.org/pdf/2202.01653.pdf 
[^3]: Eleonora Grassucci, Aston Zhang, Danilo Comminiello, Lightweight convolutional neural networks by hypercomplex parametrization, https://arxiv.org/pdf/2110.04176.pdf
### Collaborators
Federica Cocci, Sofia Santilli
## Vision and Perception
We implemented the paper "Learning Rich Features for Image Manipulation Detection"[^4].
There are 2 goals: the former is a binary classification (is the image manipulated?) and the latter is finding where the image is manipulated.

[^4]: Peng Zhou, Xintong Han, Vlad I. Morariu, Larry S. Davis, Learning Rich Features for Image Manipulation Detection, https://arxiv.org/abs/1805.04953
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
