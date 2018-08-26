(function () {
    var objectEvents = afw.EntityWindowBase.Events.concat([]);

    var FormClass = afw.EntityWindowBase.extend({
        events: objectEvents,

        GetType: function () {
            return cmn.DiscountEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._AccSettingTabControl = that.FindControl("AccSettingTabControl");
            that._AccSettingTabControl.SelectTabByIndex(0);

            if (that._FormMode == "New") {
                that._AccSettingTabControl.SetTabEnabled(0, false);
            }
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
            if (saved)
                that._AccSettingTabControl.SetTabEnabled(0, true);

            return saved;
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            afw.EntityWindowBase.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.EntityWindowBase.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.DiscountEditForm";
    FormClass.BaseType = afw.EntityWindowBase;
    FormClass.Events = objectEvents;

    cmn.DiscountEditForm = FormClass;
})();
