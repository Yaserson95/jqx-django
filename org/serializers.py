from rest_framework import serializers as rfs
from .models import Department, Employee

class DepartmentSerializer(rfs.ModelSerializer):
    class Meta:
        fields = '__all__'
        model = Department

class EmployeeSerializer(rfs.ModelSerializer):
    class Meta:
        fields = '__all__'
        model = Employee