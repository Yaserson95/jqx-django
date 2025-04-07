class MasterList extends MasterWidget{
    init(attrs = {}){
        this.jqx_type = 'jqxListBox';
        defaults(attrs, {
            'width': 200,
            'height': 300,
        });
        super.init(attrs);
    }
}

class MasterModelList extends MasterList{
    widgetOptionsPatterns(patterns = {}) {
        return super.widgetOptionsPatterns({
            'pageSize': {'type': 'number', 'name':'page_size', 'default': 100},
            'searched': {'type': 'boolean', 'default': true},
            'dropDown':  {'type': 'boolean', 'default': false, 'name':'drop_down'},
            'contentWidth': {'type': ['number', 'string'], 'name':'content_width', 'default': 300},
            'contentHeight': {'type': ['number', 'string'], 'name':'content_height', 'default': 350},
            ...patterns
        });
    }
    
    init(attrs={}){
        if(attrs.dropDown){
            defaults(attrs, {
                'width': 200,
                'height': 40,
            });
        }
        new MasterModelLoader(this);
        super.init(attrs);
        this.__checked = [];
        this.__label = null;
    }

    render(){
        this.paginator = this.__renderPaginator(this.target);
        this.paginator.hidden = true;
        this.paginator.page_size = this.page_size;

        this.attrs.source = this.__getListSource();

        if(this.searched)
            this.search_input = this.__renderSearch(this.target);

        if(this.drop_down){
            var drop_down_target = $('<div/>', {'class':'master-dropdown'})
                .insertAfter(this.target)
                .append(this.target);

            drop_down_target.jqxDropDownButton({
                'theme': this.theme,
                'width':this.width,
                'height': this.height,
                'dropDownWidth': this.content_width,
                'dropDownHeight': this.content_height
            });

            this.target.css('height', '100%');
            this.drop_down_target = drop_down_target;
        }
        this.__renderEvents();
        super.render();
    }

    __getListSource(){
        return this.model.getChoicesAdapter({
            'formatData': (data)=>{
                //Search
                var search = this.search_input.val();

                //Extra parametries
                var extra = {
                    'page': this.paginator.page,
                    'pagesize': this.paginator.page_size,
                };

                //Add search to extra
                if(search !== '') {
                    extra.search = search;
                }
                //Other parametres
                return {...data, ...extra};
            },
            'loadComplete':(data)=>{
                this.paginator.count = data.count;
                if(this.paginator.total_pages > 1)
                    this.paginator.hidden = false;
                else{
                    this.paginator.hidden = true;
                }
            },
            'beforeLoadComplete': (records)=>{
                if(this.attrs.checkboxes){
                    for(var i in records){
                        records[i].checked = this.__checked.indexOf(records[i].value)!==-1;
                    }
                }
            }
        });
    }

    __renderEvents(){
        this.paginator.on('changePage', ()=>{
            this.jqx('selectIndex', -1);
            this.attrs.source.dataBind();
        });

        this.jqx_target.on({
            'checkChange': (e)=>{
                var index = this.__checked.indexOf(e.args.value);
                if(e.args.checked && index === -1)
                    this.__checked.push(e.args.value);
                else if(!e.args.checked && index !== -1){
                    this.__checked.splice(index, 1);
                }
            },
            'bindingComplete': (e)=>{
                if(this.attrs.checkboxes) return;
                var records = this.attrs.source.records;
                
                for(var i in records){
                    if(records[i].value === this.__value){
                        this.jqx('selectIndex', i);
                        return;
                    }
                }
                if(this.drop_down && this.__label === null){
                    if(this.__value){
                        this.model.getChoiceItem(this.__value)
                            .then(item=>this.__select_item(item));
                    }
                }
            }, 
            'select': (e)=>{
                if(this.attrs.checkboxes) return;
                var index = parseInt(e.args.index);
                if(index === -1) return;
                var item = this.jqx('getItem', index);
                this.__select_item(item);
            }
        });
    }
    __select_item(item){
        this.__label = item.label;
        this.__value = item.value;
        this.__set_dropdown_text(this.label);
    }

    __set_dropdown_text(text){
        var dropDownContent = `<div style="margin-left: 3px;" class="dropdown-input">${text}</div>`;
        this.drop_down_target.jqxDropDownButton('setContent', dropDownContent);
    }
    __renderPaginator(target){
        var p_target = $('<div/>', {'class':'listbox-paginator'}).appendTo(target);
        return new MasterPaginator(p_target, {
            'parent': this, 
            'count': 1,
            'width': '100%'
        });
    }
    __renderSearch(target){
        var seacrh_input = $('<input/>', {
            'type': 'text', 
            'class': 'listbox-search', 
            'placeholder':'Найти'
        }).prependTo(target);

        seacrh_input.jqxInput({
            'theme': this.theme,
            'width': '100%',
            'height': '40px'
        });

        seacrh_input.on('blur keypress', (e) =>{
            if(e.type === 'keypress' && e.which !== 13) return;
            this.paginator.page = 1;
            this.attrs.source.dataBind();
        });

        return seacrh_input;
    }
    
    get content_target(){
        return this.drop_down? this.__drop_down: this.target;
    }

    get value(){
        if(this.attrs.checkboxes)
            return this.__checked;
        return this.__value;
    }

    get label(){
        return this.__label;
    }
    
    set value(value){
        //console.log(value);
        if(this.attrs.checkboxes){
            if(!Array.isArray(value))
                throw new Error('Value type must be a array');
            this.__checked = value;
        }else{
            this.__value = value;
        }
    }
}