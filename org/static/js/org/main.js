(jQuery)(function($){
    $(document).ready(function (){
        new MasterModelTree('#org-structure', {
            'source': '/org/tree/',
            'width': '100%',
            'height': '400px',
            'ordering': 'item_type',
            'allowDrag': true,
            'allowDrop': true
        });
    });
});