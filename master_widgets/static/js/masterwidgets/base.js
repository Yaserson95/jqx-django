'use strict';
const STR_TEMPLATE_REGEX = /\{\{\s*(?<val>\w+)\s*\}\}/
const MASTER_JS_URL = "/static/js/masterwidgets/";
const JQX_JS_URL = "/static/js/jqx/";

class MasterUse{
	__pathes = {};
	load_proc = null;
	constructor(base_path){
		this.addPath('base', base_path);
	}

	static prepareJS(url){
		var scriptTag = document.createElement('script');
		var prm = new Promise((resolve, reject)=>{
			function implementationCode(result){
				resolve(result);
			}
			scriptTag.src = url;
		
			scriptTag.onload = implementationCode;
			scriptTag.onreadystatechange = implementationCode;
			scriptTag.onerror = (err)=>{
				reject(err);
			}
		});

		return [scriptTag, prm];
	};

	static createPath(path){
		return {
			'path': path,
			'new_modules': [],
			'modules': {},
			'add': function(name){
				if(Array.isArray(name)){
					var n = [];
					for(var i in name){
						n.push(this.add(name[i]));
					}
					return n;
				}
				if(this.modules[name] === undefined){
					var scriptName = `${this.path}${name}.js`;
					var tag_opts = MasterUse.prepareJS(scriptName);
					this.modules[name] = {'tag': tag_opts[0], 'promise': tag_opts[1]};
					this.new_modules.push(name);
				}
				return {...this.modules[name], 'name':name};
			},
			'getPromises': function(){
				var promises = [];
				for(var i in this.modules){
					promises.push(this.modules[i].promise);
				}
				return promises;
			},
			'start': async function(name, location){
				if(!(this.modules[name].loaded || this.modules[name].in_process)){
					this.modules[name].in_process = true;
					location.appendChild(this.modules[name].tag);
				}
				await this.modules[name].promise;
				this.modules[name].loaded = true;
				this.modules[name].in_process = false;
			},
			'loadAll': async function(location){
				var mod_names = this.new_modules;
				this.new_modules = [];
				for(var i in mod_names){
					await this.start(mod_names[i], location);
				}
				if(!this.loaded()){
					await this.loadAll(location);
				}
			},
			'load': function(name, location){
				this.add(name);
				return this.start(name, location);
			},
			'loaded': function(){
				return this.new_modules.length === 0;
			}
		};
	}

	static getPath(system_path){
		var pos = system_path.indexOf('.');
		if(pos === -1)
			return ['base', system_path];
		else
			return [system_path.substring(0, pos), system_path.substring(pos+1)];
	}

	loadAll(){
		if(this.load_proc !== null)
			return this.load_proc;

		this.load_proc = new Promise(async(resolve)=>{
			for(var i in this.__pathes){
				var path = this.__pathes[i];
				await path.loadAll(document.head);
			}
			resolve();
		});
		return this.load_proc;
	}

	load(system_path){
		var module, pathname;
		[pathname, module] = MasterUse.getPath(system_path);
		this.add(system_path);

		return this.__pathes[pathname].load(module, document.head);
	}

	addPath(name, path){
		this.__pathes[name] = MasterUse.createPath(path);
		return this;
	}

	add(system_path){
		if(Array.isArray(system_path)){
			for(var i in system_path) 
				this.add(system_path[i]);
			return this;
		}
		var module, pathname;
		[pathname, module] = MasterUse.getPath(system_path);

		//console.log(pathname, module);
		this.getPath(pathname).add(module);
		return this;
	}
	getPath(name){
		if(!this.__pathes[name])
			throw new Error(`Path '${pathname}' is not defined`);

		return this.__pathes[name];
	}
	getModule(system_path){
		var module, pathname;
		[pathname, module] = MasterUse.getPath(system_path);
		return this.getPath(pathname).add(module);
	}
}

/**
 * Base widget class providing common functionality for UI components
 */
class MasterWidget{
	/** @static @type {string} Base path for theme stylesheets */
	static themes_base = '/static/css/jqx/';
	/**
     * Retrieves list of loaded theme stylesheets from the document head
     * @static
     * @returns {string[]} Array of loaded theme names
     */
	static getLoadedStyles(){
		var styles = [];
		$(document.head).find('link[rel="stylesheet"]').each(function(i,e){
			var href = $(e).attr('href');
			if(href.startsWith(MasterWidget.themes_base))
				styles.push(href.substring(MasterWidget.themes_base.length));
		});
		return styles;
	}

	static register(cls){
		if(Array.isArray(cls)){
			for(var i in cls)
				MasterWidget.register(cls[i]);
			return;
		}
		var cls_name = cls.name.startsWith('Master')? cls.name.substring(6): cls.name
		$.masterWidget[cls_name] = cls;
	}
	/**
     * Loads specified theme stylesheet if not already loaded
     * @static
     * @param {string} theme - Theme name to load
     * @returns {jQuery|undefined} Link element for loaded theme or undefined if already present
     */
	static openTheme(theme){
		var themes = this.getLoadedStyles();
		if(themes.indexOf(theme) !== -1)
			return;

		var theme_path = `${this.themes_base}jqx.${theme}.css`;
		var style = $('<link/>', {'rel': 'stylesheet', 'href': theme_path});
		$(document.head).append(style);
		return style;
	}
	/**
     * Sets current theme for all widgets
     * @static
     * @param {string} theme - Theme name to set
     */
	static set theme(theme){
		this.openTheme(theme);
		this.__theme = theme;
	}
	/**
     * Gets currently active theme
     * @static
     * @returns {string} Current theme name
     */
	static get theme(){
		return this.__theme || 'base';
	}

	static addStyleClasses(target, obj){
		if(!obj instanceof this)
			return;
		var prot = obj.constructor;
		while(prot){
			if(prot.name) target.addClass(camelToKebab(prot.name));
			if(prot === this) break;
			prot = Object.getPrototypeOf(prot);
		}
	}

	static autoID(widget){
		if(!widget.target.attr('id'))
			widget.target.attr('id', widget.constructor.name + make_str())
		return widget.target.attr('id');
	}
	
	/**
     * Initializes widget instance
     * @param {jQuery} target - Container element for the widget
     * @param {object} options - Configuration options
     */
	constructor(target, options){
		this.target = this.initTarget($(target));
		this.init(options);
			if(this.autorender)	this.render();
	}

	/**
     * Defines option validation patterns including base patterns
     * @param {Object} [patterns={}] - Additional patterns to merge
     * @returns {Object} Merged option patterns
     */
	widgetOptionsPatterns(patterns = {}){
		return {
			'parent':{'type': MasterWidget, 'required': false},
			'autorender':{'type': 'boolean', 'default': true},
			'width': {'type': ['string', 'number'], 'default': '100%'},
			'height': {'type': ['string', 'number'], 'default': '400px'},
			'theme': {'type': 'string', 'default': MasterWidget.theme},
			...patterns
		};
	}
	/**
     * Initializes widget with provided options
     * @param {Object} [options={}] - Configuration options
     * @throws {Error} When option validation fails
     */
	init(options = {}){
		this.attrs = {};

		try{
			apply_options(this, check_options(options, this.widgetOptionsPatterns()));
		}catch(e){
			e.message = this.constructor.name + ': ' + e.message;
			throw e;
		}

		//Size polisy
		this.target.css({
			'width': this.width,
			'height': this.height,
		});

		this.__loader = null;
		this.attrs = {...this.attrs, ...options};

		if(this.theme !== 'base'){
			this.target.addClass(this.theme);
		}
	}

	/**
     * Prepares target element for widget initialization
     * @param {jQuery} target - Container element
     * @param {boolean} [create_jqx=true] - Whether to create JQX container
     * @returns {jQuery} Prepared target element
     * @throws {Error} If target element is invalid
     */
	initTarget(target, create_jqx = true){
		if(target.length === 0)
			throw new Error('Target element is not correct');

		//MasterWidget styles
		MasterWidget.addStyleClasses(target, this);
		//target.addClass('master-widget ' + camelToKebab(this.constructor.name));
		//if this.theme
		if(create_jqx && !this.__jqx_widget)
			this.__jqx_widget = this.initJQXTarget(target);
		return target;
	}

	/**
	 * Creates JQX-specific container element
	 * @param {jQuery} target - Parent element
	 * @returns {jQuery} Created JQX container
	 */
	initJQXTarget(target){
		return $('<div/>', {'class':'master-jqx-widget'}).appendTo(target);
	}

	/**
     * Renders widget and applies theme settings
     */
	render(){
		MasterWidget.autoID(this);
		this.jqx(this.getWidgetOptions());
		this.target.data('masterWidget', this);
		this.trigger('ready');
	}
	getWidgetOptions(){
		return {
			...this.attrs,
			'width': this.jqx_width,
			'height': this.jqx_height,
			'theme': this.theme
		}
	}
	/**
     * Proxy method for JQX widget operations
     * @param {...any} args - Arguments to pass to JQX widget
     * @returns {any|undefined} Result of JQX operation or undefined
     */
	jqx(...args){
		if(typeof this.jqx_type !== 'string')
			return;
		if($.fn[this.jqx_type] === undefined)
			throw new Error(`Element ${this.jqx_type} is not defined`);
		return this.jqx_target[this.jqx_type](...args);
	}
	/**
     * Gets widget's target element ID
     * @returns {string|undefined} Element ID or undefined
     */
	id(){
		return this.target.attr('id');
	}
	/**
	 * Triggers event on target element
	 * @param {...any} args - Event arguments
	 * @returns {MasterWidget} Instance for chaining
	 */
	trigger(...args){
		this.target.trigger(...args);
		return this;
	}
	/**
	 * Attaches event handler to target
	 * @param {...any} args - Event parameters
	 * @returns {MasterWidget} Instance for chaining
	 */
	on(...args){
		this.target.on(...args);
		return this;
	}
	/**
     * Manages loading indicator display
     * @param {boolean} [show=true] - Whether to show loader
     * @returns {MasterWidget} Instance for chaining
     */
	showLoader(show = true){
		if(show){
			if(!this.__loader)
				this.__loader = $('<div class="master-widget-loader"><div class="loader"></div></div>')
					.appendTo(this.target);
			this.__loader.show();
		}else{
			if(this.__loader){
				this.__loader.remove();
				this.__loader = null;
			}
		}
		return this;
	}
	/**
     * Wraps promise with loading indicator
     * @param {Promise} prm - Promise to track
     * @returns {Promise} Original promise with loader handling
     */
	loader(prm){
		this.showLoader();
		prm.finally(()=>{
			this.showLoader(false);
		});
		return prm;
	}

	/**
	 * Set visibility for widget
	 * @type {boolean}
	 */
	set hidden(hidden){
		//To bool
		hidden = hidden === true;

		//Hide or show widget
		if(hidden) this.target.hide();
		else this.target.show();

		this.__hidden = hidden;
	}

	/**
	 * Gets widget's visibility state
	 * @type {boolean}
	 */
	get hidden(){
		return this.__hidden;
	}

	/**
     * Gets current widget theme
     * @type {string}
     */
	get theme(){
		return this.__theme;
	}
	/**
     * Updates widget theme and refreshes display
     * @type {string}
     */
	set theme(theme){
		MasterWidget.openTheme(theme);
		this.__theme = theme;

		if(!this.__jqx_widget)
			this.target.addClass('jqx-content-' + theme);

		if(this.target.data('masterWidget'))
			this.jqx({'theme': theme });
	}
	 /**
     * Gets JQX-specific target element
     * @type {jQuery}
     */
	get jqx_target(){
		return this.__jqx_widget || this.target;
	}

	get jqx_width(){
		return (this.__jqx_widget!==undefined)? '100%': this.width;
	}

	get jqx_height(){
		return (this.__jqx_widget!==undefined)? '100%': this.height;
	}

	set width(width){
		this.target.css('width', width);
	}
	
	get width(){
		return this.__width;
	}

	set height(height){
		this.target.css('height', height);
	}

	get height(){
		return this.__height;
	}
};


class MasterLoadedWidget extends MasterWidget{
	widgetOptionsPatterns(){
		return super.widgetOptionsPatterns({
			'url': {'type': 'string'},
			'request': {'type': 'object', 'default':{'method': 'GET'}},
			'widgetClass': {'type': 'function', 'name':'widget_class'},
			'config': {'type': 'object', 'default': {}}
		});
	}

	initTarget(target, jqx=false){
		return super.initTarget(target, false);
	}

	init(opts){
		this.in_process = false;
		this.has_errors = false;
		this.is_load = false;
		super.init(opts);
	}

	render(){
		this.load().then((data)=>{
			this.is_load = true;
			this.widget = this.afterLoading(data);
		})
		.catch((e)=>{
			this.has_errors = true;
			console.error(e);
		})
		.finally(()=>{
			this.in_process = false;
		});
	}

	load(){
		if(this.is_load) return;
		this.in_process = true;
		const prm = new Promise((resolve, reject)=>{
			const requestOpts = {
				...this.request,
				'success':(data)=>{resolve(data)},
				'error':(e)=>{reject(e)}
			}
			$.ajax(this.url, requestOpts);
		});
		return this.loader(prm);
	}

	afterLoading(config){
		this.config.parent = this.parent;
		return new this.widget_class(this.target, {...config, ...this.config});
	}
}

//Mixins

class MasterModelLoader{
	constructor(widget){
		this.widget = widget;
		widget.widgetOptionsPatterns = this.patterns(widget.widgetOptionsPatterns);
		widget.render = this.render(widget.render);
	}

	/**
     * Merges model-related option patterns
     * @override
     * @returns {Object} Extended option patterns
     */
	patterns(original){
		return (patterns = {})=>{
			return original.apply(this.widget, [{
				...patterns,
				'model': {'type': ['string', $.masterModel]},
			}]);
		};
	}

	render(original){
		return ()=>{
			var model = this.widget.model;
			if(!$.masterModel)
				throw new Error('Module "models.js" is not defined');

			if(typeof model === 'string'){
				this.widget.model = $.masterModel.get(this.widget.model);
				if(!this.widget.model)
					throw new Error(`Model "${model}" is not defined`);
			}

			this.widget.loader(this.widget.model.initModelOptions()).then(()=>{
				if(typeof this.widget.load === 'function')
					this.widget.load();
				this.widget.trigger('load');
				original.apply(this.widget, []);
			});
		}
	}

	/**
     * Retrieves associated model instance
     * @returns {MasterModel} Model instance
     * @throws {Error} If model not found
     */
	getModel(){
		if(this.model instanceof $.masterModel)
			return this.model;

		var model = $.masterModel.get(this.model);
		if(model === null)
			throw new Error(`Model '${this.model}' is not defined`);

		this.model = model;
		return model;
	}
}


(jQuery)(function($){
	var val_func = $.fn.val;
	var config = {
		set theme(theme){
			MasterWidget.theme = theme;
		},
		get theme(){
			return MasterWidget.theme;
		},
		'models_url': '/modules/',
		'models': {},
		'jqx_theme_path':'/static/css/jqx/',
	};
	var modules = new MasterUse(MASTER_JS_URL);
	modules.addPath('jqx', JQX_JS_URL);

	/**
	 * 
	 * @param {string} class_path 
	 */
	function widgetModule(class_path){
		var pos = class_path.lastIndexOf('.');
		if(pos === -1)
			return [null, class_path];
		return [class_path.substring(0, pos), class_path.substring(pos+1)];
	}

	function getClassByName(name){
		var cls = $.masterWidget[name];
		if(cls === undefined)
			throw new Error(`Widget '${name}' is not defined`);
		return cls;
	}

	function getWidgetByName(name, target, attrs){
		var cls = getClassByName(name);

		if(target === undefined) return cls;
		return new cls(target, attrs);
	}

	$.extend({
		'use': function(...patches){
			modules.add(patches);
			return this;
		},
		'extendWidget': function(class_path, callback){
			var module_name, class_name, module;
			[module_name, class_name] = widgetModule(class_path);
			
			if(module_name === null) module_name = 'base';
			module = modules.getModule(module_name);
			module.promise.then(()=>{
				MasterWidget.register(callback(getClassByName(class_name)));
			});
			return module.promise;
		},
		'loadModules':function(){
			return modules.loadAll();
		},
		'include':function(module_path){
			return modules.load(module_path);
		},
		'masterWidget':async function(name, target, attrs={}){
			var module_path, class_name;
			if(name === undefined) 
				return MasterWidget;

			[module_path, class_name] = widgetModule(name);
			this.use(module_path);
			await modules.loadAll();			
			return getWidgetByName(class_name, target, attrs);
		}
	});

	$.masterWidget.config = function(conf){
		for(var i in conf){
			config[i] = conf[i];
		}
	}
	$.masterWidget.option = function(name, val){
		if(val!==undefined){
			config[name] = val;
			return;
		}
		return config[name] !== undefined? config[name]: null;
	}

	$.fn.extend({
		'sval': val_func,
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
		},
		'val': function(...args){
			var widget = this.data('masterWidget');
			if(!widget)
				return val_func.apply(this, args);
			
			if(args.length > 0)
				widget.value = args[0];
			else return widget.value;
		},
		'masterWidget': function(name, attrs={}){
			return $.masterWidget(name, this, attrs);
		}
	});

	$.use('utils');
});