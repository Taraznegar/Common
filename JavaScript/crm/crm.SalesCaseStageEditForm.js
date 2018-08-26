(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return crm.SalesCaseStageEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._StageNumberControl = that.FindControl("StageNumberFieldControl");
            that._RequestTypeControl = that.FindControl("RequestTypeFieldControl");

            that._BindableEntity.bind("change", function (e) {
                if (e.field == "RequestType")
                    that._RequestType_Changed();
            });
        },

        _RequestType_Changed: function(){
            var that = this;

            if (that._FormMode == "New") {
                var requestTypeID = that._RequestTypeControl.GetValue();

                if (requestTypeID != null) {
                    var lastStageNumber = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue", ["StageNumber", "crm_SalesCaseStages", String.Format("RequestType = '{0}'", requestTypeID)]);
                    that._StageNumberControl.SetValue(lastStageNumber + 1);
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

    FormClass.TypeName = "crm.SalesCaseStageEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    crm.SalesCaseStageEditForm = FormClass;
})();