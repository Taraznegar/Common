(function () {
    var typeName = "cmn.FloatPrioritiesControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var FloatPrioritiesControl = baseType.extend({
        events: events,

        GetType: function () {
            return cmn.FloatPrioritiesControl;
        },

        init: function (options) {
            var that = this;

            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();
            cmn.InitFinancialOpList(options, that._FinancialYearID);

            options.DataListFullName = "cmn.FloatPriorities";
            afw.DataListControl.fn.init.call(that, options);
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (buttonKey == "New" && that._FinancialYearID == null)
                    afw.ErrorDialog.Show("سال مالی فعال انتخاب نشده است.");                           
            else
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

    FloatPrioritiesControl.TypeName = typeName;
    FloatPrioritiesControl.BaseType = baseType;
    FloatPrioritiesControl.Events = events;


    cmn.FloatPrioritiesControl = FloatPrioritiesControl;
})();
