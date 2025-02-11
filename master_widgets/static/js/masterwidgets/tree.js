class BaseMasterTree extends MasterWidget{
    widgetOptionsPatterns(patterns={}){
		return super.widgetOptionsPatterns({...patterns,...{
			'source': {'type': 'string'},
            'ordering': {'type': 'string', 'default': 'label'}
		}});
	}

    init(attrs){
        this.jqx_type = 'jqxTree';
        this.opened_nodes = {};
        this.node_id = 0;
        super.init(attrs);
        this.adapter = new $.jqx.dataAdapter(this.init_adapter());
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
};

class MasterTreeItemMenu extends MasterContextMenu{
    open(e){
        var item = $(this.current).parent();
        this.parent.jqx('selectItem', item[0]);
        super.open(e);
    }

    itemClick(e){
        switch(e.args.data.action){
            case 'create':
                this.parent.startCreate($(this.current).parent()[0], e.args.data);
                break;
        }
        return super.itemClick(e);
    }
}


class MasterTree extends BaseMasterTree{
    widgetOptionsPatterns(){
		return super.widgetOptionsPatterns({
			'itemTypes': {'type': 'array', 'name': 'item_types'},
            'itemsMenu': {'type': 'boolean', 'default': false, 'name': 'items_menu'},
            'itemsMenuClass': {'type': 'function', 'default': MasterTreeItemMenu, 'name': 'items_menu_class'}
		});
	}
    render(){
        super.render();
        if(this.items_menu) 
            this.item_context_menu = this.renderItemsMenu();
    }
    renderItemsMenu(){
        var creation = {'label': 'Создать'};
        if(this.item_types.length > 1){
            creation.items = this.item_types.map(tp=>({
                'item_type': tp.type,
                'label': tp.name,
                'action': 'create'
            }));
        }else{
            creation.action = 'create',
            creation.item_type = 0
        }
        return new this.items_menu_class(this.target, {
            'elements': 'li > .jqx-item',
            'autoOpen': true,
            'parent': this,
            'items':[
                creation,
                {'label':'Изменить', 'action':'edit'},
                {'label':'Удалить', 'action':'remove'}
            ]
        });
    }
    startCreate(parent, item_data){
        if(item_data.dialog === undefined){
            var dialog_target = $('<div/>', {'class': 'master-tree-dialog create-dialog'})
                .appendTo(this.target);            
            item_data.dialog = new MasterModelFormDialog(dialog_target, {
                'parent': this,
                'title': `Добавить ${item_data.label.toLowerCase()}`,
                'source': `${this.source}form/${item_data.item_type}/`
            });
        }
        item_data.dialog.open();
    }
};

class MasterModelTree extends MasterLoadedWidget{
    init(options = {}){
		options.widgetClass = MasterTree;
		options.url = options.source + 'config/';
		super.init(options);
		this.config = this.attrs;
	}
};