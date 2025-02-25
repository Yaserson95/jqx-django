from django.contrib import admin
from .models import Department, Employee, WorkGroup
# Register your models here.
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id','name', 'parent')
    list_display_links = ('name', )
    list_filter = ('parent',)
    search_fields = ('name',)
    autocomplete_fields = ('parent', )
    raw_id_fields = ('parent', )

class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('id','last_name', 'first_name','middle_name', 'position', 'department')
    list_display_links = ('last_name', 'first_name','middle_name', )
    list_filter = ('department',)
    search_fields = ('last_name', 'first_name','middle_name','position')

    raw_id_fields = ('department', )
    #autocomplete_fields = ('department', )
    show_facets = admin.ShowFacets.ALWAYS

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("department")

admin.site.register(Department, DepartmentAdmin)
admin.site.register(Employee, EmployeeAdmin)
admin.site.register(WorkGroup, admin.ModelAdmin)