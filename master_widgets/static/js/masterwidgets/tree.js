class BaseMasterTree extends MasterWidget{
    static loaderItem(item){
        return {
            'id': item.id + '-loader',
            'label': 'Загрузка...',
            'value': null
        };
    }

    itemLoader(element, show=true){
        var loader = this.jqx_target.find(element.attr('id')+'-loader');
    }

    widgetOptionsPatterns(patterns={}){
		return super.widgetOptionsPatterns({
            ...patterns,
            'ordering': {'type': ['string', 'array'], 'default': 'label'},
		});
	}

    init(attrs = {}){
        this.jqx_type = 'jqxTree';
        this.index = 0;
        super.init(attrs);
    }

    addItems(items, node=null){
        var id_s = [];
        for(var i in items){
            items[i] = this.updateItem(items[i]);
            id_s.push(items[i].id);
        }
        this.jqx('addTo', items, node);
        return this.jqx_target.find(id_s);
    }

    updateItem(item){
        item.id = this.getItemID();
        if(item.has_items){
            item.items = [BaseMasterTree.loaderItem(item)];
        }
        return item;
    }

    getItemID(){
        return `${this.jqx_target.attr('id')}item${this.index++}`;
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

    render(){
        this.loader(this.loadParametres()).then((data)=>{
            this.adapter = new $.jqx.dataAdapter(this.getAdapterOptions());
            super.render();
            this.adapter.dataBind();
        });
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

            'beforeLoadComplete':(records) => {
                this.addItems(records, null);
                return records;
            }

            /*'formatData':(data)=>{
                return this.getRequestData(data);
            },
            'loadComplete': (data)=>{
                this.loadComplete(data);
            }*/
        }
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