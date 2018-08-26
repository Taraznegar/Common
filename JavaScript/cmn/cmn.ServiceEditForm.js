(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.ServiceEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._AccSettingTabControl = that.FindControl("AccSettingTabControl");
            that._AccSettingTabControl.SelectTabByIndex(0);

            if (that._FormMode == "New") {
                that._AccSettingTabControl.SetTabEnabled(0, false);

                try {
                    var lastCode = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["Code", "cmn_Services", null]);
                    that._CodeFieldControl = that.FindControl("CodeFieldControl");
                    that._CodeFieldControl.SetValue(lastCode + 1);
                }
                catch (ex) {
                }
            }
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
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
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.ServiceEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.ServiceEditForm = FormClass;
})();