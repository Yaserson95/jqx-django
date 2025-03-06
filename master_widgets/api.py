from django.db.models import Field
from rest_framework import serializers, routers
from .helpers import get_field_filters
from .viewsets import MasterModelViewSet

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

    def get_models_info(self) -> dict:
        models_info = {}
        for model in self._registered_models:
            models_info[self._registered_models[model]] = {
                'id': model._meta.pk.name,
                'class_name': model.__name__,
                'verbose_name': model._meta.verbose_name,
                'verbose_name_plural': model._meta.verbose_name_plural,
                'relations': self._get_relations_info(model._meta.get_fields())
            }
        return models_info
    
    def _get_relations_info(self, relations:list[Field])->dict:
        rel_info = {}
        for rel in relations:
            if rel.is_relation:
                rel_info[rel.name] = {
                    'type': rel.__class__.__name__,
                    'related_object': rel.related_model.__name__,
                    'related_fields': getattr(rel, 'to_fields', None)
                }
        return rel_info

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
        }
        if extra is not None:
            extra.update(options)
            options = extra
        """Creates a ModelViewSet for the given model."""
        # Dynamically create the ViewSet class
        if 'filterset_fields' not in options:
            options['filterset_fields'] = self._get_fields_filters(model)

        return type(
            f'{model.__name__}ViewSet',
            (MasterModelViewSet,),
            options
        )

    def _get_fields_filters(self, model)->dict:
        return {
            field.name: get_field_filters(field) 
            for field in model._meta.fields 
            if not (field.primary_key or field.many_to_many or field.one_to_many)
        }

    @property
    def urls(self):
        """Returns the URL patterns for registered ViewSets."""
        return self.router.urls

# Create a singleton instance of the registry
registry = APIRegistry()