'use strict';
(jQuery)(function($){
    $(document).ready(function (){
        /*var tree = new MasterModelTree('#org-structure', {
            'source': '/org/tree/',
            'width': '100%',
            'height': 400,
            'ordering': 'item_type',
            'allowDrag': true,
            'allowDrop': true
        });*/
        
        var list = new MasterModelList('#object-choice', {
            'model': 'product',
            'pageSize': 10,
            //'checkboxes':true,
            'dropDown': true
        });

        list.value = 1;

        var form = new MasterModelForm('#simple-form', {
            'width': '100%',
            'model': 'product',
            'template':[
                {
                    type: 'blank',
                    rowHeight: '10px'
                },
                {
                    columns: [
                        {
                            type: 'button',
                            name: 'submit',
                            text: 'Sign up',
                            width: '90px',
                            height: '30px',
                            rowHeight: '40px',
                            columnWidth: '50%',
                            align: 'right'
                        },
                        {
                            type: 'button',
                            text: 'Cancel',
                            width: '90px',
                            height: '30px',
                            rowHeight: '40px',
                            columnWidth: '50%'
                        }                
                    ]
                }
            ]
        });

        form.id = 2;
    });
});