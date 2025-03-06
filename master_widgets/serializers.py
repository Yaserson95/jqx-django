from rest_framework import serializers as rfs

class ChoiseItemSerializer(rfs.Serializer):
    label = rfs.SerializerMethodField('get_label')
    value = rfs.SerializerMethodField('get_value')

    def get_label(self, obj):
        return str(obj)
    
    def get_value(self, obj):
        return obj.pk