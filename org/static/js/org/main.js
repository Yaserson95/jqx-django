'use strict';
(jQuery)(function($){
    $(document).ready(function (){
        var tree = new MasterModelTree('#org-structure', {
            'source': '/org/tree/',
            'width': '100%',
            'height': 400,
            //'ordering': 'item_type',
            'allowDrag': true,
            'allowDrop': true
        });

        const LOCAL_DATA = Object.keys($.fn).map((item, i)=>({
            'label': `${i + 1}. ${item}`,
            'value': item.toUpperCase()
        }));

        var local_lst = new MasterList('#list', {
            'checkboxes': true,
            'source': LOCAL_DATA
        });
        local_lst.value = ['EACH', 'SLICE'];
        
        var list = new MasterModelList('#object-list', {'model': 'product',});
        list.value = 1;

        var dr_list = new MasterListInput('#object-choice', {'model': 'product', 'type': 'dropdown'});
        dr_list.value = 5;

        var dr_local_lst = new MasterListInput('#object-local', {
            'source': LOCAL_DATA,
            'type': 'dropdown'
        });
        dr_local_lst.value="PUSH";        

        var form_dialog = new MasterFormDialog('#simple-form', {
            'title': 'Форма заполнения объекта БД',
            'width': '100%',
            'model': 'product',
            /*'template':[
                {
                    type: 'blank',
                    rowHeight: '10px'
                },
                {
                    columns: [
                        {
                            type: 'button',
                            name: 'submit',
                            text: 'Submit',
                            width: '90px',
                            height: '30px',
                            rowHeight: '40px',
                            columnWidth: '50%',
                            align: 'right'
                        },         
                    ]
                }
            ]*/
        });

        $('#simple-form-btn').click(()=>{
            //form_dialog.open();
            console.log(tree.getItemsStructure(null));
        });
        

        /*while(prot){
            console.log(prot);
            prot = prot.prototype;
            
        }*/

        //console.log(form_dialog.constructor);

        //form.id = 2;
    });
});