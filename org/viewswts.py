from master_widgets.tree import MasterTreeViewSet
from django.db.models.functions import Concat
from django.db.models import F, Value
from rest_framework.filters import OrderingFilter

from .models import Department, Employee
from .serializers import DepartmentSerializer, EmployeeSerializer

class OrgStructureViewSet(MasterTreeViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    label_field = 'name'
    filter_backends = [OrderingFilter]
    search_fields = ['label']
    ordering_fields = ['item_type', 'label']

    children_nodes = [
        {
            "queryset": Employee.objects.all(), 
            'label': Concat(F('first_name'), Value(' '), F('last_name'), Value(', '), F('position')),
            'value': 'pk',
            'parent': 'department',
            'serializer': EmployeeSerializer
        }
    ]