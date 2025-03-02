from rest_framework import viewsets, serializers, routers
from  django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

class APIRegistry:
    def __init__(self):
        # Initialize a default router for registering ViewSets
        self.router = routers.DefaultRouter()
        # Dictionary to keep track of registered models
        self._registered_models = {}

    def register(self, model, name: str, viewset=None, extra = None):
        """
        Registers a model in DRF.
        If no viewset is provided, a ModelViewSet and ModelSerializer are automatically created.
        """
        # Check if the model is already registered
        if model in self._registered_models:
            raise ValueError(f"Model {model.__name__} is already registered.")

        # Automatically create a serializer and ViewSet if none is provided
        if viewset is None:
            # Create a ModelSerializer for the model
            serializer_class = self._create_model_serializer(model)
            # Create a ModelViewSet for the model
            viewset = self._create_model_viewset(model, serializer_class, extra)

        # Register the ViewSet in the router
        self.router.register(name, viewset, basename=model._meta.model_name)
        # Add the model to the registry
        self._registered_models[model] = name

    def _create_model_serializer(self, model):
        """Creates a ModelSerializer for the given model."""
        # Define the Meta class for the serializer
        meta_class = type('Meta', (), {'model': model, 'fields': '__all__'})
        # Dynamically create the serializer class
        return type(
            f'{model.__name__}Serializer',
            (serializers.ModelSerializer,),
            {'Meta': meta_class}
        )

    def _create_model_viewset(self, model, serializer_class, extra:dict|None = None):
        options = {
            'queryset': model.objects.all(),
            'serializer_class': serializer_class,
            'filter_backends': [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter], 
        }
        if extra is not None:
            extra.update(options)
            options = extra
        """Creates a ModelViewSet for the given model."""
        # Dynamically create the ViewSet class
        return type(
            f'{model.__name__}ViewSet',
            (viewsets.ModelViewSet,),
            options
        )

    @property
    def urls(self):
        """Returns the URL patterns for registered ViewSets."""
        return self.router.urls

# Create a singleton instance of the registry
registry = APIRegistry()