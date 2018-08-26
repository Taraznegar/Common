(function () {
    var typeName = "wm.MontageOrDemontageListControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var MontageOrDemontageListControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return wm.MontageOrDemontageListControl;
        },

        init: function (options) {
            var that = this;

            if ("ListMode" in options && !ValueIsEmpty(options.ListMode))
                that._ListMode = options.ListMode;
            else
                throw "ListMode paremater is not set.";

            options.DataListFullName = "wm.MontageOrDemontageList";
            afw.DataListControl.fn.init.call(that, options);
        },

        _OnCreatingColumn: function (columnInfo) {
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            if (that._ListMode == "Montage")
                filterExpression = cmn.AddFilterToFilterExpression(filterExpression,
                    String.Format("OpType = '{0}'", afw.OptionSetHelper.GetOptionSetItemID("wm.MontageOrDemontage.Montage")));
            else if (that._ListMode == "Demontage")
                filterExpression = cmn.AddFilterToFilterExpression(filterExpression,
                    String.Format("OpType = '{0}'", afw.OptionSetHelper.GetOptionSetItemID("wm.MontageOrDemontage.Demontage")));
            else
                throw "Invalid ListMode.";

            filterExpression = cmn.AddActiveFinancialYearFilterToFilterExpression(filterExpression);

            return filterExpression;
        },

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _OnDataLoaded: function () {
            var that = this;

            afw.DataListControl.fn._OnDataLoaded.call(that);
        },

        _OpenEntityWindow: function (entity, formMode, options) {
            var that = this;

            if (that._ListMode == "Montage")
                entity.SetFieldValue("OpType", 
                    afw.OptionSetHelper.GetOptionSetItemID("wm.MontageOrDemontage.Montage"));
            else
                entity.SetFieldValue("OpType",
                    afw.OptionSetHelper.GetOptionSetItemID("wm.MontageOrDemontage.Demontage"));

            return afw.DataListControl.fn._OpenEntityWindow.call(that, entity, formMode, options);
        },

        _OpenEntityForm: function (entity, formMode, options) {
            var that = this;

            return afw.DataListControl.fn._OpenEntityForm.call(that, entity, formMode, options);
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
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            afw.DataListControl.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.DataListControl.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    MontageOrDemontageListControl.TypeName = typeName;
    MontageOrDemontageListControl.BaseType = baseType;
    MontageOrDemontageListControl.Events = objectEvents;


    wm.MontageOrDemontageListControl = MontageOrDemontageListControl;
})();

