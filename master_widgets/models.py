from django.db import models
from .helpers import in_children
from django.core.exceptions import ValidationError

class TreeForeignKey(models.ForeignKey):        
    def pre_save(self, model_instance, add):        
        # Вызываем стандартную реализацию pre_save
        value = super().pre_save(model_instance, add)

        # Выполняем проверку на наличие циклов
        if model_instance.pk is not None and in_children(model_instance, value, self.name):
            raise ValidationError("Circular reference detected. The chosen parent cannot be a descendant of this node.", None, {'name': self.name})
        
        return value