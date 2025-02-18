from rest_framework import serializers as rfs

class TreeSerializer(rfs.Serializer):
    label = rfs.CharField()
    value = rfs.IntegerField()
    parent = rfs.IntegerField()
    item_type = rfs.IntegerField()

    def validate(self, attrs):
        return super().validate(attrs)
    
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