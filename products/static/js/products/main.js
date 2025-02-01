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
				'columnsresize': true,
				'columnsautoresize': true,
			}
		});
	});
});