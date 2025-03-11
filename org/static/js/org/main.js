'use strict';
(jQuery)(function($){
    $(document).ready(function (){
        var tree = new MasterModelTree('#org-structure', {
            'source': '/org/tree/',
            'width': '100%',
            'height': 400,
            'ordering': 'item_type',
            'allowDrag': true,
            'allowDrop': true
        });        
    });

    var list = new MasterModelList('#test-widget', {
        'model': 'product'
    });
});