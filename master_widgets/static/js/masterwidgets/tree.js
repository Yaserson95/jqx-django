class MasterTree extends MasterWidget{
    init(attrs){
        this.jqx_type = 'jqxTree';
        this.source = pop_attr(attrs, 'source');
        this.ordering = pop_attr(attrs, 'ordering', 'label');
        this.opened_nodes = {};
        this.node_id = 0;
        this.adapter = new $.jqx.dataAdapter(this.init_adapter());
        super.init(attrs);
    }
    init_adapter(){
        return {
            'datatype': 'json',
            'type': 'GET',
            'autoBind':false,
            'url': this.source,
            'id': 'value',
            'root': 'results',
            'datafields': [
                {'name':'value'},
                {'name':'parent'},
                {'name':'label', 'type':'string'},
                {'name':'item_type', 'type':'int'},
                {'name':'has_items', 'type':'bool'},
            ],
            'formatData':(data)=>{
                return this.getRequestData(data);
            },
            'loadComplete': (data)=>{
                this.loadComplete(data);
            }
        }
    }
    loadNodeChildren(parent_node=null, page=1){
        this.node_request = {'page': page, 'ordering': this.ordering};
        this.__prepareNode(parent_node);
        if(parent_node){
            var parent_item = this.getItem(parent_node);
            this.node_request.parent = parent_item.value;
            this.node_request.item_id = parent_item.id;
        }

        this.showNodeLoader(parent_node);
        this.adapter.dataBind();
    }

    render(){
        super.render();
        this.target.on('expand', (...args)=>{this.onExpand(...args)});
        this.loadNodeChildren();
    }

    addItem(node, item_data){
        this.jqx('addTo', item_data, node);
    }
    removeItem(node){
        this.jqx('removeItem', node);
    }
    getItem(node){
        var data = this.jqx('getItem', node);
        return data;
    }
    getItemById(node_id){
        var node = this.target.find('#'+node_id);
        if(node.length === 0)
            return null;
        return this.getItem(node[0]);
    }

    getItemContent(item_data){
        var item = {
            'id': this.nodeId('node' + this.node_id),
            'value': item_data.value,
            'label': item_data.label
        };
        if(item_data.has_items)
            item.items = [this.getItemLoader(this.nodeId('node' + this.node_id))];
        this.node_id ++;
        return item;
    }

    getItemLoader(node_id=null){
        return {
            'id': `${node_id}-loader`,
            'label': 'Загрузка...',
            'disabled': true,
        };
    }
    getRequestData(data){
        return {...data, ...this.node_request};
    }
    loadComplete(data){
        var id = data.item_id;
        var node = (id!==null)? this.getItemById(id).element: null;
        for(var i in data.results){
            var item = data.results[i];
            this.addItem(node, this.getItemContent(item));
        }
        this.showNodeLoader(node, false);
        this.__updateNode(data);
    }

    showNodeLoader(node, show=true){
        var node_data = this.getItemLoader(node!==null?node.id:'root');
        var target_node = this.target.find('#'+node_data.id);
        if(show && (target_node.length === 0)){
            this.addItem(node, node_data);
        }else if(target_node.length !== 0){
            this.removeItem(target_node[0]);
        }
    }

    onExpand(e){
        if(this.opened_nodes[e.args.element.id] === undefined)
            this.loadNodeChildren(e.args.element);
    }
    nodeId(node_id=null){
        return `${this.id()}-${node_id!==null?node_id:'root'}`;
    }

    __prepareNode(node=null, page=1){
        var node_id = (node!==null)? node.id: 'root';
        if(this.opened_nodes[node_id] === undefined){
            this.opened_nodes[node_id] = {};
        }
        this.opened_nodes[node_id].page = page;
        this.opened_nodes[node_id].in_process = true;
    }

    __updateNode(data){
        var node_info = this.opened_nodes[(data.item_id!==null)? data.item_id: 'root'];
        node_info.next = (data.next !== null);
        node_info.last_node = this.node_id - 1;
        node_info.in_process = false;
    }
}