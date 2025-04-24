class BaseMasterList extends MasterWidget{
    static getValueIndex(list, value){
        for(var i in list){
            if(list[i].value === value)
                return i;
        }
        return -1;
    }
    widgetOptionsPatterns(patterns = {}) {
        return super.widgetOptionsPatterns({
            'pageSize': {'type': 'number', 'name':'page_size', 'default': 10},
            ...patterns
        });
    }
    init(attrs = {}){
        this.jqx_type = 'jqxListBox';
        defaults(attrs, {
            'width': 250,
            'height': 320,
        });
        super.init(attrs);
    }
    render(){        
        this.paginator = this.renderPaginator();
        this.paginator.on('changePage', (e)=>{
            this.onChangePage(e);
        });
        this.searcher = this.renderSearch();
        super.render();

        if(!this.attrs.checkboxes)
            this.on('select', (evt)=>{this.onSelect(evt)});
        else this.on('checkChange', (evt)=>{this.onCheckChange(evt)});
    }

    renderPaginator(){
        var p_target = $('<div/>', {'class':'listbox-paginator'}).appendTo(this.target);
        return new MasterPaginator(p_target, {
            'parent': this, 
            'count': this.count,
            'pageSize': pop_attr(this, '__page_size'),
            'width': '100%'
        });
    }

    renderSearch(){
        var seacrh_input = $('<input/>', {
            'type': 'text', 
            'class': 'listbox-search', 
            'placeholder':'Найти'
        }).prependTo(this.target);

        seacrh_input.jqxInput({
            'theme': this.theme,
            'width': '100%',
            'height': '40px'
        });
        seacrh_input.on('blur keypress', (e) =>{
            if(e.type === 'keypress' && e.which !== 13) return;
            this.onSearch(e);
        });

        return seacrh_input;
    }

    getSource(){
        return [];
    }

    onChangePage(evt){
        this.page = this.paginator.page;
        this.update();
    }

    onSearch(evt){
        this.paginator.page = 1;
        this.update();
    }

    onSelect(evt){
        if(evt.args.index === -1)
            return;
        var item = this.jqx('getSelectedItem');
        this.__value = item.value;
    }

    onCheckChange(evt){
        if(!this.__value) this.__value = {};
        if(evt.args.checked){
            this.__value[evt.args.value] = {
                'label': evt.args.label,
                'value': evt.args.value
            };
        }else if(this.__value[evt.args.value]){
            delete this.__value[evt.args.value];
        }
    }

    validateValue(value){
        if(value === null) return null;
        if(!this.checkboxes) return value;

        if(!Array.isArray(value))
            throw new Error('Value type must be an array');

        var values = {};
        for(var i=0;i<value.length;i++)
            values[value[i]] = {'value': value[i]};
        return values;
    }

    update(){
        this.jqx('selectIndex', -1);
    }

    getListItem(value){
        return null;
    }

    set page(page){
        this.paginator.page = page;
    }

    get page(){
        return this.paginator.page;
    }

    set page_size(page_size){
        if(this.paginator)
            this.paginator.page_size = page_size;
        this.__page_size = page_size;
    }

    get page_size(){
        if(this.paginator)
            return this.paginator.page_size;
        else return null;
    }

    get count(){
        return this.jqx('getItems').length;
    }

    get total_pages(){
        return this.paginator.total_pages;
    }

    set value(value=null){
        if(value === null){
            if(this.__value){
                delete this.__value;
                this.jqx('selectIndex', -1);
            }
            return;
        }
        this.__value = this.validateValue(value);
        this.update();
    }

    get value(){
        if(!this.checkboxes)
            return this.__value || null;
        if(!this.__value)
            return [];
        
        var values = [];
        for(var i in this.__value)
            values.push(i);
        return values;
    }

    get search_text(){
        if(!this.searcher) return null;
        var val = this.searcher.val();
        if(val === '' || val === null) return null;
        return val;
    }

    get checkboxes(){
        return this.attrs.checkboxes || false;
    }
}

class MasterList extends BaseMasterList{
    widgetOptionsPatterns(patterns = {}) {
        return super.widgetOptionsPatterns({
            'source': {'type': 'array'},
            ...patterns
        });
    }

    render(){
        super.render();
        this.update();
    }

    getSource(){
        var data = this.searched? this.searched: this.source;
        return data.slice((this.page - 1)*this.page_size, this.page*this.page_size);
    }

    onChangePage(evt){
        this.page = this.paginator.page;
        this.update();
    }

    onSearch(evt){
        var val = this.search_text;
        if(val === null){
            if(this.searched) delete this.searched;
            this.paginator.count = this.source.length;
        }else{
            this.searched = [];
            for(var i in this.source){
                if(this.source[i].label.indexOf(val)!==-1)
                    this.searched.push(this.source[i]);
            }
            this.paginator.count = this.searched.length;   
        }
        this.paginator.page = 1;
        this.update();
    }

    validateValue(value){
        value = super.validateValue(value);
        if(value === null || !this.attrs.checkboxes)
            return value;

        var newValues = {};

        for(var i in this.source){
            this.source[i].checked = value[this.source[i].value] !== undefined;
            if(this.source[i].checked)
                newValues[this.source[i].value] = this.source[i];
        }
        return newValues;
    }

    update(){
        var local = this.getSource();
        this.jqx('source', local);
        this.trigger('dataBindComplite');
        if(this.__value && !this.attrs.checkboxes){
            this.jqx('selectIndex', BaseMasterList.getValueIndex(local, this.__value));
        }
    }

    getListItem(value){
        for(var i in this.source){
            if(this.source[i].value === value)
                return this.source[i];
        }
        return null;
    }

    get count(){
        return this.source.length;
    }
}

class MasterModelList extends BaseMasterList{
    widgetOptionsPatterns(patterns = {}) {
        patterns = super.widgetOptionsPatterns(patterns);
        delete patterns.source;
        return patterns;
    }

    init(attrs={}){
        this.__count = 0;
        new MasterModelLoader(this);
        super.init(attrs);
    }

    load(){
        this.source = this.model.getChoicesAdapter({
            'autoBind': false,
            'formatData': (data)=>{return this.formatData(data)},
            'loadComplete':(data)=>{return this.loadComplete(data)},
            'beforeLoadComplete': (records)=>{return this.beforeLoadComplete(records)}
        });
    }

    render(){
        this.attrs.source = this.getSource();
        super.render();
    }

    update(){
        super.update();
        if(this.source) this.source.dataBind();
    }

    getSource(){
        return this.source || [];
    }

    formatData(data){
        var extra = {
            'page': this.paginator.page,
            'pagesize': this.paginator.page_size,
        };

        //Search
        var search = this.search_text;
        //Add search to extra
        if(search !== null) extra.search = search;

        //Other parametres
        return {...data, ...extra};
    }
    loadComplete(data){
        this.paginator.count = data.count;
        if(this.paginator.total_pages > 1)
            this.paginator.hidden = false;
        else{
            this.paginator.hidden = true;
        }

        if(!this.attrs.checkboxes && this.__value){
            this.jqx('selectIndex', BaseMasterList.getValueIndex(this.source.records, this.__value));
        }
        this.trigger('dataBindComplite');
    }
    beforeLoadComplete(records){
        if(!this.__value)
            return records;

        if(this.attrs.checkboxes){
            for(var i in records){
                records[i].checked = this.__value[records[i].value]!==undefined;
            }
        }
        return records;
    }
    getListItem(value){
        return this.model.getChoiceItem(value);
    }

    get count(){
        return this.__count || 0;
    }
}

class MasterListInput extends MasterWidgetInput{
    init(attrs = {}){
        defaults(attrs, {
            'contentHeight': 300,
        });
        if(attrs.model)
            attrs.widgetClass = MasterModelList;
        else if(attrs.source)
            attrs.widgetClass = MasterList;
        super.init(attrs);
    }
    render(){
        super.render();
        if(!this.widget.checkboxes){
            this.widget.on('select', (event)=>{
                var item = this.widget.jqx('getSelectedItem');
                if(item !== null){
                    this.label = item.label;
                    this.clear_button.show();
                }
            });
        }else{
            this.label = '----выбрать несколько----';
        }
        this.widget.on({
            'dataBindComplite':(event)=>{
                var item = this.widget.jqx('getSelectedItem');
                var value = this.widget.value;

                if(this.widget.checkboxes)
                    return;
                
                if(item === null && !this.__initLabel && value){
                    if(this.widget instanceof MasterModelList){
                        this.widget.getListItem(value).then(item =>{
                            this.label = item.label;
                        });
                    }else if(this.widget instanceof MasterList){
                        this.label = this.widget.getListItem(value).label;
                    }
                    this.__initLabel = true;
                }
            }
        });
    }

    __setValue(value){
        this.__initLabel = false;
        super.__setValue(value);
    }
}