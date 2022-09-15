## VQA: Visual Question Answering.

Visual QA is a semantic task that aims to answer questions based on an image.

**Dataset**. Visual Q&A v2.0 - Available at https://visualqa.org/download.html. Visual
Question Answering (VQA) v2.0 is a dataset containing open-ended questions about images.
These questions require an understanding of vision, language and commonsense knowledge
to answer. It is the second version of the VQA dataset.
1. 265,016 images (COCO and abstract scenes)
2. At least 3 questions (5.4 questions on average) per image
3. 10 ground truth answers per question
4. 3 plausible (but likely incorrect) answers per question

**Metrics**. You should use the evaluation metric that is described at https://visualqa.
org/evaluation.html, which is robust to inter-human variability in phrasing the answers:

  Acc(*ans*) = min {(number of humans that said *ans* / 3), 1}


In order to be consistent with ‘human accuracies’, machine accuracies are averaged over
all 10 choose 9 sets of human annotators.
Before evaluating machine generated answers, do the following processing:
- Making all characters lowercase
- Removing periods except if it occurs as decimal
- Converting number words to digits
- Removing articles (a, an, the)
- Adding apostrophe if a contraction is missing it (e.g., convert ”dont” to ”don’t”)
- Replacing all punctuation (except apostrophe and colon) with a space character. We
do not remove apostrophe because it can incorrectly change possessives to plural, e.g.,
“girl’s” to “girls” and colons because they often refer to time, e.g., 2:50 pm. In case of
comma, no space is inserted if it occurs between digits, e.g., convert 100,978 to 100978.
(This processing step is done for ground truth answers as well.)

## Evaluation:
- Code Completion. 18 pts. will be scored if the project runs on colab and terminates
correctly, producing results with comparisons to, at least, a baseline.
- Scientific soundness I +4 pts. There are at least two baselines implemented, of
which one is non-trivial. Results are computed in a scientifically sound way (e.g.,
training is not done on test set.)
- Project Quality +4 pts. the project: is written in a modular way and adheres to
PEP8. It is self-explanatory, and contains plots and tables for all the results.
- Scientific soundness II +4 pts. The implemented technique is considered state of
the art for the task. You should motivate why you claim it is SOTA.
- Scientific excellence Cum Laude. The technique implemented is novel, and it has
never been presented in the literature. The current version ends up in the top 5 scoring
mechanisms of the main leader board for that task. Really novel solutions will also be
considered for preparing a scientific article.

### How we resolved the requests above:
- Code Completion.
- Scientific soundness I: prior yes baseline + random baseline as trivial baselines and CNN+LSTM as non-trivial baseline.
- Project Quality.
- Scientific soundness II: LXMERT+GRU.
- Scientific excellence Cum Laude: we have tried a different label for CNN+LSTM (a K-dimensional vector instead of a single value, see the presentation) and different optimizers. We have also tried to weight the [PAD] token in the loss computation and add gradient clipping.
