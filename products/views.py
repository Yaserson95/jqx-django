from django.shortcuts import render, get_object_or_404

def grid_view(request):
    return render(request, 'products/grid.html')