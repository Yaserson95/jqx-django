const MASTER_FIELDS = {
    'list': 'jqxListBox',
    'checkedlist': 'jqxListBox',
};

class MasterFormField extends MasterWidget{
    set type(type){
        if(this.target.data('masterWidget'))
            return;

        this.__type = type;
        this.jqx_type = MASTER_FIELDS[type] || 'jqxInput';
    }

    get type(){
        return this.__type || null;
    }

    get is_field(){
        return true;
    }

    widgetOptionsPatterns(patterns={}){
		return super.widgetOptionsPatterns({...patterns,...{
			'type': {'type': 'string', 'default': 'text'},
		}});
	}

    init(attrs = {}){
        super.init(attrs);
    }

    value(...args){
        return this.target.sval(...args);
    }
};

class MasterListField extends MasterFormField{
    init(attrs = {}){
        if(attrs.type !== 'checkedlist')
            attrs.type = 'list';
        else attrs.checkboxes = true;
        super.init(attrs);
    }

    render(){
        super.render();
        //jqx-input-label jqx-input-label-material-purple
        var wgt_data = this.target.data('jqxWidget');
        if(!wgt_data.label){
            wgt_data.label = $('<label/>', {'class': `jqx-input-label jqx-input-label-${this.attrs.theme}`})
                .insertAfter(this.target);
        }
    }

    value(value){
        if(value === undefined){
            if(this.attrs.checkboxes)
                return this.jqx('getCheckedItems').map(item=>(item.value));                
            return this.jqx('getSelectedItem').value;
        }

        if(empty(value)){
            if(this.attrs.checkboxes)  this.jqx('uncheckAll');
            else this.jqx('val', '');
            return;
        }

        if(this.attrs.checkboxes){
            if(!Array.isArray(value)){
                throw new Error('Value typpe must be a array');
            }
            $(this.jqx('getItems')).each((i, e)=>{
                if(value.indexOf(e.value) !== -1)
                    this.jqx('checkItem', e);
            });
        }
    }
}


(jQuery)(function($){
    $.fn.masterFormField = function(data){
        switch(data.type){
            case 'list':
            case 'checkedlist':
                return new MasterListField(this, data);
        }
        return new MasterFormField(this, data);
    }
});