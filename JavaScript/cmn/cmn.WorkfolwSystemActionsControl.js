(function () {
    var typeName = "cmn.WorkfolwSystemActionsControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var WorkfolwSystemActionsControl = baseType.extend({
        events: events,

        GetType: function () {
            return cmn.WorkfolwSystemActionsControl;
        },

        init: function (options) {
            var that = this;

            that._WorkfolwForm = options.WorkfolwForm;
            options.DataListFullName = "cmn.WorkfolwSystemActions";
            afw.DataListControl.fn.init.call(that, options);

            that._WorkfolwForm = options.WorkfolwForm;
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            
            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        //_GetTotalFilterExpression: function () {
        //    var that = this;

        //    var filter = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

        //    if (!ValueIsEmpty(filter))
        //        filter += " and ";
        //    filter += String.Format("WorkfolwForm = '{0}'", that._WorkfolwForm);
        //return filter;
        //},

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

    WorkfolwSystemActionsControl.TypeName = typeName;
    WorkfolwSystemActionsControl.BaseType = baseType;
    WorkfolwSystemActionsControl.Events = events;


    cmn.WorkfolwSystemActionsControl = WorkfolwSystemActionsControl;
})();
