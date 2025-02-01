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
		if(config.pagesize){
			config.pageable = true;
            config.pagesizeoptions = [config.pagesize];
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