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

        var form = new MasterForm('#simple-form', {
            'width': '100%',
            'template':[
                {
                    bind: 'firstName',
                    type: 'text',
                    label: 'First name',
                    required: true,
                    labelWidth: '80px',
                    width: '250px',
                    info: 'Enter first name',
                    infoPosition: 'right',
                    maxLength: 30,
                    minLength: 5
                },
                {
                    bind: 'lastName',
                    type: 'text',
                    label: 'Last name',
                    required: true,
                    labelWidth: '80px',
                    width: '250px',
                    info: 'Enter last name',
                    maxLength: 30
                },  
                {
                    bind: 'company',
                    type: 'text',
                    label: 'Company',
                    required: false,
                    labelWidth: '80px',
                    width: '250px'
                },
                {
                    bind: 'address',
                    type: 'text',
                    label: 'Address',
                    required: true,
                    labelWidth: '80px',
                    width: '250px'
                },
                {
                    bind: 'city',
                    type: 'text',
                    label: 'City',
                    required: true,
                    labelWidth: '80px',
                    width: '250px'
                },
                {
                    bind: 'state',
                    type: 'option',
                    label: 'State',
                    required: true,
                    labelWidth: '80px',
                    width: '250px',
                    component: 'jqxDropDownList',
                    options: [
                        { value: 'California' },
                        { value: 'New York'},
                        { value: 'Oregon'},
                        { value: 'Illinois'},
                        { value: 'Texas'}
                    ]
                },
                {
                    bind: 'zip',
                    type: 'text',
                    label: 'Zip code',
                    required: true,
                    labelWidth: '80px',
                    width: '250px'
                },
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
    });
});