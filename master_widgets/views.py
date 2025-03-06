from django.shortcuts import render
from django.http import HttpResponse
from django.urls import reverse_lazy
import json
from .api import registry

def get_models(request):
    models_info = json.dumps(registry.get_models_info(), skipkeys=True, indent=4)
    models_url = reverse_lazy(registry.router.root_view_name)
    return render(request, 'master_widgets/init.js', locals(), 'application/x-javascript')