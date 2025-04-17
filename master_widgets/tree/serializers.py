from rest_framework import serializers as rfs

class TreeSerializer(rfs.Serializer):
    label = rfs.ReadOnlyField()
    value = rfs.ReadOnlyField()
    parent = rfs.ReadOnlyField()
    type = rfs.ReadOnlyField()
    has_items = rfs.ReadOnlyField()

    @classmethod
    def update_serializer(cls, serializer_cls):
        fields = {}
        s_fields = serializer_cls().fields
        for name in cls._declared_fields:
            if name not in s_fields:
                fields[name] = cls._declared_fields[name]
        return type(serializer_cls.__name__,(serializer_cls,), fields)
    
class TreeItemsMixin:
    class Meta:
        abstract = True
    @property
    def data(self):
        if self.instance is None:
            return super().data
        return {
            'label': str(self.instance),
            'item': super().data
        }