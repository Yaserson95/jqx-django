from rest_framework import serializers as rfs
from master_widgets.tree.serializers import TreeItemsMixin
from .models import Department, Employee

class DepartmentSerializer(TreeItemsMixin, rfs.ModelSerializer):        
    class Meta:
        fields = '__all__'
        model = Department

class EmployeeSerializer(TreeItemsMixin, rfs.ModelSerializer):
    class Meta:
        fields = '__all__'
        model = Employee