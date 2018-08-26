(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.StuffSubCategoryEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            if (that._FormMode == "New") {
                try {
                    var lastCode = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["Code", "cmn_StuffSubCategories", null]);
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

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.StuffSubCategoryEditForm";

    FormClass.BaseType = afw.EntityWindowBase;

    cmn.StuffSubCategoryEditForm = FormClass;
})();