(function () {
    var objectEvents = afw.EntityWindowBase.Events.concat([]);

    var FormClass = afw.EntityWindowBase.extend({
        events: objectEvents,

        GetType: function () {
            return wm.ReferenceDocTypeEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._TitleFieldControl = that.FindControl("TitleFieldControl");
            that._EmkaneSodoreGhabzVorodFieldControl = that.FindControl("EmkaneSodoreGhabzVorodFieldControl");
            that._EmkaneSodoreHavaleKhorojFieldControl = that.FindControl("EmkaneSodoreHavaleKhorojFieldControl");

            if (that._FormMode == "Edit" && that._BindableEntity.get("IsUserDefined") == false) {
                that._FormIsReadOnly();
            }
        },

        _FormIsReadOnly: function () {
            var that = this;

            that._TitleFieldControl.SetReadOnly(true);
            that._EmkaneSodoreGhabzVorodFieldControl.SetReadOnly(true);
            that._EmkaneSodoreHavaleKhorojFieldControl.SetReadOnly(true);
            that.EntityWindowBaseVDockPanel1.Panes[0].SetSizeSetting(1, 1);
        },

        _OnOpening: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnOpening.call(that);
        },

        _OnOpened: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnClosed.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            return true;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.ReferenceDocTypeEditForm";
    FormClass.BaseType = afw.EntityWindowBase;
    FormClass.Events = objectEvents;

    wm.ReferenceDocTypeEditForm = FormClass;
})();