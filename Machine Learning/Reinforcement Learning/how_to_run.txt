# RL_project

to train the model: mpirun -np M python3 -u train.py --env-name='FetchSlide-v1' --n-epochs=N 2>&1 | tee slide.log
  (N=number of epochs)
  (M=number of cpu cores)

to play the demo: python3 demo.py --env-name='FetchSlide-v1'
