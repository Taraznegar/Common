(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.StuffEditForm;
        },

        init: function (options) {

            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);
            
            that._CustomCodeInnerControl = that.FindControl("CustomCodeFieldControl").FindControl("InnerControl");
            that._StuffDefInnerControl = that.FindControl("StuffDefFieldControl").FindControl("InnerControl");
            that._StuffDefInnerControl.bind("ValueChanged", function (e) { that._StuffDefInnerControl_ValueChanged(e); });

            if (that._FormMode == "New")
            {
                try {
                    var lastCode = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["CustomCode", "cmn_Stuffs", null]);
                    that._CodeFieldControl = that.FindControl("CodeFieldControl");
                    that._CodeFieldControl.SetValue(lastCode + 1);
                }
                catch (ex) {
                }
            }
        },

        _StuffDefInnerControl_ValueChanged: function (e) {
            var that = this;

            that._CustomNameInnerControl = that.FindControl("CustomNameFieldControl").FindControl("InnerControl");
            var stuffDefID = e.Sender.GetValue();
            var customName = afw.uiApi.CallServerMethodSync("cmn.GenerateStuffDefName", [stuffDefID]);
            that._CustomNameInnerControl.SetValue(customName);
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

    FormClass.TypeName = "cmn.StuffEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.StuffEditForm = FormClass;
})();