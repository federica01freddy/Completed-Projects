from . import common
from .xent import CrossEntropyClassifier




def available_pipelines():
    """ Returns a list of available training pipelines. """

    return [classname for classname in globals() if classname[0].isupper()]


def get_pipeline(name: str, **hparams) -> common.LearningMethod:
    """ Instantiates a training pipeline by its name.

    Parameters
    ----------
    name : str
        The class name of the pipeline.
        A list of available pipelines can be obtained from `available_pipelines`.
    **hparams
        Method-specific hyper-parameters.
    
    Returns
    -------
    small_data.methods.common.LearningMethod
        An instance of the learning pipeline class with the given name.
    """
    
    return globals()[name](**hparams)


def get_pipeline_hparams(name: str) -> dict:
    """ Gets default hyper-parameters for a certain training pipeline.

    Parameters
    ----------
    name : str
        The class name of the pipeline.
        A list of available pipelines can be obtained from `available_pipelines`.
    
    Returns
    -------
    dict
        A dictionary with the default values of all hyper-parameters
        supported by the given pipeline.
    """
    
    return globals()[name].default_hparams()
