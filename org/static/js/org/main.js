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

    async function test_model(){
        var em = new MasterModel('/models/product/');
        //await em.initDataAdapter();
        var list = em.list();

        console.log(await list.data(), await list.pagesCount(), list.pageSize);
        console.log(await list.data(), await list.pagesCount(), list.pageSize);
        //console.log(em.retrieve(1));
    }

    test_model();

});