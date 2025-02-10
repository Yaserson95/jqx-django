(jQuery)(function($){
	$(document).ready(function(){
		new MasterModelGrid($("#products-grid"), {
			'sortmode': "many",
			'width': '100%',
			'height': 450,
			'filterable': true,
			'sortable': true,
			'source': '/products/grid/',
			'virtualmode': true,
			'columnsresize': true,
			'columnsautoresize': true,
			'rowMenu':true,
		});
	});
});