TOOL_PATTERNS = {
    'icon': {'type': 'string', 'required': false}, 
    'type': {'type': 'string', 'default': 'button'}, 
    'separator': {'type': 'boolean', 'default': true}, 
    'label': {'type': 'string', 'default': ''},
    'name': {'type': 'string'}
};

class MasterToolbar extends MasterWidget{
    widgetOptionsPatterns(patterns={}){
		return super.widgetOptionsPatterns({...patterns,...{
			'buttons': {'type': 'array'},
        }});
	}
    init(attrs){
        this.tools = {};
        this.jqx_type = 'jqxToolBar';
        super.init(defaults(attrs, {'height': 'auto'}));
    }

    initTarget(target, create_jqx=false){
        return super.initTarget(target, create_jqx);
    }

    render(){
        this.target.addClass('master-toolbar');
        this.attrs.tools = MasterToolbar.getTemplate(this.buttons);
        this.attrs.initTools = (...args) => {
            return this.renderTool(...args);
        };
        
        super.render();

        //Update tools
        var tools = this.jqx('getTools');
        var margin = this.target.css('padding-bottom');
        for(var i = 0; i < tools.length; i++){
            $(tools[i].tool).css('margin-bottom', margin);
        }
    }

    renderTool(type, index, tool, menuToolIninitialization){
        var options = Object.assign({}, this.buttons[index]);
        var item = check_options(options, TOOL_PATTERNS);
        tool.addClass('tool');

        switch(type){
            case 'button':
                MasterToolbar.initButton(tool, item).jqxButton(options);
                break;
            case 'toggleButton':
                MasterToolbar.initButton(tool, item).jqxToggleButton(options);
                break;
            case 'dropdownlist':
                tool.jqxDropDownList(options);
                break;
            case 'combobox':
                tool.jqxComboBox(options);
                break;
            case 'input':
                MasterToolbar.initInput(tool, options);
                break;
        }

        tool.attr('title', item.label || '');

        if(!menuToolIninitialization){
            if(this.tools[item.name] !== undefined)
                throw new Error(`Tool "${item.name}" is exists`);
            item.tool = tool[0];
            this.tools[item.name] = item;
        }
        return tool;
    }

    getTool(name){
        if(typeof this.tools[name] === undefined)
            return null;

        return this.tools[name].tool;
    }

    getToolNames(){
        return Object.keys(this.tools);
    }

    static getTemplate(buttons){
        var template = '';
        for(var i in buttons){
            var type = buttons[i].type || 'button';
            var separator = buttons[i].separator === undefined? true: buttons[i].separator;
            if(template !== '')
                template += separator? ' | ': ' ';
            template += type;
        }
        return template;
    }

    static initButton(tool, item){
        if(item.icon !== null){
            tool.append(faicon(item.icon));
        }else{
            tool.text(item.label || '');
        }
        tool.attr('type', 'action');
        return tool;
    }

    static initInput(input, options){
        input.jqxInput(options);
        input.css('margin-right', '6px');
        return input;
    }
};