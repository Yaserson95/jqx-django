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
        //var item = $(this.current).parent()[0];
        this.updateRules([true, true, true]);
    }
    openRoot(e){
        //this.current_data = null;
        this.updateRules([true, false, false]);
    }

    itemClick(e){
        switch(e.args.data.action){
            case 'create':
                this.parent.openFormDialog({
                    'type': e.args.data.item_type,
                    'parent': $(this.current).parent()[0]
                });
                break;
            case 'edit':
                this.parent.openFormDialog($(this.current).parent()[0]);
                break;
        }
        /*switch(e.args.data.action){
            case 'create':
                this.parent.openCreateDialog(e.args.data, this.current_data);
                break;
            case 'edit':
                this.parent.openEditDialog(this.current_data);
                break;
            case 'remove':
                this.parent.openRemoveDialog(this.current_data);
                break;

        }*/
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

class BaseMasterTree extends MasterWidget{
    /**
     * 
     * @param {object} data 
     * @param {object} type_info 
     * @returns {object}
     */
    static toItem(data, type_info){
        var obj = {
            'label': renderStrTemplate(data, type_info.label),
            'value': data[type_info.id],
            'type': type_info.type,
            'parent': data[type_info.parent],
            'has_items': data.has_items || false
        };
        return obj;
    }
    widgetOptionsPatterns(patterns={}){
		return super.widgetOptionsPatterns({
            ...patterns,
            'ordering': {'type': ['string', 'array'], 'default': 'label'},
            'types': {'type': 'array',},
            'mainType': {'type': 'number', 'default': 0, 'name':'main_type'},
            'showItemsMenu': {'type': 'boolean', 'default': true, 'name':'show_menu'},
            'itemsMenuClass': {'type': 'function', 'default': MasterTreeItemMenu, 'name': 'items_menu_class'}
		});
	}

    init(attrs = {}){
        this.jqx_type = 'jqxTree';
        this.index = 0;
        super.init(attrs);
    }

    initItemTypes(types){
        return types;
    }

    initJQXTarget(target){
        this.root_list = $('<ul/>', {'class':'master-jqx-widget'}).appendTo(target);
		return this.root_list;
	}

    render(){
        super.render();
        if(this.show_menu)
            this.renderItemsMenu();

        this.items_info = [{
            'id': 'root',
            'value': null,
            'isExpanded': true
        }];
        this.jqx_target.on({
            'expand': (e)=>{this.onExpandItem(e);},
            'collapse': (e)=>{this.onCollapseItem(e);},
        });
    }

    renderItemsMenu(){
        var menu_options = [
            {'label': 'Создать'},
            {'label':'Изменить', 'action':'edit'},
            {'label':'Удалить', 'action':'remove'}
        ];

        if(this.types.length === 1){
            menu_options[0] = {
                ...menu_options[0],
                'action': 'create',
                'item_type': this.types[0].type
            };
        }else{
            menu_options[0].items = this.types.map(tp=>({
                'item_type': tp.type,
                'label': tp.name,
                'action': 'create'
            }));
        }

        return new this.items_menu_class(this.target, {
            'elements': 'li > .jqx-item',
            'parent': this,
            'items':menu_options,
            'height': 'auto'
        });
    }

    addItems(items, node=null){
        var id_s = [];
        for(var i in items){
            items[i] = this.initItem(items[i]);
            id_s.push('#' + items[i].id);
        }
        this.jqx('addTo', items, node);
        this.items_info = items;
        return this.jqx_target.find(id_s.join(','));
    }

    removeItem(element){
        var id = this.getElementID(element);
        this.removeChildren(element);
        if(this.__items_info[id])
            delete this.__items_info[id];
        this.jqx('removeItem', element);

        return this;
    }
    removeChildren(element){
        var children = this.getChildren(element);
        for(var i in children){
            this.jqx('removeItem', children[i]);
            if(this.__items_info[children[i].id])
                delete this.__items_info[children[i].id];
        }
        return this;
    }

    updateItem(data, element){
        //Updateing data
        var old_data = this.getItemOptions(element);
        data.id = old_data.id;
        data = this.initItem(data, true);
        this.jqx('updateItem', element, data);
        this.__items_info[data.id] = data;

        //Updating parent
        if(data.parent !== old_data.parent){
            if(data.parent === null)
                return this.moveElement(element, null);
            var parent = this.findItemID(data.parent, this.main_type);
            if(parent === null)
                this.removeItem(element);
            else this.moveElement(element, this.getItemByID(parent));
        }
        return this;
    }

    initItem(item, updating=false){
        item.find = `${item.type}:${item.value}`;
        if(!updating){
            item.id = this.getItemID();
            if(item.has_items){
                item.items = [this.getItemLoaderOptions(item.id + '-loader')];
            }
        }
        return item;
    }

    showElementLoader(element, show=true){
        var loader_id = this.getLoaderItemID(element);
        var loader_item = this.getItemByID(loader_id);
        if(show){
            if(!loader_item)
                this.jqx('addTo', this.getItemLoaderOptions(loader_id), element);
        }else{
            if(loader_item)
                this.jqx('removeItem', loader_item);
        }
    }

    getItemID(){
        return `${this.jqx_target.attr('id')}item${this.index++}`;
    }

    getElementID(element){
        if(!element)
            return this.jqx_target.attr('id')+'-root';
        return $(element).attr('id');
    }
    getLoaderItemID(element){
        return this.getElementID(element)+'-loader';
    }
    getItemLoaderOptions(item_id){
        return {
            'id': item_id,
            'label': 'Загрузка...',
            'value': null,
            'disabled': true
        };
    }
    getItemByID(item_id){
        var item = this.jqx_target.find('#'+item_id);
        return item[0]? item[0]: null;
    }

    getChildren(element=null){
        return ((element !== null)? $(element).find('li'): this.jqx_target.find('li')).toArray();
    }

    moveElement(element, to){
        var opts = copyKeys(
            this.getItemOptions(element),
            ['id', 'value', 'label', 'parent', 'type', 'has_items']
        );
        if(opts.has_items)
            opts.items = this.getItemsStructure(element);

        this.jqx('removeItem', element);
        
        if(to === null)
            this.jqx('addTo', opts, null);
        else{
            var parent_opts = this.getItemOptions(to)
            if(parent_opts.isExpanded){
                this.jqx('addTo', opts, to);
            }
        }
    }

    getItemsStructure(node=null){
        var list = (node !== null)? $(node).find('>ul'): this.jqx_target.find('ul.jqx-tree-dropdown-root');
        var parent_id = (node!==null)? this.jqx('getItem', node).value: null;
        var children = list.children().toArray();
        var items = [];

        for(var i in children){
            var opts = this.jqx('getItem', children[i]);
            var nodeInfo = {
                'id': opts.id,
                'label': opts.label,
                'value': opts.value,
                'parent': parent_id,
                'has_items': opts.hasItems,
            };
            if(opts.hasItems)
                nodeInfo.items = this.getItemsStructure(children[i]);

            if(this.__items_info[children[i].id]){
                nodeInfo.type = this.__items_info[children[i].id].type;
            }
            items.push(nodeInfo);
        }
        
        return items;
    }

    findItemID(value, type=0){
        var find = `${type}:${value}`;
        for(var i in this.__items_info){
            var item = this.__items_info[i];
            if(item.find === find){
                return i;
            }
        }
        return null;
    }

    getItemOptions(element){
        if(element === null)
            this.__items_info.root;
        
        var item = this.jqx('getItem', element);
        if(!item) return null;
        return {...item, ...(this.items_info[item.id] || {})};
    }

    updateItemOptions(element_id, options){
        element_id = element_id || 'root';
        this.__items_info[element_id] = {
            ...this.__items_info[element_id],
            ...options
        };
    }

    onExpandItem(event){}
    onCollapseItem(event){}

    set items_info(items_info){
        if(!this.__items_info)
            this.__items_info = {};

        for(var i in items_info){
            var id = items_info[i].id;
            this.__items_info[id] = Object.assign({}, items_info[i]);
            this.__items_info[id].loaded = false;
            this.__items_info[id].page = 1;
            this.__items_info[id].processed = false;
            if(this.__items_info[id].items)
                delete this.__items_info[id].items;
        }
    }

    get items_info(){
        return this.__items_info || {};
    }

    set types(types){
        this.__types = this.initItemTypes(types);
    }

    get types(){
        return this.__types || [];
    }
}

class MasterTree extends BaseMasterTree{
    widgetOptionsPatterns(patterns={}){
		return super.widgetOptionsPatterns({
            ...patterns,
			'source': {'type': 'array'},
            'items': {'type': ['array']},
		});
	}
}

class MasterModelTree extends BaseMasterTree{
    widgetOptionsPatterns(patterns={}){
		return super.widgetOptionsPatterns({
            ...patterns,
			'source': {'type': 'string'},
		});
	}

    init(attrs = {}){
        attrs.types = [];
        super.init(attrs);
    }

    render(){
        this.loader(this.loadParametres()).then((data)=>{
            this.adapter = new $.jqx.dataAdapter(this.getAdapterOptions());
            this.types = data.items;
            super.render();
            this.loadItems(null);
        });
    }

    initItemTypes(types){
        for(var i in types){
            this.initItemType(i, types[i]);
        }
        return types;
    }

    initItemType(index, type_info){
        var form_target = $('<div/>', {'id': `${this.jqx_target.attr('id')}form${index}`})
                .appendTo(this.target);
        type_info.model = MasterModel.getByName(type_info.class_name);
        type_info.form_dialog = new MasterFormDialog(form_target,{
            'parent':this,
            'title': 'Форма заполнения объекта БД',
            'model': type_info.model
        });
        type_info.form_dialog.widget.on({
           'save': (e, data, create)=>{
                var value = data[type_info.id];
                $.ajax({
                    'url': `${this.source}${value}/`,
                    'data':{'type':type_info.type},
                    'success':(data)=>{
                        this.onUpdateItem(data, type_info);
                    }
                });
                
           }           
        });
        return type_info;
    }

    onUpdateItem(data, type_info){
        var item_id = this.findItemID(data[type_info.id], type_info.type);
        var parent_id = this.findItemID(data[type_info.parent], this.main_type);
        
        //Create
        if(item_id === null){
            if(data[type_info.parent] === null) 
                return this.addItems([data]);
            if(parent_id !== null)
                return this.addItems([data], this.getItemByID(parent_id));
            return;
        }

        //Update
        return this.updateItem(data, this.getItemByID(item_id));
    }

    loadItems(element=null, page=1){
        var parent = (element)? this.jqx('getItem', element): null;
        var parent_id = element? this.getElementID(element): undefined;
        this.request_data = {
            'page': page,
            'node': parent_id,
            'parent': parent? parent.value: undefined
        };
        this.updateItemOptions(parent_id, {'loaded': false,'processed': true});
        this.showElementLoader(element);
        this.adapter.dataBind();
    }

    getAdapterOptions(){
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
                {'name':'type', 'type':'int'},
                {'name':'has_items', 'type':'bool'},
            ],

            'loadComplete':(data) => {
                this.loadComplete(data);
            },
            'formatData':(data)=>{
                return this.getRequestData(data);
            }
        }
    }

    onExpandItem(event){
        var element = event.args.element;
        var item = this.getItemOptions(element);
        if(!item.loaded) this.loadItems(element);
    }

    getRequestData(data){
        return {...data, ...this.request_data};
    }

    loadComplete(data){
        var node = data.node? this.getItemByID(data.node): null;
        this.updateItemOptions(data.node, {
            'loaded': true,
            'processed': false,
            'next': data.next!==null
        });

        this.showElementLoader(node, false);
        this.addItems(this.adapter.records, node);
    }

    openFormDialog(element=null){
        if(element instanceof HTMLLIElement){
            var item = this.getItemOptions(element);
            var type_info = this.types[item.type];
            var form_dialog = type_info.form_dialog;
            form_dialog.title = `Изменить ${type_info.name.toLowerCase()} "${item.label}"`
            form_dialog.widget.id = item.value;
        }else{
            var type_info = this.types[element.type];
            var form_dialog = type_info.form_dialog;
            form_dialog.title = `Создать ${type_info.name.toLowerCase()}`;
            form_dialog.icon = type_info.icon;
            form_dialog.widget.id = null;
            if(element.parent){
                var parent = this.getItemOptions(element.parent);
                if(parent.type === this.main_type){
                    var value = {};
                    value[type_info.parent] = parent.value;
                    form_dialog.widget.value = value;
                }
            }
        }
        form_dialog.open();
    }

    async loadParametres(){
        try{
            var data = await $.ajax(this.source, {'method':'OPTIONS'});
            this.items = data.items;
            return data;
        }catch(e){
            throw e;
        }
    }
}