from torchvision.datasets.vision import VisionDataset
from .cifair import ciFAIR10

from typing import Optional, Callable


DATASETS = {
    'cifair10' : ciFAIR10
}


def available_datasets():
    """ Returns a list with the names of all datasets available for use with `get_dataset`. """

    return list(DATASETS.keys())


def get_dataset(name: str, root: str, split: str, **kwargs) -> VisionDataset:
    """ Instantiates the adequate dataset interface given the name of the dataset.

    Parameters
    ----------
    name : str
        The name of the dataset. A list of available names can be obtained from `available_datasets`.
    root : str
        Root directory of the dataset.
    split : str
        A name or path to a textfile defining the dataset split to be loaded.
        See the documentation of the respective dataset class for specific information.
    **kwargs
        Remaining keyword arguments (such as `transform`) that are accepted
        by the constructor of the respective dataset class.
    """
    
    return DATASETS[name](
        root=root,
        split=split,
        **kwargs
    )
