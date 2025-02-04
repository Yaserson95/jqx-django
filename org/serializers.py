from rest_framework import serializers as rfs
from .models import Department

class DepartmentSerializer(rfs.ModelSerializer):
    parent = rfs.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        fields = '__all__'
        model = Department