(function () {
    var objectEvents = afw.Window.Events.concat([]);

    var FormClass = afw.Window.extend({
        events: objectEvents,

        GetType: function () {
            return acc.BeforeExitPopup;
        },

        init: function (options) {
            var that = this;

            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (formObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

        },

        _OnOpening: function () {
            var that = this;

            afw.Window.fn._OnOpening.call(that);
        },

        _OnOpened: function () {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
            that.FindControl("SaveAndCloseButton").Focus();
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            afw.Window.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.Window.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.BeforeExitPopup";
    FormClass.BaseType = afw.Window;
    FormClass.Events = objectEvents;

    acc.BeforeExitPopup = FormClass;
})();