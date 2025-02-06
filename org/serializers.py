from rest_framework import serializers as rfs
from .models import Department, Employee

class DepartmentSerializer(rfs.ModelSerializer):
    parent = rfs.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        fields = '__all__'
        model = Department

class EmployeeSerializer(rfs.ModelSerializer):
    departament = rfs.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        fields = '__all__'
        model = Employee