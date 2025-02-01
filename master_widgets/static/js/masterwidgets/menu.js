class MasterMenu extends MasterWidget{
    init(options){
        this.items = pop_attr(options, 'items');
        this.jqx_type = 'jqxMenu';
        super.init(options);
    }

    render(){
        this.target.append(this.renderList(this.items));
        super.render();
    }

    renderItem(item_data){
        var item = $('<li/>', {'class': 'menu-item'});
        var item_content = $('<p/>', {'class': 'menu-item-content'}).appendTo(item);
        if(item_data.url !== undefined){
            var item_title = $('<a/>', {'href': item_data.url})
        }else{
            var item_title = $('<span/>');
        }
        item_title.addClass('menu-item-title').text(item_data.label).appendTo(item_content);
        if(item.items !== undefined)
            item.append(this.renderList(item.items));
        return item;
    }

    renderList(items){
        var list = $('<ul/>', {'class':'menu-list'});
        for(var i in items){
            list.append(this.renderItem(items[i]));
        }
        return list;
    }
}

class MasterContextMenu extends MasterMenu{
    init(options){
        this.element = pop_attr(options, 'element');
        this.openOnClick = pop_attr(options, 'openOnClick', true);
        options.autoOpenPopup = false;
        options.mode = 'popup';
        super.init(options);
    }

    render(){
        $(document).on('contextmenu', (e) => {
            if(this.element.inParents(e.target))
                return false;
            return true;
        });
        super.render();
    }
}