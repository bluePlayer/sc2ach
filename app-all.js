/*
Copyright(c) 2012 Company Name
*/



var hostName = window.location.host;
var achievementsData = {};
var categories = {};
var categoriesArray = [];
var pointsArray = [];
var gridData = [];

var regionStore = Ext.create('Ext.data.Store', {
    fields: ['region', 'name'],
    data : [
        {"region":"us.battle.net", "name":"US"},
        {"region":"eu.battle.net", "name":"Europe"},
        {"region":"kr.battle.net", "name":"Korea"},
        {"region":"tw.battle.net", "name":"Taiwan"},
		{"region":"www.battlenet.com.cn", "name":"China"},
		{"region":"sea.battle.net", "name":"South East Asia"}
    ]
});

var localeStore = Ext.create('Ext.data.Store', {
    fields: ['locale', 'name']
});

var pointsStore = Ext.create('Ext.data.Store', {
    fields: ['points'],
	data:[{points: 0},{points: 10},{points: 15},{points: 20}]
});

var categoriesStore = Ext.create('Ext.data.Store', {
    fields: ['categoryId', 'title'],
	autoLoad:true
});

var achievementsModel = Ext.define('AchievementsModel', {
     extend: 'Ext.data.Model',
     fields: [
			{name: 'title', type: 'string'},
			{name: 'description', type: 'string'},
			{name: 'achievementId', type: 'int'},
			{name: 'categoryTitle', type: 'string'},
			{name: 'points', type: 'int'},
			{name: 'icon', type: 'auto'}
		]
 });

var achievementsStore = Ext.create('Ext.data.Store', {
	model: 'AchievementsModel',
	proxy: {
        type: 'memory',
        reader: {
            type: 'json'
        }
    }
});

function filterAchievements() {
    var categoriesCombo = Ext.getCmp('categoriesCombo');
    var pointsCombo = Ext.getCmp('pointsCombo');
    var keywordTitleTF = Ext.getCmp('keywordTextTitle');
    var keywordDescriptionTF = Ext.getCmp('keywordTextDescription');

    achievementsStore.clearFilter(true);

    if (categoriesCombo.disabled == false && categoriesCombo.getValue() != null) {
        achievementsStore.filter('categoryTitle', categories[categoriesCombo.getValue()]);
    }

    if (pointsCombo.disabled == false && pointsCombo.getValue() != null) {
        achievementsStore.filter('points', pointsCombo.getValue());
    }

    if (keywordTitleTF.disabled == false && keywordTitleTF.getValue() != null && keywordTitleTF.getValue() != '') {
        achievementsStore.filter([{
            filterFn: function (item) {
                if (item.get("title").indexOf(keywordTitleTF.getValue()) != -1) {
                    return item;
                }
            }
        }]);
    }

    if (keywordDescriptionTF.disabled == false && keywordDescriptionTF.getValue() != null && keywordDescriptionTF.getValue() != '') {
        achievementsStore.filter([{
            filterFn: function (item) {
                if (item.get("description").indexOf(keywordDescriptionTF.getValue()) != -1) {
                    return item;
                }
            }
        }]);
    }

    if (!achievementsStore.isFiltered()) {
        achievementsStore.loadData(gridData);
    }

    Ext.getCmp('numOfEntries').setText('Number of entries: ' + achievementsStore.count());
}

// sc2 achievements application
var sc2achApp = Ext.application({
    name: 'SC2 Achievements',
	appFolder: 'app',
    launch: function() {
        Ext.create('Ext.container.Viewport', {
            layout: 'column',
            items: [
				{
					xtype:'panel',
					layout:{
						type:'vbox',
						align:'left'
					},
					columnWidth:0.205,
					height:600,
					items:[{
						xtype: 'form',
						id: 'filterForm',
						title: 'Load Achievements',
						bodyPadding: 10,
						margin: '0 0 10 0',
						width: 280,
						defaultType: 'combobox',
						flex:1,
						buttonAlign:'left',
						buttons:[{
							text: 'Load',
							formBind: true, 
							disabled: true,
							
							handler: function() {
								
								var form = this.up('form').getForm();
								if (form.isValid()) {
									form.submit({
										waitMsg: 'Loading...',
										method:'GET',
										url:'http://'+hostName+'/php-files/achievements.php',
										params:{
											region:'us.battle.net',
											locale:'en_US'
										},
										success: function(form, action) {
											achievementsData = {};
											categories = {};
											gridData = [];
											categoriesArray = [];
											achievementsData = action.result.data;

											Ext.each(achievementsData.categories, function(object, key){		
												if(object.hasOwnProperty('children')){
													Ext.each(object.children, function(subobject, subkey){
														categories[subobject.categoryId] = subobject.title;
														categoriesArray.push({"categoryId":subobject.categoryId, "title":subobject.title});

													});
												}else{
													categories[object.categoryId] = object.title;
													categoriesArray.push({"categoryId":object.categoryId, "title": object.title});
												}	

											});
											
											categoriesStore.loadData(categoriesArray);

											Ext.each(achievementsData.achievements, function(object, key){
												var rowData = {};
												rowData['title'] = object['title'];
												rowData['description'] = object['description'];
												rowData['achievementId'] = object['achievementId'];
												rowData['categoryTitle'] = categories[object['categoryId']];
												rowData['points'] = object['points'];
												rowData['icon'] = object['icon'];
																						
												gridData[key] = rowData;
											});
											achievementsStore.clearFilter(true);
											achievementsStore.loadData(gridData);
											Ext.getCmp('numOfEntries').setText('Number of entries: '+achievementsStore.count());
										},
										failure: function(form, action) {
											if(action.failureType == Ext.form.Action.CLIENT_INVALID) {
												Ext.Msg.alert('Failure', 'Client invalid');
											}else if(action.failureType == Ext.form.Action.CONNECT_FAILURE){
												Ext.Msg.alert('Failure', 'Connect failure');
											}else if(action.failureType == Ext.form.Action.SERVER_INVALID){
												Ext.Msg.alert('Failure', 'Server invalid');
											}else{
												Ext.Msg.alert('Failure', action.result.msg);
											}
										}
									});
								}
							}
						}],
						items: [
							{
								forceSelection: true,
								editable: false,
								allowBlank: false,
								fieldLabel: 'Region',
								name: 'region',
								store: regionStore,
								queryMode: 'local',
								displayField: 'name',
								valueField: 'region',
								listeners:{
									'afterrender': function(comboboxObject){
										comboboxObject.setValue(comboboxObject.store.getAt(0).get('region') );
									},
									'select': function(comboboxObject){
										switch(comboboxObject.value){
											case "us.battle.net":
												localeStore.loadData([
													{"locale":"en_US", "name":"US"},
													{"locale":"es_MX", "name":"Mexico"},
													{"locale":"pt_BR", "name":"Brazil"}
												]);
											break;
											case "eu.battle.net":
												localeStore.loadData([
													{"locale":"en_GB", "name":"Great Britain"},
													{"locale":"es_ES", "name":"Spain"},
													{"locale":"fr_FR", "name":"France"},
													{"locale":"ru_RU", "name":"Russia"},
													{"locale":"de_DE", "name":"Germany"},
													{"locale":"pt_PT", "name":"Portugal"},
													{"locale":"pl_PL", "name":"Poland"},
													{"locale":"it_IT", "name":"Italy"}
												]);
											break;
											case "kr.battle.net":
												localeStore.loadData([
													{"locale":"ko_KR", "name":"Korea"}
												]);
											break;
											case "tw.battle.net":
												localeStore.loadData([
													{"locale":"zh_TW", "name":"Taiwan"}
												]);
											break;
											case "www.battlenet.com.cn":
												localeStore.loadData([
													{"locale":"zh_CN", "name":"China"}
												]);
											break;
											case "sea.battle.net":
												localeStore.loadData([
													{"locale":"en_US", "name":"US"}
												]);
											break;
											default:
												localeStore.loadData([
													{"locale":"en_US", "name":"US"},
													{"locale":"es_MX", "name":"Mexico"},
													{"locale":"pt_BR", "name":"Brazil"}
												]);
											break;
										}
										Ext.getCmp('localeCombo').setValue(localeStore.getAt(0).get('locale') );
									}
								}
							},
							{
								forceSelection: true,
								editable: false,
								allowBlank: false,
								fieldLabel: 'Language/Locale:',
								name: 'locale',
								store: localeStore,
								queryMode: 'local',
								displayField: 'name',
								valueField: 'locale',
								id:'localeCombo',
								listeners: {
									'afterrender': function(comboboxObject){
										localeStore.loadData([
											{"locale":"en_US", "name":"US"},
											{"locale":"es_MX", "name":"Mexico"},
											{"locale":"pt_BR", "name":"Brazil"}
										]);
										comboboxObject.setValue(comboboxObject.store.getAt(0).get('locale') );
									}
								}
							}
						]
					},{
						xtype:'panel',
						flex:2,
						title:'Filter Achievements',
						bodyPadding: 10,
						margin:'0 0 10 0',
						width: 280,
						buttonAlign:'left',
						buttons:[{
							text: 'Filter/Show All',
							disabled:true,
							id:'filterButton',
							handler: filterAchievements
						}],
						items:[{
							xtype:'combobox',
							forceSelection: true,
							editable: false,
							allowBlank: false,
							disabled:true,
							fieldLabel: 'Category:',
							name: 'title',
							store: categoriesStore,
							queryMode: 'local',
							displayField: 'title',
							valueField: 'categoryId',
							id:'categoriesCombo',
							listeners: {
								'select': filterAchievements
							}
						},{
							xtype:'combobox',
							forceSelection: true,
							editable: false,
							allowBlank: false,
							disabled:true,
							fieldLabel: 'Points:',
							name: 'points',
							store: pointsStore,
							queryMode: 'local',
							displayField: 'points',
							valueField: 'points',
							id:'pointsCombo',
							listeners: {
								'select': filterAchievements
							}
						},{
							xtype:'textfield',
							allowBlank: false,
							disabled:true,
							fieldLabel: 'Keyword - Title:',
							name: 'keywordT',
							id:'keywordTextTitle',
							listeners: {
								'change': filterAchievements
							}
						},{
							xtype:'textfield',
							allowBlank: false,
							disabled:true,
							fieldLabel: 'Keyword - Description:',
							name: 'keywordD',
							id:'keywordTextDescription',
							listeners: {
								'change': filterAchievements
							}
						},{
							xtype:'checkboxgroup',
							fieldLabel: 'Filter by',
							layout: {
								type: 'vbox',
								align: 'left'
							},
							flex:1,
							columns: 3,
							vertical: true,
							items:[{ 
									boxLabel: 'Category', name: 'filterRb', inputValue: '1',
									listeners: {
										'change': function(thisCheckbox, newValue, oldValue, eOpts ){
											var component = Ext.getCmp('categoriesCombo');
											var isDisabled = component.disabled;
											component.setDisabled((isDisabled ? false : true));	
											Ext.getCmp('filterButton').setDisabled(false);
										}
									}
								},{ 
									boxLabel: 'Points', name: 'filterRb', inputValue: '2',
									listeners: {
										'change': function(thisCheckbox, newValue, oldValue, eOpts ){
											var component = Ext.getCmp('pointsCombo');
											var isDisabled = component.disabled;
											component.setDisabled((isDisabled ? false : true));		
											Ext.getCmp('filterButton').setDisabled(false);
										}
									}
								},{ 
									boxLabel: 'Keyword - Title', name: 'filterRb', inputValue: '3',
									listeners: {
										'change': function(thisCheckbox, newValue, oldValue, eOpts ){
											var component = Ext.getCmp('keywordTextTitle');
											var isDisabled = component.disabled;
											component.setDisabled((isDisabled ? false : true));	
											Ext.getCmp('filterButton').setDisabled(false);
										}
									}
									
								},{ 
									boxLabel: 'Keyword - Description', name: 'filterRb', inputValue: '4',
									listeners: {
										'change': function(thisCheckbox, newValue, oldValue, eOpts ){
											var component = Ext.getCmp('keywordTextDescription');
											var isDisabled = component.disabled;
											component.setDisabled((isDisabled ? false : true));	
											Ext.getCmp('filterButton').setDisabled(false);
										}
									}
							}]
						}]
					},{
						xtype:'panel',
						flex: 1,
						width: 280,
						bodyPadding: 10,
						layout:'column',
						items:[{
							xtype:'label',
							text: 'Number of entries: 0',
							id:'numOfEntries',
							margin:'0 0 40 0'
						},{
							xtype:'label',
							html: 'All information and resources/images belong to Blizzard &copy; Entertainment',
							margin:'0 0 10 0',
							id:'copyright'
						},{
							xtype:'label',
							html: 'Developed by Vladimir Z aka VladDTerran &copy; March 2014',
							id:'development'
						}]
					}]
				},
				{
					xtype:'grid',
					title: 'Achievements',
					store: achievementsStore,
					forceFit:true,
					id:'achievementsGrid',
					columns: [
						{ text: 'Title', dataIndex: 'title', flex: 2, align:'center'},
						{ text: 'Description', dataIndex: 'description', flex: 4, align:'center'},
						{ text: 'Achievement ID', dataIndex: 'achievementId', flex: 2, align:'center'},
						{ text: 'Category Title', dataIndex: 'categoryTitle', flex: 2, align:'center'},
						{ text: 'Points', dataIndex: 'points', flex:1, align:'center'},
						{ 
							text: 'Icon', 
							dataIndex: 'icon', 
							flex:1, 
							align:'center',
							renderer: function(value, metaData, record, rowIndex, colIndex, store){
								return "<div style=\"background-image: url("+value['url']+"); background-position: "+value['x']+"px "+value['y']+"px; width: 75px; height: 75px;\"></div>";
							}
						}
					],
					columnWidth:0.795,
					height: 600
				}
            ]
        });
		Ext.Msg.show({
		    title:'Welcome',
		    msg: 'This is Starcraft2 Achievements application. Use it to preview all SC2 achievements. Filter them by category, points and keyword.',
		    buttons: Ext.Msg.OK,
		    fn: function(){
				Ext.Msg.show({
				   title:'Welcome',
				   msg: 'Select region and locale and then press "Load" button to fetch all achievements. Use "Filter/Show All" button to filter or to reload the complete list.',
				   buttons: Ext.Msg.OK,
				});
		    }
		});
		
	}
});

