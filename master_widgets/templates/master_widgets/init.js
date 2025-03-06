(jQuery)(function($){
    if($.masterModel){
        $.masterModel.base_url = "{{ models_url }}";
        $.masterModel.set({{ models_info|safe }});
    }
});