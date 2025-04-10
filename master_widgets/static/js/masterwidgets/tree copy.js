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
        this.__tree_id = 0;
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
            if(parent_item.exclude !== undefined)
                this.node_request.exclude = parent_item.exclude.join(';');
        }

        this.showNodeLoader(parent_node);
        this.adapter.dataBind();
    }

    render(){
        this.attrs.dragStart = (...args)=>{return this.dragStart(...args)};
        this.attrs.dragEnd = (...args)=>{return this.dragEnd(...args)};
        super.render();
        this.jqx_target.on({
            'expand': (...args)=>{this.onExpand(...args)},
            'collapse': (...args)=>{this.onCollapse(...args)},
        });
        this.loadNodeChildren();
    }

    addItem(node, item_data){
        //Update item data
        var item = this.getItemContent(item_data, this.__tree_id);
        //Add item to tree
        this.jqx('addTo', item, node);
        //Get item element
        var element = this.jqx_target.find('#'+item.id)[0];
        element.treeID = this.__tree_id;
        item_data.element = element;
        //Save additional item data
        this.nodes_info.push(item_data);
        this.__tree_id++;
        return element;
    }
    removeItem(node){
        if(this.nodes_info[node.treeID] !== undefined)
            delete(this.nodes_info[node.treeID]);
        this.jqx('removeItem', node);
    }
    getItem(node){
        var data = this.jqx('getItem', node);
        if(node.treeID !== undefined)
            data = {...data, ...this.nodes_info[node.treeID]};
        return data;
    }
    updateItem(item, new_data){
        var item_data = this.getItemContent(new_data);
        this.jqx('updateItem', item, item_data);

        if(item.treeID && this.nodes_info[item.treeID])
            this.nodes_info[item.treeID] = {...this.nodes_info[item.treeID], ...new_data};
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

    getItemContent(item_data, id = null){
        var item = {
            'value': pop_attr(item_data, 'value'),
        };

        //Item content
        var item_content = $('<label/>', {'class': 'master-tree-item'})
            .text(pop_attr(item_data, 'label'));

        //If item have id (adding)
        if(id !== null){
            item.id = this.nodeId('node' + id);
            //If item have children
            if(item_data.has_items)
                item.items = [this.getItemLoader(this.nodeId('node' + id))];
        }
        
        //If item have icon
        if(item_data.icon !== undefined)
            item_content.prepend(this.getItemIcon(item_data.icon));

        //If item have addition css class
        if(item_data.class_name !== undefined)
            item_content.addClass(item_data.class_name);
        
        item.html = item_content[0].outerHTML;
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
    getItemIcon(name){
        return faicon(name).addClass('master-tree-icon');
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
    dragStart(item){
        return true;
    }
    dragEnd(dragItem, dropItem, args, dropPosition, tree){
        return true;
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
        var type_info = this.item_types[item_type];
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
    getItemContent(item_data, id){
        console.log(item_data);
        var item_model = this.item_types[item_data.item_type];
        item_data.class_name = `item-${item_model.className.toLowerCase()}`;
        if(item_model.icon !== undefined)
            item_data.icon = item_model.icon;
        return super.getItemContent(item_data, id);
    }

    openCreateDialog(item_data, node_info){
        var dialog = this.__initModelDialog(node_info, item_data.item_type, null, true);
        dialog.open();
    }

    async openEditDialog(node_info){
        var action_info = this.getUpdateActionInfo(node_info);
        try{
            var value = await $.ajax(action_info.action, {'method':'GET'});
            var dialog = this.__initModelDialog(node_info, node_info.item_type, value.item, false);
            dialog.info.current = node_info;
            dialog.open();
        }catch(e){
            console.error(e);
        }
    }

    async openRemoveDialog(node_info){
        var type = this.item_types[node_info.item_type];
        var action = `${this.source}${node_info.value}/?item_type=${node_info.item_type}`;
        var conf = confirm(`Вы действительно хотите удалить ${type.name.toLowerCase()} "${node_info.label}"`);
        try{
            if(conf){
                var data = await $.ajax(action,{'method': 'DELETE'});
                this.removeItem(node_info.element);
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
            this.__update(newData, dialog.info);
        }
        dialog.close();
    }

    dragEnd(drag_item, drop_item, drop_position, tree){
        var drop_node = this.getItem(drop_item.element);
        var drag_node = this.getItem(drag_item.element);

        if(tree === 'inside'){
            if(drop_node.item_type !== 0) return false;
            if(!drop_item.isExpanded)
                this.__addExcludes(drop_node.element.treeID, drag_node.value, drag_node.item_type);
        }else{
            if(drop_item.parentElement === drag_item.parentElement)
                return true;
            if(drag_node.item_type !== 0 && drop_item.parentElement === null)
                return false;
        }

        this.__updateParent(drag_node, (tree === 'inside')? drop_node.value: drop_node.parent);
        return true;
    }

    __initModelDialog(node_info, item_type = 0, value = null, add=false){
        var model_info = this.item_types[item_type];
        var action_info = add? this.getAddActionInfo(item_type):
            this.getUpdateActionInfo(node_info);

        //If create
        if(add && value===null && node_info !== null){
            value = {};
            value[model_info.parent] = node_info.value;
        }

        this.__is_add = add;

        //If dialog not created
        if(model_info.dialog === undefined){
            var dialog_target = $('<div/>', {
                'class': 'master-tree-dialog model-dialog item-' + model_info.className.toLowerCase()
            })
            .appendTo(this.target);

            //Create dialog
            model_info.dialog = new MasterModelFormDialog(dialog_target, {
                'parent': this,
                'title': action_info.label,
                'source': this.getFormSource(item_type),
                'icon': model_info.icon || null,
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
            model_info.dialog.form.on('save', (e)=>{
                this.onSaveForm(e);
            });
        }else{
            model_info.dialog.title = action_info.label;
            model_info.dialog.form.formAction(action_info.action, action_info.request);
        }

        model_info.dialog.form.clear();

        if(value !== null)
            model_info.dialog.value(value);

        return model_info.dialog;
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

    __update(item, info){
        var item_data = MasterTree.toItemData(item, info);
        if(item_data.parent !== info.current.parent){
            this.removeItem(info.current.element);
            this.__add(item, info);
        }else{
            this.updateItem(info.current.element, item_data);
        }
    }

    __updateParent(node_info, parent){
        var type = this.item_types[node_info.item_type];
        var action = this.getUpdateActionInfo(node_info);
        action.request.method = 'PATCH';
        action.request.data = {};
        action.request.data[type.parent] = parent;
        $.ajax(action.action, action.request);
    }
    __addExcludes(tree_id, value, item_type){
        if(this.nodes_info[tree_id].exclude === undefined)
            this.nodes_info[tree_id].exclude = [];
        this.nodes_info[tree_id].exclude.push(`${item_type},${value}`);
        console.log(this.nodes_info[tree_id].exclude);
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