(function () {
    var typeName = "rp.FinancialOpKindsControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var FinancialOpKindsControl = baseType.extend({
        events: events,

        GetType: function () {
            return rp.FinancialOpKindsControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "rp.FinancialOpKinds";
            afw.DataListControl.fn.init.call(that, options);
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            if (selectedEntities == 0) {
                afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
            }
            else {
                if (buttonKey == "Delete") {
                    var isUserDefined = selectedEntities[0].DataItem.IsUserDefined;
                    if (isUserDefined == false) {
                        afw.ErrorDialog.Show("امکان حذف این عملیات وجود ندارد.");
                        return;
                    }
                    else {
                        try {
                            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
                        } catch (e) {
                            afw.ErrorDialog.Show("dddddddddddd");
                        }
                    }
                }
                else
                    afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
            }
        },

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _ShowEntityWindow: function (entity, formMode) {
            var that = this;

            return afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode);
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

    FinancialOpKindsControl.TypeName = typeName;
    FinancialOpKindsControl.BaseType = baseType;
    FinancialOpKindsControl.Events = events;


    rp.FinancialOpKindsControl = FinancialOpKindsControl;
})();
