const IGNORED_TYPES = ['blank', 'button'];
const FIELD_TYPES = [
    'text', 'option', 'blank', 'button', 'color', 
    'number', 'boolean', 'password', 'label', 'time', 'date', 'datetime'
];
const FIELD_PROPS = {
    'textarea':[
        "width", "height", "disabled", "value", 
        "placeHolder", "minLength", "maxLength", 
        "theme", "rtl", "scrollBarSize",
    ],
    'list':['source', 'selectedIndex', 'selectedIndexes', 'width', 'height',
        'disabled', 'enableSelection', 'checkboxes', 'multiple', 'filterable',
        'displayMember', 'valueMember', 'itemHeight', 'theme', 'rtl',
        'allowDrag', 'allowDrop', 'scrollBarSize', 'renderer'
    ],
    'text':["placeHolder", "minLength", "maxLength"]
};

class MasterForm extends MasterWidget{
    static isCustomType(type){
        return FIELD_TYPES.indexOf(type) === -1;
    }
    widgetOptionsPatterns(patterns={}){
		return super.widgetOptionsPatterns({
            ...patterns,
            'template': {'type':'array'}
        });
    }
    getWidgetOptions(){
        var opts = super.getWidgetOptions();
        var w = pop_attr(opts, 'width');
        var h = pop_attr(opts, 'height');
        opts.template = this.template;
        return opts;
    }

    init(options = {}){
        this.jqx_type = 'jqxForm';
        super.init(options);
    }

    render(){
        super.render();
        this.updateFields();
        var submit = this.jqx('getComponentByName', 'submit');
        if(submit){
            submit.click(()=>{
                this.validate();
            });
        }
    }
    updateFields(){
        var validators = [];
        for(var i in this.__fields_info){
            var info = this.__fields_info[i];
            var field = this.jqx('getComponentByName', info.name);
            this.createValidators(field, info, validators);
            this.initField(field, info);
        }
        this.target.jqxValidator({
            'rules':validators,
            'theme': this.theme,
            'hintType': "label"
        });
    };

    validate(){
        return this.target.jqxValidator('validate');
    }

    initField(field, info){
        if(info.type === 'textarea'){
            defaults(info, {'height': 120, 'theme': this.theme});
            field.jqxTextArea(copyKeys(info, FIELD_PROPS.textarea));
        }

        var widget_info = field.data('jqxWidget');
        var widget_name = widget_info? widget_info.widgetName: null;

        switch(widget_name){
            case 'jqxInput':
                field.jqxInput(copyKeys(info, FIELD_PROPS.text));
                break;
        }
    }

    createValidators(field, info, field_validators = []){
        if(MasterForm.isCustomType(field.type)){
            
        }
        if(info.required){
            field_validators.push({
                'input': field[0], 
                'message': 'Заполните поле', 
                'action': 'keyup, blur', 
                'rule': 'required'
            });
        }
        if(info.maxLength)
            field_validators.push({
                'input': field[0], 
                'message': `Поле должно содержать меньше ${info.maxLength} символов`, 
                'action': 'keyup, blur', 
                'rule': `maxLength=${info.maxLength}`
            });

        if(info.minLength)
            field_validators.push({
                'input': field[0], 
                'message': `Поле должно содержать минимум ${info.minLength} символов`, 
                'action': 'keyup, blur', 
                'rule': `minLength=${info.minLength}`
            });
        return field_validators;
    }

    createCustomValidators(){}


    /**
     * 
     * @param {Array} template 
     * @returns 
     */
    iniTemplate(template){
        for(var i in template){
            if(template[i].columns){
                template[i].columns = this.iniTemplate(template[i].columns);
                continue;
            }
            template[i] = this.iniTemplateItem(template[i]);
        }
        return template;
    }

    iniTemplateItem(item){
        if(!item.name) item.name = item.bind;
        if(IGNORED_TYPES.indexOf(item.type)===-1)
            this.__fields_info.push(item);
        return item;
    }

    set template(template){
        if(this.target.data('masterWidget'))
            throw new Error('Form is initialized');
        
        this.__fields_info = [];
        this.__template = this.iniTemplate(template);
    }

    /**
     * @returns {Array}
     */
    get template(){
        return this.__template || null;
    }
}

class MasterModelForm extends MasterForm{
    static detectStringType(fieldInfo) {
        if (fieldInfo.write_only) return 'password';
        if (fieldInfo.format === 'email') return 'email';
        if (fieldInfo.format === 'url') return 'url';
        return 'text';
    }

    static getTemplateItem(name, opts){
        var element = {
            labelWidth: '80px',
            width: '250px',
            ...Object.assign({},opts),
            'bind': name,
            'name': name
        };

        switch (element.type) {
            case 'string':
                element.type = MasterModelForm.detectStringType(element);
                break;
            case 'integer':
            case 'decimal':
                element.type = 'number';
                break;
            case 'boolean':
                element.type = 'checkbox';
                break;
            case 'choice':
                element.type = 'dropdown';
                element.options = element.choices?.map(c => ({
                    value: c.value,
                    label: c.display_name
                })) || [];
                delete element.choices;
                break;
            case 'date':
                element.formatString = 'dd.MM.yyyy';
                break;
            case 'datetime':
                element.formatString = 'dd.MM.yyyy HH:mm:ss';
                break;
            case 'time':
                element.formatString = 'HH:mm:ss';
                break;
            case 'field':
                break;
            default:
                element.type = 'text';
                break;
        }
        return element;
    }

    init(attrs={}){
        defaults(attrs, {'template': []});
        new MasterModelLoader(this);
        super.init(attrs);
    }

    load(){
        var template = this.getModelTemplate(this.model.getModelOptions());
        this.__template = this.iniTemplate(template).concat(this.__template);
    }

    getModelTemplate(options){
        var template = [];
        for(var i in options){
            if(i !== this.model.id)
                template.push(MasterModelForm.getTemplateItem(i, options[i]));
        }
        return template;
    }

    render(){
        super.render();
        if(this.id)  this.id = this.id;
    }

    initField(field, info){
        super.initField(field, info);
        if(info.type === 'field' && this.model.getRelation(info.bind)){
            var opts = copyKeys(info, FIELD_PROPS.list);
            opts.model = this.model.getRelation(info.bind).related_object.toLowerCase();
            opts.type = 'dropdown';
            new MasterListInput(field, opts);
        }
    }

    set id(id){
        this.__id = id;
        if(!this.target.data('masterWidget'))
            return;
        this.loader(this.model.retrieve(id)).then(value => {
            console.log(value);
            this.jqx_target.val(value);
        });
    }

    get id(){
        return this.__id || null;
    }
};