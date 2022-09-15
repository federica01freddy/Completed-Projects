from torch import nn
import pkgutil
import os


def available_classifiers():
    """ Returns a list of all architectures supported by `build_classifier`. """
    
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'architectures')
    
    CLASSIFIERS = []
    for loader, module_name, is_pkg in pkgutil.walk_packages([p]):
        module = loader.find_module(module_name).load_module(module_name)
    
        class_names = dir(module)
        for cn in class_names:
            class_ = getattr(module, cn)
            if 'get_classifiers' in dir(class_):
                CLASSIFIERS.append(class_.get_classifiers())
    
    return sum(CLASSIFIERS, [])


def build_classifier(arch: str, num_classes: int, input_channels: int = 3) -> nn.Module:
    """ Instantiates a given neural network architecture.

    Parameters
    ----------
    arch : str
        The name of the model architecture.
        A list of supported architectures can be obtained from `available_classifiers`.
    num_classes : int
        The number of classes to be distinguished, i.e., the number of output neurons.
    input_channels : int, default: 3
        The number of input channels.
    
    Returns
    -------
    torch.nn.Module
        The model with random initialization.
    """
    
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'architectures')
    
    for loader, module_name, is_pkg in pkgutil.walk_packages([p]):
        module = loader.find_module(module_name).load_module(module_name)
        
        class_names = dir(module)
        for cn in class_names:
            class_ = getattr(module, cn)
            if 'get_classifiers' in dir(class_):
                if arch in class_.get_classifiers():
                    return class_.build_classifier(arch, num_classes, input_channels)
        
    raise ValueError('Unknown classifier: ' + arch)
