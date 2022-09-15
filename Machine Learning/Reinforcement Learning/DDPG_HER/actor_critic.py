import torch
import torch.nn as nn           #package to define NN layers
import torch.nn.functional as F


#the input x in both networks should be [o, g], where o is the observation and g is the goal.


# define the actor network: actor is a subclass of nn.Module
class actor(nn.Module):
    def __init__(self, env_params):
        super(actor, self).__init__()
        self.max_action = env_params['action_max']          #store the maximum of action space
        self.input_layer = nn.Linear(env_params['obs'] + env_params['goal'], 256)   # torch.nn.Linear(in_features: int, out_features: int):it applies a linear transformation to the incoming data: y = xA^T+b
        self.fc_layer1 = nn.Linear(256, 256)
        self.fc_layer2 = nn.Linear(256, 256)
        self.output_layer = nn.Linear(256, env_params['action'])

    def forward(self, x):
        x = F.relu(self.input_layer(x)) # it applies the rectified linear unit function (ReLU) to each element of the input_layer
        x = F.relu(self.fc_layer1(x))
        x = F.relu(self.fc_layer2(x))
        actions = self.max_action * torch.tanh(self.output_layer(x)) # it makes the action legal because it will fall on the valid range of action space
        return actions

# define the critic network: critic is a subclass of nn.Module
class critic(nn.Module):
    def __init__(self, env_params):
        super(critic, self).__init__()
        self.max_action = env_params['action_max']
        self.input_layer = nn.Linear(env_params['obs'] + env_params['goal'] + env_params['action'], 256)
        self.fc_layer1 = nn.Linear(256, 256)
        self.fc_layer2 = nn.Linear(256, 256)
        self.output_layer = nn.Linear(256, 1)

    def forward(self, x, actions):
        x = torch.cat([x, actions/ self.max_action], dim=1) # it takes as input x = [o, g] and the action returned by the actor network
        x = F.relu(self.input_layer(x))
        x = F.relu(self.fc_layer1(x))
        x = F.relu(self.fc_layer2(x))
        q_value = self.output_layer(x)

        return q_value
