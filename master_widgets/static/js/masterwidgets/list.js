class MasterList extends MasterWidget{
    init(attrs = {}){
        this.jqx_type = 'jqxListBox';
        defaults(attrs, {
            'width': 150,
            'height': 300
        });
        super.init(attrs);
    }
}

class MasterModelList extends MasterList{
    init(attrs={}){
        new MasterModelLoader(this);
        this.jqx_type = 'jqxListBox';
        super.init(attrs);
    }

    render(){
        var adapter = this.model.getChoicesAdapter();
        this.attrs.source = adapter;
        this.paginator = this.renderPaginator();
        
        super.render();
    }
    renderPaginator(){
        var p_target = $('<div/>', {'class':'listbox-paginator'}).appendTo(this.target);
        return new MasterPaginator(p_target, {'parent': this, 'totalPages': 10, 'onPageChange':function(){}});
    }
}
