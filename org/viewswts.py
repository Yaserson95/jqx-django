from master_widgets.tree import MasterTreeViewSet
from django.db.models import F
from master_widgets.api import registry

from .models import Department, Employee, WorkGroup
from .serializers import DepartmentSerializer, EmployeeSerializer

class OrgStructureViewSet(MasterTreeViewSet):
    template = [
        {
            'queryset':Department.objects.all(),
            'label': F('name'),
            'serializer': DepartmentSerializer,
            'extra':{'icon': 'folder'},
        },
        {
            'queryset':Employee.objects.all(), 
            'label': '{{last_name}} {{first_name}} {{middle_name}}, {{position}}',
            'serializer': EmployeeSerializer,
            'parent': 'department',
            'extra':{'icon': 'user'},
        }
    ]

registry.register(Department, 'department')
registry.register(Employee, 'employee')
registry.register(WorkGroup, 'workgroup')