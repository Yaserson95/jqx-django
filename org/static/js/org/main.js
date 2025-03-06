(jQuery)(function($){
    $(document).ready(function (){
        var tree = new MasterModelTree('#org-structure', {
            'source': '/org/tree/',
            'width': '100%',
            'height': '400px',
            'ordering': 'item_type',
            'allowDrag': true,
            'allowDrop': true
        });

        //var test_widget = new MasterWidget('#test-widget');
        //test_widget.showLoader();
        
    });

    

    async function test_model(){
        var em = MasterModel.get('product');

        var list = em.list();
        console.log(await em.retrieve(5));
        console.log(await list.filter({'category': 2}).data());
    }

    test_model();
});