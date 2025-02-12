class MasterMenu extends MasterWidget{
    static getItemType(item_data){
        if(item_data.url !== undefined)
            return 'link';
        return item_data.type || 'item';
    }

    static createItem(item_data){
        switch(item_data.type){
            case 'link':
                return $('<a/>', {'href': item_data.url});
            case 'checkbox':
                return $('<label><input type="checkbox"></label>');
            default:
                return $('<span/>');
        }
    }

    widgetOptionsPatterns(patterns = {}){
		return super.widgetOptionsPatterns({...patterns, ...{
			'items': {'type': 'array',},
        }});
	}

    init(options){
        this.jqx_type = 'jqxMenu';
        this.lists = [];
        if(options.source !== undefined)
            delete(options.source);
        super.init(options);
    }

    render(){
        var list = this.renderList(this.items).appendTo(this.target);
        this.target.addClass('master-menu');
        this.lists.push(list[0]);

        this.target.on('itemclick', (e)=>{
            var tag = $(e.target).prop('tagName');
                        
            if(e.args.data.type==='checkbox'){
                if(['INPUT', 'LABEL'].indexOf(tag)===-1)
                    $(e.args).find('input').click();

                if(tag === 'INPUT') this.itemClick(e);
            }
            else this.itemClick(e);
        });

        super.render();
    }

    renderItem(item_data){
        var item = $('<li/>', {'class': 'menu-item'});
        var item_content = $('<p/>', {'class': 'menu-item-content'}).appendTo(item);
        var sub_items = pop_attr(item_data, 'items');

        item_data.type = MasterMenu.getItemType(item_data);
        var item_title = MasterMenu.createItem(item_data);

        item_title.addClass('menu-item-title')
            .append(item_data.label)
            .appendTo(item_content);

        
        if(item_data.type === 'checkbox'){
            item_title.find('input').click(function(){
                item_data.checked = $(this).prop('checked');
            }).prop('checked', item_data.checked);
            item_data.noClose = true;
        }
        
        if(sub_items){
            var list = this.renderList(sub_items);
            item.append(list);
            this.lists.push(list[0]);
            item_data.noClose = true;
        }
        item[0].data = item_data;
        return item;
    }

    renderList(items){
        var list = $('<ul/>', {'class':'master-menu-list'});
        for(var i in items){
            list.append(this.renderItem(items[i]));
        }
        return list;
    }
    itemClick(e){
        var element = e.args;
        if(element.data.noClose) 
            return false;
        return true;
    }
}

class MasterContextMenu extends MasterMenu{
    widgetOptionsPatterns(patterns = {}){
		return super.widgetOptionsPatterns({...patterns, ...{
			'elements': {'type': 'string'},
            'autoOpen': {'type': 'boolean', 'default': true, 'name': 'auto_open'}
        }});
	}

    init(options){
        options.autoOpenPopup = false;
        options.mode = 'popup';
        options.autoCloseOnClick = false;

        super.init(options);
    }
    initTarget(target){
        this.parentTarget = target;
        return $('<div />', {'class':'master-context-menu'}).appendTo(target);
    }

    render(){
        this.update();
        super.render();
    }
    open(e){
        var scrollTop = $(window).scrollTop();
        var scrollLeft = $(window).scrollLeft();
        this.jqx('open', parseInt(e.clientX) + 5 + scrollLeft, parseInt(e.clientY) + 5 + scrollTop);
    }
    close(e){
        this.jqx('close');
    }

    update(){
        $(document).on({
            'contextmenu': (e) => {
                return this.onContextMenu(e);
            },
            'click':(e) => {
                if($(this.lists).inParents(e.target)===false){
                    this.close(e);
                }
            }
        });
    }

    itemClick(e){
        var close = super.itemClick(e);
        if(close) this.close(e);
        return close;
    }
    onContextMenu(e){
        var elements = this.getElements();
        var current = elements.inParents(e.target);
        if(current){
            this.current = current;
            if(this.auto_open) this.open(e);
            return false;
        }
        this.close(e);
        return true;
    }
    
    getElements(){
        return this.parentTarget.find(this.elements);
    }
}