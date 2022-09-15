import warnings

from .datasets import get_dataset
from .methods import get_pipeline


def ray_train_classifier(config):
    """ Training function to be passed to `ray.tune.run` for hyper-parameter optimization.

    Parameters
    ----------
    config : dict
        Dictionary specifying the configuration of this training run. Contains the following items:
            - 'dataset': The name of the dataset to be passed to `get_dataset`.
            - 'data_root': The root directory of the dataset.
            - 'img_dir' (optional): The directory containing the images.
            - 'train_split' (optional): File specifying the subset of the data to be used for training.
                                        Default: 'train'
            - 'test_split' (optional): File specifying the subset of the data to be used for evaluation.
                                       Default: 'val'
            - 'pipeline' (optional): Name of the training pipeline. A list of supported values
                                     can be obtained from `small_data.methods.available_pipelines`.
                                     Default: 'CrossEntropyClassifier'
            - 'architecture' (optional): Name of the model architecture. A list of supported values
                              can be obtained from `small_data.classifiers.available_classifiers`.
                              Default: 'rn50'
            - 'init_weights' (optional): Path to a checkpoint to initialize the model with.
            - 'hparams' (optional): A dictionary with additional fixed method-specific hyper-parameters.
            - 'transform' (optional): Custom training data transform to be used instead of the one
                                      provided by the pipeline.
            - 'test_transform' (optional): Custom validation data transform to be used instead of the one
                                           provided by the pipeline.
            - 'load_workers' (optional): Number of parallel data loading processes.
            - 'batch_size': The batch size.
            - 'epochs': The maximum number of training epochs.
            - 'lr': The initial learning rate.
            - 'decay': The weight decay.
    """

    warnings.filterwarnings('ignore', category=UserWarning)

    # Instantiate pipeline
    pipeline = get_pipeline(
        config.get('pipeline', 'CrossEntropyClassifier'),
        lr=config['lr'],
        weight_decay=config['decay'],
        **config.get('hparams', {})
    )

    # Load dataset
    data_kwargs = {}
    if 'img_dir' in config:
        data_kwargs['img_dir'] = config['img_dir']
    train_data = get_dataset(config['dataset'], config['data_root'], config.get('train_split', 'train'), **data_kwargs)
    val_data = get_dataset(config['dataset'], config['data_root'], config.get('test_split', 'val'), **data_kwargs)

    # Set custom data transforms
    if (config.get('transform') is not None) or (config.get('test_transform') is not None):
        if (config.get('transform') is None) or (config.get('test_transform') is None):
            train_transform, test_transform = pipeline.get_data_transforms(train_data)
        if config.get('transform') is not None:
            train_transform = config['transform']
        if config.get('test_transform') is not None:
            test_transform = config['test_transform']
        train_data.transform = train_transform
        val_data.transform = test_transform
        custom_transforms = True
    else:
        custom_transforms = False

    # Train model
    model, metrics = pipeline.train(
        train_data, val_data,
        architecture=config.get('architecture', 'rn50'),
        init_weights=config.get('init_weights'),
        batch_size=config['batch_size'],
        epochs=config['epochs'],
        show_progress=False,
        eval_interval=1,
        load_workers=config.get('load_workers', 8),
        keep_transform=custom_transforms,
        report_tuner=True
    )
