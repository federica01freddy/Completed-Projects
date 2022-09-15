import warnings
from collections import OrderedDict
from torch import nn

from typing import Tuple, Optional, Union

from .methods import get_pipeline
from .methods.common import LearningMethod


def train_pipeline(
    pipeline: Union[str, LearningMethod],
    train_data,
    val_data,
    batch_size: int,
    epochs: int,
    architecture: str = 'rn50',
    init_weights: Optional[str] = None,
    show_progress: bool = True,
    show_sub_progress: bool = False,
    eval_interval: int = 1,
    multi_gpu: bool = False,
    load_workers: int = 8,
    **hparams) -> Tuple[nn.Module, OrderedDict]:
    """ Constructs and trains a deep learning pipeline on a given dataset.

    Parameters
    ----------
    pipeline : methods.common.LearningMethod or str
        The pipeline instance or name of the pipeline class.
        A list of available training pipelines can be obtained from `methods.available_pipelines`.
    train_data : datasets.common.ImageClassificationDataset
        Training data.
        The `transform` attribute will be changed by the given pipeline.
    val_data : datasets.common.ImageClassificationDataset, optional
        Validation data.
        The `transform` attribute will be changed by the given pipeline.
    batch_size : int
        The batch size.
    epochs : int
        Total number of training epochs.
    architecture : str, default: 'rn50'
        The model architecture to be trained. Note that the pipeline might make
        modifications to the standard architecture.
    init_weights : str, default: None
        The path of the state_dict of the saved model to resume (e.g. /ubuntu/saved_model.pth).
    show_progress : bool, default: True
        Whether to show a tqdm progress bar updated after every epoch.
    show_sub_progress : bool, default: False
        Whether to show a second tqdm progress bar updated after every batch.
    eval_interval : int, default: 1
        Number of epochs after which evaluation will be performed.
    multi_gpu : bool, default: False
        If `True`, model training will be parallelized across all available GPUs.
    load_workers : int, default: 8
        Number of parallel processes used for data loading and pre-processing.
    **hparams
        Additional hyper-parameters for the pipeline if it has been given by name.
    
    Returns
    -------
    model : torch.nn.Module
        The trained model.
    metrics : dict
        Dictionary with training and evaluation metrics for all epochs.
        Evaluation metrics will be prefixed with 'val_'.
        The additional key 'lr' specifies the learning rate at the end
        of the respective epoch.
        The training history can be visualized using
        `viz_utils.plot_training_history`.
    """

    if isinstance(pipeline, str):
        pipeline = get_pipeline(pipeline, **hparams)
    elif len(hparams) > 0:
        warnings.warn(
            'Hyper-parameters passed to train_pipeline will be ignored when a '
            'pre-constructed pipeline is given as "pipeline".'
        )

    return pipeline.train(
        train_data, val_data,
        batch_size=batch_size,
        epochs=epochs,
        architecture=architecture,
        init_weights=init_weights,
        show_progress=show_progress,
        show_sub_progress=show_sub_progress,
        eval_interval=eval_interval,
        multi_gpu=multi_gpu,
        load_workers=load_workers
    )
