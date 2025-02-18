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
        this.__is_add = false;
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
        this.target.on({
            'expand': (...args)=>{this.onExpand(...args)},
            'collapse': (...args)=>{this.onCollapse(...args)}
        });
        this.loadNodeChildren();
    }

    addItem(node, item_data){
        //Update item data
        var item = this.getItemContent(item_data, this.nodes_info.length);
        //Add item to tree
        this.jqx('addTo', item, node);
        //Get item element
        var element = this.target.find('#'+item.id)[0];
        element.treeID = this.nodes_info.length;
        item_data.element = element;
        //Save additional item data
        this.nodes_info.push(item_data);
        return element;
    }
    removeItem(node){
        this.nodes_info[node.treeID] = null;
        this.jqx('removeItem', node);
    }
    getItem(node){
        var data = this.jqx('getItem', node);
        if(node.treeID !== undefined)
            data = {...data, ...this.nodes_info[node.treeID]};
        return data;
    }
    getLastItem(node = null){
        if(node === null) node = this.target[0];
        var cld = $(node).find('>ul>li:last-child');
        if(cld.length === 0)
            return null;
        return cld[cld.length - 1];
    }

    getItemById(node_id){
        if(node_id === null)
            return null;
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
            this.addItem(node, data.results[i]);
        }
        this.showNodeLoader(node, false);
        this.__updateNode(data);
    }

    showNodeLoader(node, show=true){
        var node_data = this.getItemLoader(node!==null?node.id:'root');
        var target_node = this.target.find('#'+node_data.id);
        if(show && (target_node.length === 0)){
            this.jqx('addTo', node_data, node);
        }else if(target_node.length !== 0){
            this.jqx('removeItem', target_node[0]);
        }
    }

    isExpand(element){
        var item = this.opened_nodes[element.id];
        return (item !== undefined)? item.expand: false;
    }

    onExpand(e){
        if(this.opened_nodes[e.args.element.id] === undefined)
            this.loadNodeChildren(e.args.element);

        this.opened_nodes[e.args.element.id].expand = true;
    }
    onCollapse(e){
        if(this.opened_nodes[e.args.element.id] !== undefined)
            this.opened_nodes[e.args.element.id].expand = false;
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
        var parent_node = (data.item_id!==null)? this.target.find('#'+data.item_id): null;
        node_info.next = (data.next !== null);
        node_info.last_node = this.getLastItem(parent_node);
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
                this.parent.openEditDialog(this.current_data);
                break;
            case 'remove':
                this.parent.openRemoveDialog(this.current_data);
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
    static toItemData(data, info){
        return {
            'label': data.label,
            'value': data.item[info.id],
            'parent': data.item[info.parent],
            'item_type': info.type,
            'has_items': data.has_items || false
        };
    }
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

    getNodeByValue(value, item_type=0){
        var nodes = this.jqx('getItems');
        
        if(value === null) return null;
        
        for(var i=0; i<nodes.length; i++){
            var element_id = nodes[i].element.treeID || null;
            var val = nodes[i].value;
            var node_data = this.nodes_info[element_id] || null;
            if(node_data === null) continue;

            if(value === val && node_data.item_type === item_type)
                return nodes[i];
        }
        return null;
    }

    getFormSource(item_type){
        return `${this.source}form/${item_type}/`;
    }

    /**
     * Get information by create action
     * @param {int} item_type 
     * @returns {object}
     */
    getAddActionInfo(item_type){
        var type_info = this.item_types[item_data.item_type];
        return {
            'label': `Создать ${type_info.name.toLowerCase()}`,
            'action':`${this.source}?item_type=${item_type}`,
            'request': {'method': 'POST'}
        };
    }

    /**
     * Get information by update action
     * @param {object} node_info 
     * @returns {object}
     */
    getUpdateActionInfo(node_info){
        var type_info = this.item_types[node_info.item_type];
        return {
            'label': `Изменить ${type_info.name.toLowerCase()} "${node_info.label}"`,
            'action':`${this.source}${node_info.value}/?item_type=${node_info.item_type}`,
            'request': {'method': 'PUT'}
        };
    }

    __initModelDialog(node_info, value, item_type = 0, add=false){
        var model_info = this.item_types[node_info];
        var action_info = add? this.getAddActionInfo(item_type):
            this.getUpdateActionInfo(node_info);

        //If dialog not created
        if(model_info.dialog === undefined){
            var dialog_target = $('<div/>', {'class': 'master-tree-dialog model-dialog'})
                .appendTo(this.target);

            //Create dialog
            model_info.dialog = new MasterModelFormDialog(dialog_target, {
                'parent': this,
                'title': action_info.label,
                'source': this.getFormSource(item_type),
                'formOptions':{
                    'action': action_info.action,
                    'id': model_info.id,
                    'saveRequest': action_info.request
                }
            });

            //Add info
            model_info.dialog.info = {
                'type': model_info.type, 
                'parent': model_info.parent, 
                'id': model_info.id
            };

            //Init save action
            model_info.form.on('save', (e)=>{
                this.onSaveForm(e);
            });
        }else{

        }
    }

    __getModelDialog(model_info, title, value, add=false){
        if(model_info.dialog === undefined){
            var dialog_target = $('<div/>', {'class': 'master-tree-dialog model-dialog'})
                .appendTo(this.target);       

            model_info.dialog = new MasterModelFormDialog(dialog_target, {
                'parent': this,
                'title': title,
                'source': `${this.source}form/${model_info.type}/`,
                'formOptions':{
                    'action': this.source,
                    'id': model_info.id
                }
            });
            model_info.dialog.info = {'type': model_info.type, 'parent': model_info.parent, 'id': model_info.id};
        }else{
            model_info.dialog.setTitle(title);
            model_info.dialog.form.clear();
        }
        model_info.dialog.form.on('save', (e)=>{
            this.onSaveForm(e);
        });
        
        return model_info.dialog;
    }

    openCreateDialog(item_data, node_info){
        var type = this.item_types[item_data.item_type];
        var title = `Создать ${type.name.toLowerCase()}`;
        var dialog = this.__getModelDialog(type, title);
        var value = {};

        this.__is_add = true;
        
        value[type.parent] = (node_info !== null)? node_info.value: null;
        dialog.form.formAction(
            `${this.source}?item_type=${item_data.item_type}`, 
            {'method': 'POST'}
        );
        dialog.info.node = node_info;
        dialog.open(value);
    }

    async openEditDialog(node_info){
        var type = this.item_types[node_info.item_type];
        this.__is_add = false;

        try{
            var data = await $.ajax({
                'url': `${this.source}${node_info.value}/`,
                'method': 'GET',
                'data':{'item_type': node_info.item_type}
            });

            var title = `Изменить ${type.name.toLowerCase()} "${data.label}"`;
            var dialog = this.__getModelDialog(type, title);
            dialog.form.formAction(
                `${this.source}${node_info.value}/?item_type=${node_info.item_type}`, 
                {'method': 'PUT'}
            );
            
            dialog.info.node = node_info;
            dialog.open(data.item);
        }catch(e){
            console.error(e.message);
        }
    }

    async openRemoveDialog(node_info){
        var type = this.item_types[node_info.item_type];
        var action = `${this.source}${node_info.value}/?item_type=${node_info.item_type}`;
        var conf = confirm(`Вы действительно хотите удалить ${type.name.toLowerCase()} "${node_info.label}"`);
        try{
            if(conf){
                var data = await $.ajax(action,{'method': 'DELETE'});
                this.jqx('removeItem', node_info.element);
            }
        }catch(e){
            console.error(e);
        }
    }

    onSaveForm(e){
        var dialog = $(e.target).data('masterWidget').parent;
        var newData = e.response;
        if(this.__is_add){
            this.__add(newData, dialog.info);
        }else{

        }
    }

    __add(item, info){
        var parent_id = item.item[info.parent];
        var item_data = MasterTree.toItemData(item, info);
        
        //If element was added in root
        if(parent_id === null){
            this.addItem(null, item_data);
            return;
        }
        var parent_item = this.getNodeByValue(parent_id);
        
        //If element was added in unloaded node
        if(parent_item === null)
            return;
        
        //If element was added in empty node
        if(!parent_item.hasItems){
            this.showNodeLoader(parent_item.element);
            this.jqx('expandItem', parent_item.element);
            return;
        }

        if(parent_item.isExpanded){
            //If element was added in expanded node
            this.addItem(parent_item.element, MasterTree.toItemData(item, info));
        }else{
            this.jqx('expandItem', parent_item.element);
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