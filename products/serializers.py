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
            'id':{'hidden': True, 'label': 'Идентификатор'},
            'name': {
                'width': '45%',
                'filter': {'type': 'textbox'}
            },
            'price': {
                'width': '15%',
                'format': 'c2',
                'filter': {'type': 'numberinput'}
            },
            'in_stock': {
                'width': '10%',
                'columntype': 'checkbox'
            },
            'category__name': {'label': 'Категория', 'filtertype': 'list', 'width': '20%',},
            'category__priority': {'hidden': True, 'label': 'Приоритет категории'},
            'category__id': {'hidden': True, 'label': 'Идентификатор категории'}
        }