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
        this.nodes_info = [];
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
        if(node.treeID !== undefined)
            data = {...data, ...this.nodes_info[node.treeID]};
        return data;
    }
    getItemById(node_id){
        var node = this.target.find('#'+node_id);
        if(node.length === 0)
            return null;
        return this.getItem(node[0]);
    }

    getItemContent(item_data, id){
        var item = {
            'id': this.nodeId('node' + id),
            'value': pop_attr(item_data, 'value'),
            'label': pop_attr(item_data, 'label')
        };
        if(item_data.has_items)
            item.items = [this.getItemLoader(this.nodeId('node' + id))];
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
            var item_data = data.results[i];
            var item = this.getItemContent(item_data, this.nodes_info.length);
            this.addItem(node, item);

            var element = this.target.find('#'+item.id)[0];
            element.treeID = this.nodes_info.length;
            item_data.element = element;
            this.nodes_info.push(item_data);
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
    open(e, root=false){
        if(!root){
            this.openItem(e);
        }else{
            this.openRoot(e);
        }
        super.open(e);
    }

    openItem(e){
        var item = $(this.current).parent()[0];
        var item_data = this.parent.getItem(item);
        var item_type = this.parent.item_types[item_data.item_type];
        item_type.rules[2] = !item_data.has_items;
        this.current_data = item_data;
        this.updateRules(item_type.rules);
        this.parent.jqx('selectItem', item);
    }
    openRoot(e){
        this.current_data = null;
        this.updateRules([true, false, false]);
    }

    itemClick(e){
        switch(e.args.data.action){
            case 'create':
                this.parent.openCreateDialog(e.args.data, this.current_data);
                break;
            case 'edit':
                this.parent.openEditDialog(e.args.data, this.current_data);
                break;
        }
        return super.itemClick(e);
    }

    updateRules(rules){
        var menu_items = this.target.find('ul > li').toArray();
        for(var i in rules){
            if(i > menu_items.length - 1) break;
            this.jqx('disable', menu_items[i].id, !rules[i]);
        }
    }

    onContextMenu(e){
        if(!super.onContextMenu(e))
            return false;

        if($(this.parent.target).inParents(e.target)){
            this.open(e, true);          
            return false;
        }
        return true;
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
            'parent': this,
            'items':[
                creation,
                {'label':'Изменить', 'action':'edit'},
                {'label':'Удалить', 'action':'remove'}
            ]
        });
    }

    __getModelDialog(model_info, title){
        if(model_info.dialog === undefined){
            var dialog_target = $('<div/>', {'class': 'master-tree-dialog model-dialog'})
                .appendTo(this.target);            
                model_info.dialog = new MasterModelFormDialog(dialog_target, {
                'parent': this,
                'title': title,
                'source': `${this.source}form/${model_info.type}/`
            });
        }else{
            model_info.dialog.setTitle(title);
            model_info.dialog.form.clear();
        }
        return model_info.dialog;
    }

    openCreateDialog(item_data, node_info){
        var type = this.item_types[item_data.item_type];
        var title = `Создать ${type.name.toLowerCase()}`;
        var dialog = this.__getModelDialog(type, title);
        var value = {};

        value[type.parent] = (node_info !== null)? node_info.value: null;
        dialog.open(value);
    }

    async openEditDialog(item_data, node_info){
        var type = this.item_types[node_info.item_type];
        try{
            var data = await $.ajax({
                'url': `${this.source}${node_info.value}/`,
                'method': 'GET',
                'data':{'item_type': node_info.item_type}
            });

            var title = `Изменить ${type.name.toLowerCase()} "${data.label}"`;
            var dialog = this.__getModelDialog(type, title);
            dialog.open(data.item);
        }catch(e){
            console.error(e.message);
        }
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