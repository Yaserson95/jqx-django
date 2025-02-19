(jQuery)(function($){
    $(document).ready(function (){
        new MasterModelTree('#org-structure', {
            'source': '/org/tree/',
            'width': '100%',
            'height': '400px',
            'ordering': 'item_type',
            'allowDrag': true,
            'allowDrop': true
        });
    });
});
/*
$(document).ready(function () {
    const treeSource = [];
    let currentParentId = '';
    let currentPage = 1;
    let totalPages = 1;

    const treeSelector = "#org-structure";

    const renderTree = function (data) {
        $(treeSelector).jqxTree({
            source: data,
            hasThreeStates: true,
            checkboxes: true,
            width: '300px',
            height: '500px',
            itemTemplate: function (item) {
                return `<span style="color:${item.item_type === 0 ? 'blue' : 'green'}">${item.label}</span>`;
            },
            initContent: function (element, content, data) {
                element.find('.jqx-icon').css({ backgroundImage: `url(${data.icon})` });
            },
            selectItem: function (event) {
                const args = event.args;
                const selectedItem = $(treeSelector).jqxTree('getItem', args.element);
                console.log(selectedItem);
            }
        });
    };

    const loadTree = async function (parentId=null, page=1) {
        var request_conf = {
            'url': '/org/tree/',
            'method': 'GET',
            'data': {'pagenum':page}
        }
        if(parentId)
            request_conf.data.parent = parentId;
        try {
            const data = await $.ajax(request_conf);
            if (!parentId) {
                treeSource.push(...data.results);
                totalPages = Math.ceil(data.count / data.page_size);
                renderTree(treeSource);
            } else {
                const parentNode = treeSource.find(node => node.value === parseInt(parentId));
                if (parentNode) {
                    parentNode.items = data.results.map(item => ({ ...item, icon: item.item_type === 0 ? 'folder.png' : 'person.png' }));
                    $(treeSelector).jqxTree('refresh');
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleScroll = async function () {
        const scrollTop = $(this).scrollTop();
        const scrollHeight = $(this)[0].scrollHeight;
        const clientHeight = $(this).innerHeight();
        const atBottom = scrollTop + clientHeight >= scrollHeight - 30;

        if (atBottom && currentPage < totalPages) {
            currentPage++;
            await loadTree(currentParentId, currentPage);
        }
    };

    $(treeSelector).on('scroll', handleScroll);

    loadTree(); // Загружаем корневые элементы

    $(treeSelector).on('expand', async function (event) {
        const args = event.args;
        const expandedItem = $(treeSelector).jqxTree('getItem', args.element);
        currentParentId = expandedItem.value;
        currentPage = 1;
        await loadTree(expandedItem.value, currentPage); // Загрузка дочерних элементов
    });
});

*/