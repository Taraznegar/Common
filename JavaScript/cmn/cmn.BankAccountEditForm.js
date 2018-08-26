(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.BankAccountEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._CodeFieldControl = that.FindControl("CodeFieldControl");
            that._MainTabControl = that.FindControl("MainTabControl");

            var code = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["Code", "cmn_BankAccounts", ""]);
            that._CodeFieldControl.SetValue(code + 1);

            if (that._FormMode == "New")
                that._MainTabControl.SetTabEnabled(1, false);
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
                that._MainTabControl.SetTabEnabled(0, true);

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.BankAccountEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.BankAccountEditForm = FormClass;
})();