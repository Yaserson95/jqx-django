from django.shortcuts import render, get_object_or_404

def org_structure_view(request):
    return render(request, 'org/org_structure.html')