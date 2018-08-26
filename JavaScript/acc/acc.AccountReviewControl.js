(function () {
    var typeName = "acc.AccountReviewControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var AccountReviewControl = baseType.extend({
        events: events,

        GetType: function () {
            return acc.AccountReviewControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "acc.AccountReview";
            afw.DataListControl.fn.init.call(that, options);

            if ("FilterControl" in options)
                that._FilterControl = options.FilterControl;
            else
                that._FilterControl = null;
        },

        SetVisibleQuickSearch: function(value){
            var that = this;

            var accountReview_VDockPanel = that.FindControl(that.GetName() + "_VDockPanel");

            if(value == true)
                accountReview_VDockPanel.SetPaneSizeSetting(2, "fill");
            else
                accountReview_VDockPanel.SetPaneSizeSetting(2, 1);
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

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

        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            if (that._FilterControl != null)
                var filter = that._FilterControl.GetFilterExpression();

            if (!ValueIsEmpty(filter)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += filter;
            }

            return filterExpression;
        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            //afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        }
    });

    //Static Members:

    AccountReviewControl.TypeName = typeName;
    AccountReviewControl.BaseType = baseType;
    AccountReviewControl.Events = events;


    acc.AccountReviewControl = AccountReviewControl;
})();
