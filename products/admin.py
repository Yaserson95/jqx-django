from django.contrib import admin
from .models import Product, Category
# Register your models here.

class ProductAdmin(admin.ModelAdmin):
    pass

class CategoryAdmin(admin.ModelAdmin):
    pass
    
admin.site.register(Product, ProductAdmin)
admin.site.register(Category, CategoryAdmin)