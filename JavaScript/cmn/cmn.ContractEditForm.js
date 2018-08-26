(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.ContractEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._contractNoControl = that.FindControl("ContractNoFieldControl");
            that._startDateControl = that.FindControl("StartDateFieldControl").FindControl("InnerControl");
            that._endDateControl = that.FindControl("EndDateFieldControl").FindControl("InnerControl");

            if (that._FormMode == "New") {

                var lastContractNo = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["ContractNo", "cmn_Contracts", ""]);
                that._contractNoControl.SetValue(lastContractNo + 1);

                var DateTime = afw.uiApi.CallServerMethodSync("core.GetServerDateTime");
                that._startDateControl.SetValue(DateTime);
                that._endDateControl.SetValue(DateTime);
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

    FormClass.TypeName = "cmn.ContractEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.ContractEditForm = FormClass;
})();