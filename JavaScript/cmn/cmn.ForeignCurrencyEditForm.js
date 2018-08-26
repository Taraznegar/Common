(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.ForeignCurrencyEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._CodeFieldControl = that.FindControl("CodeFieldControl");
            that._ForeignCurrencyGroupFieldControl = that.FindControl("ForeignCurrencyGroupFieldControl");

            that._BindableEntity.bind("change", function (e) {
                if (e.field == "ForeignCurrencyGroup")
                    that._ForeignCurrencyGroup_Changed();
            });
        },

        _ForeignCurrencyGroup_Changed: function () {
            var that = this;

            var foreignCurrencyGroupID = that._ForeignCurrencyGroupFieldControl.GetValue();
            if (foreignCurrencyGroupID != null) {
                if (that._FormMode == "New") {
                    var lastCode = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["Code", "cmn_ForeignCurrencies", String.Format("ForeignCurrencyGroup = '{0}'", foreignCurrencyGroupID)]);
                    that._CodeFieldControl.SetValue(lastCode + 1);
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

    FormClass.TypeName = "cmn.ForeignCurrencyEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.ForeignCurrencyEditForm = FormClass;
})();