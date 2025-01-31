function pop_attr(obj, name, def=null){
	if(obj[name] !== undefined){
		var val = obj[name];
		delete(obj[name]);
		return val;
	}
	return def;
}

class MasterWidget{
	constructor(target, options){
		this.target = $(target);
		this.init(options);
		this.render();
	}

	init(options = {}){
		this.attrs = options;
	}

	render(){}

	jqx(...args){
		if(typeof this.jqx_type !== 'string')
			return;
		return this.target[this.jqx_type](...args);
	}
};

class MasterLoadedWidget extends MasterWidget{
	init(options){
		if(typeof options.url !== 'string')
			throw new Error('URL type is not correct');
		if(typeof options.widget !== 'function')
			throw new Error('Widget class type is not correct');
		super.init(options);
	}

	render(){
		var autoload = this.attrs.autoload || false;
		var request_opts = typeof this.attrs.request === 'object'?
			this.attrs.request: {'method': 'GET'};

		super.render();
		
		request_opts.success = (data)=>{
			this.showSpinner(false);
			this.widget = this.afterLoading(data);
		}

		request_opts.error = (err)=>{
			console.error(err);
			this.showSpinner(false);
		}

		this.attrs.request = request_opts;
		if(autoload)
			this.load();
	}

	load(){
		this.showSpinner(true);
		$.ajax(this.attrs.url, this.attrs.request);
	}

	afterLoading(config){
		if(typeof this.attrs.config === 'object')
			config = {...config, ...this.attrs.config};
		return new this.attrs.widget(this.target, config);
	}
	showSpinner(show=true){}
}

class MasterGrid extends MasterWidget{
	static get_sorting(sortinformation){
		var sorting = [];
		for(var i in sortinformation.sortcolumns){
			sorting.push([
				sortinformation.sortcolumns[i].dataField,
				sortinformation.sortcolumns[i].ascending? 1: 0,
			]);
		}
		return sorting;
	}

	init(opts={}){
		this.source = pop_attr(opts, 'source', '/');
		this.id = pop_attr(opts, 'id', 'id');
		this.root = pop_attr(opts, 'root', 'results');
		this.pagination = pop_attr(opts, 'pagination');
		this.sorting = pop_attr(opts, 'sorting');
		this.jqx_type = 'jqxGrid';
		super.init(this.__initGridOptions(opts));
	}

	__initDatafields(columns){
		return columns.map(col => ({
			name: col.dataField,
			type: col.dataType
		}));
	}
	__initColumns(columns){
		return columns.map(col => ({
			text: col.label,
			datafield: col.dataField,
			width: col.width || 150,
			filtertype: col.filter.type,
			columntype: col.columntype || 'textbox',
			cellsalign: col.dataType === 'number' ? 'right' : 'left',
			cellsformat: col.format || '',
			hidden: col.hidden || false
		}));
	}
	__initGridOptions(config){
		var T = this;
		if(config.virtualmode){
			config.rendergridrows = function(params){
				return T.rendergridrows(params, this);     
			}
		}
		config.source = new $.jqx.dataAdapter(this.__adapterOptions(config));
		config.columns = this.__initColumns(config.columns);
		if(config.pagesize)
			config.pageable = true;

		return config;
	}
	__adapterOptions(config){
		var T = this;
		return {
			datatype: "json",
			cache: false,
			datafields: this.__initDatafields(config.columns),
			url: this.source,
			id: this.id,
			root: this.root,
			formatData: function(data){
				return T.formatRequest(data, this);
			},
			sort: function(){
				T.onSort(this);
      		},
			filter: function () {
				T.onFilter(this);
			}
		};
	}

	render(){
		super.render();
		this.jqx(this.attrs);
	}
	rendergridrows(params, grid){
		return params.data;
	}

	formatRequest(data, adapter){
		var sorting = JSON.stringify(MasterGrid.get_sorting(this.jqx('getsortinformation')));
		var filtering = JSON.stringify(data.filterGroups.map(grp => ({
			field: grp.field,
			filters: grp.filters.map(flt => ({
				field: flt.field,
				value: flt.value,
				operator: flt.operator,
				condition: flt.condition
			}))
		})));

		//Удаление параметров сортировки и фильтрации
		for(var i in data){
			if(i.startsWith('sort') || i.startsWith('filter')){
				delete(data[i]);
			}
		}

		//Новые параметры сортировки и фильтрации
		data.sorting = sorting;
		data.filterGroups = filtering;
		return data;
	}
	onFilter(){
		this.jqx('updatebounddata', 'sort');
	}
	onSort(){
		this.jqx('updatebounddata', 'sort');
	}
}


(jQuery)(function($){
	$(document).ready(function(){
		new MasterLoadedWidget($("#products-grid"), {
			'url': '/products/grid/config/',
			'widget': MasterGrid,
			'autoload': true,
			'config':{
				'sortmode': "many",
				'width': '100%',
				'height': 450,
				'filterable': true,
				'sortable': true,
				'source': '/products/grid/',
				'virtualmode': true,
			}
		});
	});
});