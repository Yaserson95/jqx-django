class MasterGridHeaderMenu extends MasterContextMenu{
	itemClick(e){
		var data = e.args.data;
		switch(data.action){
			case 'show-column':
				this.parent.showColumn(data.value, data.checked);
		}
		return super.itemClick(e);
	}
};

class MasterGridRowMenu extends MasterContextMenu{
	open(e, row){
		this.row = row;
		console.log(row);
		super.open(e);
	}
};

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
		this.sorting = pop_attr(opts, 'sorting');
		this.header_menu = pop_attr(opts, 'headerMenu', false);
		this.row_menu = pop_attr(opts, 'rowMenu', false);
		this.header_menu_class = pop_attr(opts, 'headerMenuClass', MasterGridHeaderMenu);
		this.row_menu_class = pop_attr(opts, 'rowMenuClass', MasterGridRowMenu);
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
		if(config.pagesize){
			config.pageable = true;
            set_default(config, 'pagesizeoptions', [config.pagesize]);
        }

		return config;
	}
	__adapterOptions(config){
		var T = this;
		var adapter =  {
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

        if(config.pagesize){
            adapter.beforeprocessing = function (data) {
                adapter.totalrecords = data.count;
            }
        }
        return adapter;
	}
	render(){
		super.render();
		if(this.header_menu)
			this.renderHeaderMenu();

		if(this.row_menu)
			this.renderRowMenu();
	}
	renderHeaderMenu(){
		return new this.header_menu_class(this.target, {
			'elements': '.jqx-grid-header',
			'width': 220,
			'parent': this,
			'items':[
				{
					'label':'Показывать столбцы', 
					'items': this.attrs.columns.map((col, index) => {
						return {
							'label': col.text,
							'value': col.datafield,
							'type': 'checkbox',
							'checked': !col.hidden,
							'action':'show-column',
							'index': index
						}
					}),
				}
			],
		});
	}

	renderRowMenu(){
		var row_menu = new this.row_menu_class(this.target, {
			'elements': '.jqx-grid-content',
			'width': 220,
			'parent': this,
			'autoOpen': false,
			'items':[
				{'label': 'Создать', 'value':'create'},
				{'label': 'Изменить', 'value':'edit'},
				{'label': 'Удалить', 'value':'remove'},
			]
		});
		this.target.on('rowclick', (e) => {
			if(!e.args.rightclick)
				return;
			row_menu.open(e.args.originalEvent, e.args.row);
		});
		
		return row_menu;
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
	rowMenuOptions(){
		return {};
	}
	showColumn(index, show=true){
		var opt = show? 'showcolumn': 'hidecolumn';
		this.jqx(opt, index);
	}
};