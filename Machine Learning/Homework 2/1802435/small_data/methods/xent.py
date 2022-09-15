import torch
from torch import nn
from typing import Callable

from .common import BasicAugmentation


class CrossEntropyClassifier(BasicAugmentation):
    """ Standard cross-entropy classification as baseline.

    See `BasicAugmentation` for a documentation of the available hyper-parameters.
    """

    def get_loss_function(self) -> Callable:
        return nn.CrossEntropyLoss(reduction='mean')

    def get_optimizer(self, model: nn.Module, max_epochs: int, max_iter: int):
        optimizer = torch.optim.SGD(model.parameters(), lr=self.hparams['lr'],
        momentum=self.hparams['momentum'], weight_decay=self.hparams['weight_decay'])

        #decomment if you want to use Adadelta optimizer
        """optimizer = torch.optim.Adadelta(model.parameters(), lr=self.hparams['lr'],
        rho = self.hparams['rho'],
        eps = self.hparams['eps'],
        weight_decay = self.hparams['weight_decay'])"""
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=max_iter)
        return optimizer, scheduler
    
    @staticmethod
    def default_hparams() -> dict:
        return {
        **super(CrossEntropyClassifier, CrossEntropyClassifier).default_hparams(),'momentum' : 0.9,
        #decomment if you want to use Adadelta optimizer
        #**super(CrossEntropyClassifier, CrossEntropyClassifier).default_hparams(),'rho' : 0.9,
        #**super(CrossEntropyClassifier, CrossEntropyClassifier).default_hparams(),'eps' : 1e-06,
        }

    
