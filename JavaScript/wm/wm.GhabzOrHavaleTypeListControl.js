﻿(function () {
    var typeName = "wm.GhabzOrHavaleTypeListControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var GhabzOrHavaleTypeListControl = baseType.extend({
        events: events,

        GetType: function () {
            return wm.GhabzOrHavaleTypeListControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "wm.GhabzOrHavaleTypeList";
            afw.DataListControl.fn.init.call(that, options);
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (buttonKey == "Delete") {
                var selectedEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedEntities == 0) {
                    afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
                    return;
                }

                var isUserDefined = selectedEntities[0].DataItem["IsUserDefined"];
                if (isUserDefined == false) {
                    afw.ErrorDialog.Show("این رکورد قابل حذف کردن نمی باشد.");
                    return;
                }
            }

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _ShowEntityWindow: function (entity, formMode, options) {
            var that = this;

            return afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode, options);
        },

        _OnEntityWindowOpened: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowOpened.call(that, entityWindow);
        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        }
    });

    //Static Members:

    GhabzOrHavaleTypeListControl.TypeName = typeName;
    GhabzOrHavaleTypeListControl.BaseType = baseType;
    GhabzOrHavaleTypeListControl.Events = events;


    wm.GhabzOrHavaleTypeListControl = GhabzOrHavaleTypeListControl;
})();
