'use strict';
(jQuery)(function($){ 
    const LOCAL_DATA = Object.keys($.fn).map((item, i)=>({
        'label': `${i + 1}. ${item}`,
        'value': item.toUpperCase()
    }));

    Promise.all([
        $('#list').masterWidget('list.List', {'checkboxes': true, 'source': LOCAL_DATA}),
        $('#object-list').masterWidget('list.ModelList', {'model': 'product'}),
        $('#simple-form').masterWidget('form.Form2', {
            'template': [
                {
                    name: 'firstName',
                    type: 'text',
                    label: 'First name',
                    required: true,
                    labelWidth: '80px',
                    width: '250px',
                    info: 'Enter first name',
                    infoPosition: 'right'
                },
                {
                    name: 'lastName',
                    type: 'text',
                    label: 'Last name',
                    required: true,
                    labelWidth: '80px',
                    width: '250px',
                    info: 'Enter last name'
                },  
                {
                    name: 'company',
                    type: 'text',
                    label: 'Company',
                    required: false,
                    labelWidth: '80px',
                    width: '250px'
                },
                {
                    name: 'address',
                    type: 'text',
                    label: 'Address',
                    required: true,
                    labelWidth: '80px',
                    width: '250px'
                },
                {
                    name: 'city',
                    type: 'text',
                    label: 'City',
                    required: true,
                    labelWidth: '80px',
                    width: '250px'
                },
                {
                    name: 'state',
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
                    name: 'zip',
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
                            name: 'sign_up',
                            text: 'Sign up',
                            width: '90px',
                            height: '30px',
                            rowHeight: '40px',
                            columnWidth: '50%',
                            align: 'right'
                        },
                        {
                            type: 'button',
                            name: 'cancel',
                            text: 'Cancel',
                            width: '90px',
                            height: '30px',
                            rowHeight: '40px',
                            columnWidth: '50%'
                        }                
                    ]
                }
            ]
        })

        /*$('#org-structure').masterWidget('tree.ModelTree', {
            'source': '/org/tree/',
            'width': '100%',
            'height': 400,
            //'ordering': 'item_type',
            'allowDrag': true,
            'allowDrop': true
        })*/
    ]).then((wgts)=>{
        wgts[0].value = ['EACH', 'SLICE'];
    });
});