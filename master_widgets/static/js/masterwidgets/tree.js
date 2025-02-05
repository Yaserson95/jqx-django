class MasterTree extends MasterWidget{
    init(attrs){
        this.jqx_type = 'jqxTree';
        this.source = pop_attr(attrs, 'source')
        super.init(attrs);
    }
}