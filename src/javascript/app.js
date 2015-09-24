Ext.define("discussion-exporter", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    items: [
        {xtype:'container',itemId:'message_box',tpl:'Hello, <tpl>{_refObjectName}</tpl>'},
        {xtype:'container',itemId:'display_box', layout: {type: 'vbox'}}
    ],

    launch: function() {
        var store = Ext.create('Rally.data.wsapi.Store',{
            model: 'ConversationPost',
            fetch: ['Artifact','Text','User','FormattedID'],
            filters: [{
                property: 'Text',
                operator: 'contains',
                value: 'Rally Support Manager'
            }]
        });

        store.load({
            scope: this,
            callback: function(records, operation, success){
                this._displayGrid(store);
            }
        });
    },
    _export: function(){

        var file_util = Ext.create('Rally.technicalservices.FileUtilities',{});
        file_util.getCSVFromGrid(this, this.down('#discussion-grid')).then({
            success: function(csv){
                this.setLoading(false);
                file_util.saveCSVToFile(csv, 'export.csv');
            },
            scope: this
        });

    },
    _displayGrid: function(store){

        this.down('#display_box').add({
            xtype: 'rallybutton',
            text: 'Export',
            scope: this,
            handler: this._export
        });

        this.add({
            xtype: 'rallygrid',
            itemId: 'discussion-grid',
            store: store,
            showRowActionsColumn: false,
            enableBulkEdit: false,
            columnCfgs: [{
                dataIndex: 'Artifact',
                name: 'Artifact',
                renderer: function(v,m,r){
                    return v.FormattedID;
                }
            },{
                dataIndex: 'Text',
                text: 'Case Number',
                renderer: function(v,m,r){
                    var match = /Salesforce <b>Case:<\/b>([^,]+)/.exec(v);
                    if (match && match[1]){
                        return match[1];
                    }
                    return '';
                },
                exportRenderer: function(v,m,r){
                    var match = /Salesforce <b>Case:<\/b> <a href=["']https:\/\/na1.salesforce.com\/([a-zA-Z0-9]*)["']>([0-9]*)<\/a>/.exec(v);
                    if (match && match[2]){
                        return match[2];
                    }
                    return '';
                }
            },{
                dataIndex: 'Text',
                text: 'Account',
                renderer: function(v,m,r){
                    var match = /<b>Account:<\/b>([^,]+)/.exec(v);
                    if (match && match[1]){
                        return match[1];
                    }
                    return '';
                }
            }]
        });
    },
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },

    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },

    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },

    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        Ext.apply(this, settings);
        this.launch();
    }
});
