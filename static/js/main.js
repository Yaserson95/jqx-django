(jQuery)(function($){
    async function wgt(){
        await $.loadModules();
        var wgt = new MasterWidget($('#test-widget'), {'width': 400, 'height': 400});
        return wgt;
    }

    $.masterWidget.option('theme', 'material-purple');
    
    //wgt();
});