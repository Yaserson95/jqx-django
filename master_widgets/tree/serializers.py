from rest_framework import serializers as rfs

class TreeSerializer(rfs.Serializer):
    label = rfs.CharField()
    value = rfs.IntegerField()
    parent = rfs.IntegerField()
    item_type = rfs.IntegerField()