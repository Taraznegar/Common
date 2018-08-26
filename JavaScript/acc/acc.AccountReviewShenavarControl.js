(function () {
    var typeName = "acc.AccountReviewShenavarControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var AccountReviewShenavarControl = baseType.extend({
        events: events,

        GetType: function () {
            return acc.AccountReviewShenavarControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "acc.AccountReviewShenavar";
            afw.DataListControl.fn.init.call(that, options);
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

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            //afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        }
    });

    //Static Members:

    AccountReviewShenavarControl.TypeName = typeName;
    AccountReviewShenavarControl.BaseType = baseType;
    AccountReviewShenavarControl.Events = events;


    acc.AccountReviewShenavarControl = AccountReviewShenavarControl;
})();
