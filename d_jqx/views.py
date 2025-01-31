from django.shortcuts import render, get_object_or_404

def index_view(request):
    """Главная страница"""
    return render(request, 'index.html')