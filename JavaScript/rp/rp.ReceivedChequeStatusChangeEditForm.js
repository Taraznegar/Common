(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return rp.ReceivedChequeStatusChangeEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._NewStatusFieldControl = that.FindControl("NewStatusFieldControl");
            that._DateFieldControl = that.FindControl("DateFieldControl");
            that._BankAccountFieldControl = that.FindControl("BankAccountFieldControl");
            
            var currentStatusTitle = afw.OptionSetHelper.GetOptionSetItemTitle(options.ChequeCurrentStatus);
            that.FindControl("CurrentStatusLabel").SetText("وضعیت فعلی:  " + currentStatusTitle);

            that._DateFieldControl.SetValue(afw.DateTimeHelper.GetServerDateTime());

            that._BankAccountFieldControl.SetVisible(false);

            that._NewStatusFieldControl.bind("ValueChanged", function (e) { that._NewStatusFieldControl_ValueChanged(e); });

            that._NewStatusOptionSetControl = that._NewStatusFieldControl.FindControl("InnerControl");
            that._NewStatusOptionSetControl.SetFilterExpression(String.Format("ID <> '{0}'", options.ChequeCurrentStatus));
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

        _NewStatusFieldControl_ValueChanged: function () {
            var that = this;

            var statusId = that._NewStatusFieldControl.GetValue();
            var selectedStatusName = afw.OptionSetHelper.GetOptionSetItemName(statusId);
            if (ValueIsIn(selectedStatusName, ["DarJaryaneVosol", "VosoolShode"])) {
                that._BankAccountFieldControl.SetVisible(true);
            }
            else {
                that._BankAccountFieldControl.SetVisible(false);
            }

            if (selectedStatusName == "VosoolShode") {
                var chequeId = that._BindableEntity.get("Cheque");
                var priorStatusChanges = afw.uiApi.FetchEntityList(
                    "rp.ChequeStatusChange",
                    String.Format("Cheque = '{0}'", chequeId), "CreationTime desc", 1, 1
                    ).Entities;

                if (priorStatusChanges.length == 1) {
                    that._BankAccountFieldControl.SetValue(priorStatusChanges[0].GetFieldValue("BankAccount"));
                    that._BankAccountFieldControl.SetReadOnly(true);
                }
                else {
                    that._BankAccountFieldControl.SetReadOnly(false);
                }
            }
            else {
                that._BankAccountFieldControl.SetReadOnly(false);
            }

        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            var statusId = that._NewStatusFieldControl.GetValue();
            var statusName = afw.OptionSetHelper.GetOptionSetItemName(statusId);
            if (ValueIsIn(statusName, ["DarJaryaneVosol", "VosoolShode"]) &&
                ValueIsEmpty(that._BindableEntity._Entity.GetFieldValue("BankAccount"))) {
                afw.ErrorDialog.Show("حساب بانکی وارد نشده است");
                return false;
            }

            return true;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.ReceivedChequeStatusChangeEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    rp.ReceivedChequeStatusChangeEditForm = FormClass;
})();