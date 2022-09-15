import numpy as np

# in this class, we define HER behaviour

class her_sampler:
    def __init__(self, replay_strategy, replay_k, reward_func=None):
        self.replay_strategy = replay_strategy          # it will be 'future'
        self.replay_k = replay_k                        # how many goals are added to the replay buffer: for sliding, 8 is the best
        if self.replay_strategy == 'future':
            self.future_p = 1 - (1. / (1 + replay_k))   # probability of having strategy 'future' 
        else:
            self.future_p = 0
        self.reward_func = reward_func                  # this function is from fetchSlide environment (function to re-compute the reward with substituted goals)
        
        
    # episode_batch: insieme di episodi nella struttura: mb_obs, mb_ag, mb_g, mb_actions, mb_obs_next, mb_ag_next
    # batch_size_in_transition: numero di transizioni
    # selezionando le k transizioni
    def sample_her_transitions(self, episode_batch, batch_size_in_transitions): # to sample M number of experience tuples (batch) from the buffer and train the network with the said batch experience. (Do this B times)
        T = episode_batch['actions'].shape[1]                       # numero di azioni per episodio
        rollout_batch_size = episode_batch['actions'].shape[0]      # numero di episodi
        batch_size = batch_size_in_transitions                      # number of transitions on the entire episode batch (serie di episodi)
        # select which rollouts=episodes and which timesteps to be used
        episode_idxs = np.random.randint(0, rollout_batch_size, batch_size) # per es. 6 episodi -> prendiamo batch_size=n° di indici tra 0,1,2,3,4,5.
        t_samples = np.random.randint(T, size=batch_size)
        # creazione dizionario di transizioni: prendiamo batch_size transizioni ciascuna da
        # prendo la transizione al timestamp t_samples dell'episodio episode_idxs per batch_size volte
        '''
        episode_batch:  {'obs': array([[1, 2, 3],[4, 5, 6],[7, 8, 9]])}
        episode_idxs:  [0 1]
        t_samples:  [1 2]
        transition:  {'obs': array([2, 6])}
        '''
        transitions = {key: episode_batch[key][episode_idxs, t_samples].copy() for key in episode_batch.keys()}
        # her idx: seleziona future time indexes proporzionali alla probabilità future_p:
        # più future_p è alta (replay_k alto) più future time indexes avrò perchè np.random.uniform lavora tra 0 e 1
        her_indexes = np.where(np.random.uniform(size=batch_size) < self.future_p) # her_indexes=[1,3,4,5] t_samples=[3,4,5,6,7,8,9]
        # prende alcuni random timestamps futuri a partire dal t_samples + 1 fino alla fine dell'episodio in questione  
        future_offset = np.random.uniform(size=batch_size) * (T - t_samples)
        future_offset = future_offset.astype(int)
        future_t = (t_samples + 1 + future_offset)[her_indexes]
        # replace goal with achieved goal
        future_ag = episode_batch['ag'][episode_idxs[her_indexes], future_t]
        transitions['g'][her_indexes] = future_ag
        # to get the params to re-compute reward after substituting the goal 
        transitions['r'] = np.expand_dims(self.reward_func(transitions['ag_next'], transitions['g'], None), 1)
        transitions = {k: transitions[k].reshape(batch_size, *transitions[k].shape[1:]) for k in transitions.keys()}

        return transitions