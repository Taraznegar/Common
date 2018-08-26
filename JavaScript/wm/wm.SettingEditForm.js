(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return wm.SettingEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._MainTabControl = that.FindControl("MainTabControl");
            that._MainTabControl.SelectTabByIndex(0);
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

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.SettingEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    wm.SettingEditForm = FormClass;
})();