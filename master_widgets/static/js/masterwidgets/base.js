function pop_attr(obj, name, def=null){
	if(obj[name] !== undefined){
		var val = obj[name];
		delete(obj[name]);
		return val;
	}
	return def;
}

function check_option_type(option, type){
	//If option must be a many types
	if(Array.isArray(type)){
		for(var i in type) 
			check_option_type(option, type[i]);
	}

	//If option must be a array
	else if(type === 'array'){
		if(!Array.isArray(option)) 
			throw new Error(`Option type must be a "array"`);
		else return;
	}
	//If option must be a JS type
	else if(typeof type === 'string' && typeof option !== type)
		throw new Error(`Option type must be a "${type}"`);

	//If option must be a class object
	else if(typeof type === 'function' && !option instanceof type)
		throw new Error(`Option type must be a "${type.constructor.name}"`);
}

function check_option(option, pattern){
	
	var required = pattern.required!==undefined? pattern.required: true;

	//Default value
	if(option === null || option === undefined)
		option = pattern.default!==undefined? pattern.default: null;

	//Check is required
	if(option === null){
		if(required)
			throw new Error(`Option is required`);
		else return null;
	}

	//Check option type
	if(pattern.type !== undefined)
		check_option_type(option, pattern.type);

	return option;

}
function check_options(options, patterns){
	var new_options = {};
	for(var i in patterns){
		try{
			var name = (patterns[i].name !== undefined)? patterns[i].name: i;
			new_options[name] = check_option(pop_attr(options, i, null), patterns[i]);
		}catch(e){
			e.message = i + ' - ' + e.message.toLowerCase();
			throw e;
		}
	}
	return new_options;
}


/*function check_options(options, patterns){
	var new_options = {};
	for(var i in patterns){
		var def = patterns[i].default!==undefined? patterns[i].default: null;
		var required = patterns[i].required!==undefined? patterns[i].required: true;
		var option = pop_attr(options, i, def);
		if(option === null){
			if(required){
				throw new Error(`Option "${i}" is required`);
			}else{
				
				new_options[i] = option;
				continue;
			}
		}

		if(patterns[i].type !== undefined){
			if(typeof patterns[i].type === 'string'){
				switch(patterns[i].type){
					case 'array':
						if(!Array.isArray(option))
							throw new Error(`Option "${i}" type must be a "array"`);
						break;
					default:
						if(typeof option !== patterns[i].type)
							throw new Error(`Option "${i}" type must be a "${patterns[i].type}"`);
						break;
				}
			}else if(typeof patterns[i].type === 'function' && !option instanceof patterns[i].type){
				throw new Error(`Option "${i}" type must be a "${patterns[i].type.constructor.name}"`);
			}
		}
		if(patterns[i].name !== undefined)
			new_options[patterns[i].name] = option;
		else new_options[i] = option;
	}
	return new_options;
}*/

function apply_options(cls_object, obj){
	for(var i in obj)
		cls_object[i] = obj[i];
}

function set_default(obj, name, def=null){
	if(obj[name] === undefined)
		obj[name] = def;
}

/**
 * 
 * @param {object} obj 
 * @param {object} defaults 
 * @returns 
 */
function defaults(obj, defaults){
	for(var i in defaults){
		if(obj[i] === undefined)
			obj[i] = defaults[i];
	}
	return obj;
}

/**
 * 
 * @param {object} obj 
 * @param {Array} keys 
 */
function splitObject(obj, keys){
	var new_obj = {};
	for(var i in keys){
		if(obj[keys[i]] === undefined)
			continue;
		new_obj[keys[i]] = obj[keys[i]];
		delete(obj[keys[i]]);
	}
	return new_obj;
}


/**
 * Get Font Awesome icon element
 * @param {string} icon 
 * @returns {jQuery}
 */
function faicon(icon){
    return $('<i/>', {'class': `fa fa-${icon}`});
}

function getСookie(name){
	var keyvals = document.cookie.split('; ');
	var cookie = {};
	for(var i in keyvals){
		var k = keyvals[i].split('=');
		cookie[k[0]] = k[1];
	}
	if(name !== undefined)
		return cookie[name];
	return cookie;
}

class MasterWidget{
	static themes_base = '/static/css/jqx/';
	static getLoadedStyles(){
		var styles = [];
		$(document.head).find('link[rel="stylesheet"]').each(function(i,e){
			var href = $(e).attr('href');
			if(href.startsWith(MasterWidget.themes_base))
				styles.push(href.substring(MasterWidget.themes_base.length));
		});

		return styles;
	}

	static openTheme(theme){
		var themes = this.getLoadedStyles();
		if(themes.indexOf(theme) !== -1)
			return;

		var theme_path = `${this.themes_base}jqx.${theme}.css`;
		var style = $('<link/>', {'rel': 'stylesheet', 'href': theme_path});
		$(document.head).append(style);
		return style;
	}

	static set theme(theme){
		this.openTheme(theme);
		this.__theme = theme;
	}

	static get theme(){
		return this.__theme || 'base';
	}

	constructor(target, options){
		this.target = this.initTarget($(target));
		this.init(options);
		this.render();
	}
	widgetOptionsPatterns(patterns = {}){
		return {...patterns, ...{
			'parent':{'required': false, 'type': MasterWidget},
		}};
	}

	init(options = {}){
		try{
			apply_options(this, check_options(options, this.widgetOptionsPatterns()));
		}catch(e){
			e.message = this.constructor.name + ': ' + e.message;
			throw e;
		}
		this.attrs = options;
	}
	initTarget(target){
		return target;
	}

	render(){
		if(this.attrs.theme === undefined){
			if(this.parent !== null)
				this.attrs.theme = this.parent.theme;
			else this.attrs.theme = MasterWidget.theme;
		}

		this.jqx(this.attrs);
		this.target.data('masterWidget', this);
	}

	jqx(...args){
		if(typeof this.jqx_type !== 'string')
			return;
		return this.target[this.jqx_type](...args);
	}
	id(){
		return this.target.attr('id');
	}
	trigger(...args){
		return this.target.trigger(...args);
	}
	on(...args){
		return this.target.on(...args);
	}

	get theme(){
		return this.attrs.theme;
	}

	set theme(theme){
		this.openTheme(theme);
		this.attrs.theme = theme;
		if(this.target.data('masterWidget'))
			this.jqx({'theme': theme });
	}
};

class MasterLoadedWidget extends MasterWidget{
	widgetOptionsPatterns(){
		return super.widgetOptionsPatterns({
			'url': {'type': 'string'},
			'request': {'type': 'object', 'default':{'method': 'GET'}},
			'widgetClass': {'type': 'function', 'name':'widget_class'},
			'autoload': {'type': 'boolean', 'default': true},
			'config': {'type': 'object', 'default': {}}
		});
	}

	init(opts){
		this.in_process = false;
		this.has_errors = false;
		this.is_load = false;
		super.init(opts);
	}

	render(){		
		this.request.success = (data)=>{
			this.showSpinner(false);
			this.in_process = false;
			this.is_load = true;
			this.widget = this.afterLoading(data);
		}

		this.request.error = (err)=>{
			this.in_process = false;
			this.has_errors = true;
			console.error(err);
			this.showSpinner(false);
		}
		if(this.autoload) this.load();
		super.render();
	}

	load(){
		this.showSpinner(true);
		this.in_process = true;
		$.ajax(this.url, this.request);
	}

	afterLoading(config){
		this.config.parent = this.parent;
		return new this.widget_class(this.target, {...config, ...this.config});
	}
	showSpinner(show=true){}
}

(jQuery)(function($){
	$.fn.extend({
		'inParents': function(elem){
			var parents = $(elem).parents().toArray();
			var elements = $(this).toArray();

			parents.unshift($(elem)[0]);

			for(var i in parents){
				for(var j in elements){
					if(elements[j]===parents[i])
						return parents[i];
				}
			}
			return false;
		}
	});

	$.masterWidget = MasterWidget;
});