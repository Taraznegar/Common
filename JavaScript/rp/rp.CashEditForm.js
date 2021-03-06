﻿(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return rp.CashEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._CodeFieldControl = that.FindControl("CodeFieldControl");

            var code = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["Code", "rp_Cashs", ""]);
            that._CodeFieldControl.SetValue(code + 1);

            that._AccSettingTabControl = that.FindControl("AccSettingTabControl");
            that._AccSettingTabControl.SelectTabByIndex(0);

            if (that._FormMode == "New")
                that._AccSettingTabControl.SetTabEnabled(0, false);
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

    FormClass.TypeName = "rp.CashEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    rp.CashEditForm = FormClass;
})();