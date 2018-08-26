(function () {
    var typeName = "wm.WarehouseDocsAccSettingsControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var WarehouseDocsAccSettingsControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return wm.WarehouseDocsAccSettingsControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "wm.WarehouseDocsAccSettings";
            afw.DataListControl.fn.init.call(that, options);
        },

        _CreateToolbar: function () {
            var that = this;
            afw.DataListControl.fn._CreateToolbar.call(that);

            that.Toolbar.AddButton("CopySetting", "کپی تنظیمات", { Image: "resource(cmn.Copy)" });
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (buttonKey == "CopySetting") {
                that._CopySetting();
            }
            else
                afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _CopySetting: function () {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            if (selectedEntities.length == 0) {
                afw.ErrorDialog.Show("یکی از تنظیمات را برای کپی انتخاب نمایید.");
                return;
            }

            var copyForm = afw.uiApi.OpenSavedFormWindow("wm.WarehouseDocsAccSettingCopyAdditionalInfoForm", {
                Name: "WarehouseDocsAccSettingCopyAdditionalInfoForm",
                Modal: true,
                Title: "ایجاد کپی از تنظیمات حسابداری",
                RefSettingDataItem: selectedEntities[0].DataItem
            });

            copyForm.Center();
            copyForm.BindEvent("Close", function (e) { that._LoadData();});
        },

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _OnDataLoaded: function () {
            var that = this;

            afw.DataListControl.fn._OnDataLoaded.call(that);
        },
        
        _ShowEntityWindow: function (entity, formMode, options) {
            var that = this;

            return afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode, options);
        },

        _OnEntityWindowOpened: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowOpened.call(that, entityWindow);
        },

        _OnEntityWindowClosed: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowClosed.call(that, entityWindow);
        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        }
    });

    //Static Members:

    WarehouseDocsAccSettingsControl.TypeName = typeName;
    WarehouseDocsAccSettingsControl.BaseType = baseType;
    WarehouseDocsAccSettingsControl.Events = objectEvents;


    wm.WarehouseDocsAccSettingsControl = WarehouseDocsAccSettingsControl;
})();

