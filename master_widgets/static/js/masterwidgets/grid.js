$.use('jqx.jqxgrid', 'jqx.jqxgrid.filter','jqx.jqxgrid.sort','jqx.jqxgrid.selection', 
	'jqx.jqxgrid.columnsresize', 'jqx.jqxgrid.pager', 'jqx.jqxscrollbar', 'jqx.jqxbuttons', 
	'jqx.jqxdropdownlist', 'jqx.jqxlistbox', 'jqx.jqxcheckbox', 'menu');

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

	static get HeadMenuClass(){
		return class extends MasterContextMenu{
			itemClick(e){
				var data = e.args.data;
				switch(data.action){
					case 'show-column':
						this.parent.showColumn(data.value, data.checked);
				}
				return super.itemClick(e);
			}
		};
	}

	static get RowMenuClass(){
		return class extends MasterContextMenu{
			open(e, row){
				this.row = row;
				console.log(row);
				super.open(e);
			}
		};
	}

	widgetOptionsPatterns(){
		return super.widgetOptionsPatterns({
			'source': {'type': 'string', 'default':'/'},
			'id': {'type': 'string', 'default':'id'},
			'root': {'type': 'string', 'default':'results'},
			'sorting': {'type': 'object', 'required': false},
			'headerMenu': {'type': 'boolean', 'default': false, 'name': 'header_menu'},
			'rowMenu': {'type': 'boolean', 'default': false, 'name': 'row_menu'},
			'headerMenuClass': {'type': 'function', 'default': MasterGrid.HeadMenuClass, 'name': 'header_menu_class'},
			'rowMenuClass': {'type': 'function', 'default': MasterGrid.RowMenuClass, 'name': 'row_menu_class'},
			'columns': {'type': 'array'},
		});
	}

	init(opts){
		this.jqx_type = 'jqxGrid';
		super.init(opts);
		this.__initGridOptions();
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
	__initGridOptions(){
		var T = this;
		if(this.attrs.virtualmode){
			this.attrs.rendergridrows = function(params){
				return T.rendergridrows(params, this);     
			}
		}
		this.attrs.source = new $.jqx.dataAdapter(this.__adapterOptions());
		this.attrs.columns = this.__initColumns(this.columns);
		if(this.attrs.pagesize){
			this.attrs.pageable = true;
            set_default(this.attrs, 'pagesizeoptions', [this.attrs.pagesize]);
        }
	}
	__adapterOptions(){
		var T = this;
		var adapter =  {
			datatype: "json",
			cache: false,
			datafields: this.__initDatafields(this.columns),
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

        if(this.attrs.pagesize){
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
			'height': 'auto',
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

class MasterRemoteGrid extends MasterLoadedWidget{
	init(options = {}){
		options.widgetClass = MasterGrid;
		options.url = options.source + 'config/';
		super.init(options);
		this.config = this.attrs;
	}
}

MasterWidget.register([MasterGrid, MasterRemoteGrid]);