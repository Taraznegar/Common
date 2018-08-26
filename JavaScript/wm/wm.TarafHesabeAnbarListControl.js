(function () {
    var typeName = "wm.TarafHesabeAnbarListControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var TarafHesabeAnbarListControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return wm.TarafHesabeAnbarListControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "wm.TarafHesabeAnbarList";
            afw.DataListControl.fn.init.call(that, options);

            that._ContainerWindow = that.GetContainerWindow();
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

        _OnDataLoaded: function () {
            var that = this;

            afw.DataListControl.fn._OnDataLoaded.call(that);
        },
        
        _ShowEntityWindow: function (entity, formMode, options) {
            var that = this;

            var parentEntity = that._ContainerWindow.GetBindableEntity()._Entity;

            if (ValueIsEmpty(options))
                options = {};

            options = {
                ParentEntity: parentEntity
            }

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

    TarafHesabeAnbarListControl.TypeName = typeName;
    TarafHesabeAnbarListControl.BaseType = baseType;
    TarafHesabeAnbarListControl.Events = objectEvents;


    wm.TarafHesabeAnbarListControl = TarafHesabeAnbarListControl;
})();

