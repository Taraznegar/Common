(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return rp.FinancialOpKindEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);
            that._TitleFieldControl = that.FindControl("TitleFieldControl");
            that._ReceiveOrPayFieldControl = that.FindControl("ReceiveOrPayFieldControl");
            that._ReceiveOrPayDropDownList = that._ReceiveOrPayFieldControl.FindControl("InnerControl");
            that._ReceiveOrPayDocTypeDockPanel = that.FindControl("ReceiveOrPayDocTypeDockPanel");
            that._ReceiveDocTypeFieldControl = that.FindControl("ReceiveDocTypeFieldControl");
            that._ReceiveDocTypeDropDownList = that._ReceiveDocTypeFieldControl.FindControl("InnerControl");
            that._PayDocTypeFieldControl = that.FindControl("PayDocTypeFieldControl");
            that._PayDocTypeDropDownList = that._PayDocTypeFieldControl.FindControl("InnerControl");
            that._AccSettingTabControl = that.FindControl("AccSettingTabControl");

            that._AccSettingTabControl.SelectTabByIndex(0);

            that._ReceiveDocTypeDropDownList.SetShowRequiredStar(true);
            that._PayDocTypeDropDownList.SetShowRequiredStar(true);
            that._ReceiveOrPayDropDownList.SetShowRequiredStar(true);

            that._ReceiveType = false;
            that._PayType = false;

            that._FormSaved = false;

            if (options.FormMode == "New") {
                that._BindableEntity._Entity.SetFieldValue("IsUserDefined", 1);
                that._AccSettingTabControl.SetTabEnabled(0, false);

                that._ReceiveOrPayDocTypeDockPanel.SetPaneSizeSetting(0, 1);
                that._ReceiveOrPayDocTypeDockPanel.SetPaneSizeSetting(1, 1);
            }
            else {
                var IsUserDefined = that._BindableEntity._Entity.GetFieldValue("IsUserDefined");
                if (IsUserDefined == false)
                    that._TitleFieldControl.SetReadOnly(true);
            }

            that._ReceiveOrPayFieldControl.bind("ValueChanged", function (e) { that._ReceiveOrPayFieldControl_ValueChanged(e) });
        },

        _ReceiveOrPayFieldControl_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._ReceiveOrPayFieldControl.GetValue())) {
                var receiveOrPay = afw.OptionSetHelper.GetOptionSetItemName(that._ReceiveOrPayFieldControl.GetValue());
                if (!ValueIsEmpty(receiveOrPay)) {

                    if (receiveOrPay == "Receive") {
                        that._BindableEntity.set("PayDocType", null);
                        that._ReceiveType = true;
                    }
                    if (receiveOrPay == "Pay") {
                        that._BindableEntity.set("ReceiveDocType", null);
                        that._PayType = true;
                    }
                }
                else {
                    that._BindableEntity.set("PayDocType", null);
                    that._BindableEntity.set("ReceiveDocType", null);
                    that._ReceiveType = false;
                    that._PayType = false;
                }
            }
            else {
                that._BindableEntity.set("PayDocType", null);
                that._BindableEntity.set("ReceiveDocType", null);
                that._ReceiveType = false;
                that._PayType = false;
            }

            that._AdjustForm();
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

            if (!ValueIsEmpty(that._BindableEntity.get("ReceiveOrPay"))) {
                var receiveOrPay = afw.OptionSetHelper.GetOptionSetItemName(that._BindableEntity.get("ReceiveOrPay"));
                if (receiveOrPay == "Receive") {
                    that._ReceiveOrPayDocTypeDockPanel.SetPaneSizeSetting(0, "fill");
                    that._ReceiveOrPayDocTypeDockPanel.SetPaneSizeSetting(1, 1);
                    that._ReceiveDocTypeFieldControl.SetVisible(true);
                    that._PayDocTypeFieldControl.SetVisible(false);
                }
                if (receiveOrPay == "Pay") {
                    that._ReceiveOrPayDocTypeDockPanel.SetPaneSizeSetting(1, "fill");
                    that._ReceiveOrPayDocTypeDockPanel.SetPaneSizeSetting(0, 1);
                    that._ReceiveDocTypeFieldControl.SetVisible(false);
                    that._PayDocTypeFieldControl.SetVisible(true);
                }
            }
            else {
                that._ReceiveOrPayDocTypeDockPanel.SetPaneSizeSetting(0, 1);
                that._ReceiveOrPayDocTypeDockPanel.SetPaneSizeSetting(1, 1);
                that._ReceiveDocTypeFieldControl.SetVisible(false);
                that._PayDocTypeFieldControl.SetVisible(false);
            }

            if (that._FormMode == "Edit") {
                that._PayDocTypeFieldControl.SetReadOnly(true);
                that._ReceiveDocTypeFieldControl.SetReadOnly(true);
                that._ReceiveOrPayFieldControl.SetReadOnly(true);
            }
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            if (ValueIsEmpty(that._ReceiveOrPayFieldControl.GetValue())) {
                afw.MessageDialog.Show("مقدار فیلد دریافت/پرداخت را وارد نکرده اید.");
                return false;
            }

            if (that._ReceiveType && ValueIsEmpty(that._ReceiveDocTypeFieldControl.GetValue())) {
                afw.MessageDialog.Show("مقدار فیلد نوع سند دریافت را وارد نکرده اید.");
                return false;
            }

            if (that._PayType && ValueIsEmpty(that._PayDocTypeFieldControl.GetValue())) {
                afw.MessageDialog.Show("مقدار فیلد نوع سند پرداخت را وارد نکرده اید.");
                return false;
            }

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

    FormClass.TypeName = "rp.FinancialOpKindEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    rp.FinancialOpKindEditForm = FormClass;
})();