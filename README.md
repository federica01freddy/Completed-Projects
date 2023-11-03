# Master's degree projects
In this folder you will find all my projects developed during my MSc in Artificial Intelligence and Robotics at Sapienza, University of Rome from 2020 to 2023.
## AI for Visual Perception in HCI & HRI
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
The developed architectures are:
* prior yes baseline
* random baseline 
* CNN + LSTM 
* LXMERT + GRU
### Collaborators
Federica Cocci, Michela Proietti, Sofia Santilli
