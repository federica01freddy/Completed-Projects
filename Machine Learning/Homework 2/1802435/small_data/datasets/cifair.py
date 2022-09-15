""" ciFAIR data loaders for PyTorch.

Version: 1.0

https://cvjena.github.io/cifair/
"""

import numpy as np
import torchvision.datasets


class ciFAIR10(torchvision.datasets.CIFAR10):
    """ ciFAIR10 dataset.

    Dataset: https://cvjena.github.io/cifair/
    Paper: https://arxiv.org/abs/1902.00423

    Parameters
    ----------
    root : str
        Root directory of the dataset.
    split : str
        One of the following values specifying the dataset split to be loaded:
            - 'train': Subsampled training data (30 images per class).
            - 'val': Validation subset of the original training data (20 images per class).
            - 'trainval': 'train' and 'val' combined (50 images per class).
            - 'fulltrain': The original training set (50,000 images in total).
            - 'test': The original test set (10,000 images in total).
    
    transform : callback, optional
        A function/transform that takes in a PIL image and returns
        a transformed version. E.g, ``torchvision.transforms.RandomCrop``.
    target_transform : callback, optional
        A function/transform that takes in the target and transforms it.
    
    Attributes
    ----------
    num_classes : int
        Number of different classes in the dataset.
    num_input_channels : int
        Number of input channels.
    classes : list of str
        Class names.
    class_to_idx : dict
        Dictionary mapping class names to consecutive numeric indices.
    data : np.ndarray
        N x 3 x 32 x 32 array with image data.
    targets : list of int
        List of the class indices of all samples.
    """
    base_folder = 'ciFAIR-10'
    url = 'https://github.com/cvjena/cifair/releases/download/v1.0/ciFAIR-10.zip'
    filename = 'ciFAIR-10.zip'
    tgz_md5 = 'ca08fd390f0839693d3fc45c4e49585f'
    test_list = [
        ['test_batch', '01290e6b622a1977a000eff13650aca2'],
    ]

    def __init__(self, root, split, transform=None, target_transform=None, download=True):

        super(ciFAIR10, self).__init__(
            root,
            train=(split != 'test'),
            transform=transform,
            target_transform=target_transform,
            download=download
        )

        if split in ('train', 'val', 'trainval'):
            class_members = { i : [] for i in range(len(self.classes)) }
            for idx, lbl in enumerate(self.targets):
                class_members[lbl].append(idx)
            start = 0 if split.startswith('train') else 30
            end = 30 if split == 'train' else 50
            indices = np.concatenate([mem[start:end] for mem in class_members.values()])
            self.data = self.data[indices]
            self.targets = np.asarray(self.targets)[indices]
            setattr(self.__class__, 'get_normalization_statistics', staticmethod(lambda: ([0.48881868, 0.47871667, 0.4426884],
                                                                                          [0.24615733, 0.24149285, 0.2571039])))


    @property
    def num_classes(self):
        """ The number of different classes in the dataset. """

        return len(self.classes)


    @property
    def num_input_channels(self):
        """ The number of input channels for this dataset. """

        return 3


class ciFAIR100(ciFAIR10):
    base_folder = 'ciFAIR-100'
    url = 'https://github.com/cvjena/cifair/releases/download/v1.0/ciFAIR-100.zip'
    filename = 'ciFAIR-100.zip'
    tgz_md5 = 'ddc236ab4b12eeb8b20b952614861a33'
    train_list = [
        ['train', '16019d7e3df5f24257cddd939b257f8d'],
    ]
    test_list = [
        ['test', '8130dae8d6fc6a436437f0ebdb801df1'],
    ]
    meta = {
        'filename': 'meta',
        'key': 'fine_label_names',
        'md5': '7973b15100ade9c7d40fb424638fde48',
    }
    
    def __init__(self, root, split, transform=None, target_transform=None, download=True):

        super(ciFAIR100, self).__init__(
            root,
            train=(split != 'test'),
            transform=transform,
            target_transform=target_transform,
            download=download
        )
    
        if split in ('train', 'val', 'trainval'):
            class_members = { i : [] for i in range(len(self.classes)) }
            for idx, lbl in enumerate(self.targets):
                class_members[lbl].append(idx)
            start = 0 if split.startswith('train') else 30
            end = 30 if split == 'train' else 50
            indices = np.concatenate([mem[start:end] for mem in class_members.values()])
            self.data = self.data[indices]
            self.targets = np.asarray(self.targets)[indices]
            setattr(self.__class__, 'get_normalization_statistics', staticmethod(lambda: ([0.50682056, 0.48714048, 0.44218618],
                                                                                          [0.26811966, 0.25661305, 0.27647367])))
            