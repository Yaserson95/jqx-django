(jQuery)(function($){
	$("#products-grid").masterWidget('grid.RemoteGrid', {
		'sortmode': "many",
		'width': '100%',
		'height': 450,
		'filterable': true,
		'sortable': true,
		'source': '/products/grid/',
		'virtualmode': true,
		'columnsresize': true,
		'columnsautoresize': true,
		'rowMenu':true
	});
});