from rest_framework import serializers
from .models import Product, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = '__all__'
        grid_config = {
            'name': {
                'width': 250,
                'filter': {'type': 'textbox'}
            },
            'price': {
                'format': 'c2',
                'filter': {'type': 'numberinput'}
            },
            'in_stock': {
                'columntype': 'checkbox'
            },
            'category__name': {'label': 'Категория', 'filtertype': 'list'},
            'category__priority': {'hidden': True},
            'category__id': {'hidden': True}
        }