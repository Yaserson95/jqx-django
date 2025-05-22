(jQuery)(function($){
    if($.masterWidget){
        $.masterWidget.config({
            'models_url': "{{ models_url }}",
            'models': {{ models_info|safe }}
        });
    }
});