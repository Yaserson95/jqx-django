from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import org_structure_view
from .viewswts import OrgStructureViewSet

router = DefaultRouter()
router.register(r'', OrgStructureViewSet, basename='org_structure_tree')

urlpatterns = [
    path('tree/', include(router.urls), name='org_structure_tree'),
    path('', org_structure_view, name='org_structure'),
]

