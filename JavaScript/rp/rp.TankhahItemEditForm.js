(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return rp.TankhahItemEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._TankhahDefFieldControl = that.FindControl("TankhahDefFieldControl").FindControl("InnerControl");
            that._TankhahTypeFieldControl = that.FindControl("TankhahTypeFieldControl");
            that._RegisterDateFieldControl = that.FindControl("RegisterDateFieldControl").FindControl("InnerControl");
            that._AmountFieldControl = that.FindControl("AmountFieldControl").FindControl("InnerControl");
            that._DescriptionFieldControl = that.FindControl("DescriptionFieldControl").FindControl("InnerControl");
            that._FloatAccountsPanel = that.FindControl("FloatAccountsPanel");

            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._TankhahDefFieldControl.bind("ValueChanged", function (e) { that._TankhahDefFieldControl_ValueChanged(e); });
            that._TankhahTypeFieldControl.bind("ValueChanged", function (e) { that._TankhahTypeFieldControl_ValueChanged(e); });

            that._AmountFieldControl.bind("KeyPressed", function (e) {

                if (e.Key == "Enter") {
                    that._RegisterDateFieldControl.Focus();
                }
            });

            that._RegisterDateFieldControl.bind("KeyPressed", function (e) {

                if (e.Key == "Enter") {
                    that._DescriptionFieldControl.Focus();
                }
            });

            that.ItemsEntityList = null;

            that._FloatAccountsSelectionControl = afw.uiApi.CreateSavedFormByName(
                that._FloatAccountsPanel, "acc.FloatAccountsSelectionControl",
                {
                    BindableEntity: that._BindableEntity,
                    PersonFieldName: "Person",
                    CostCenterFieldName: "CostCenter",
                    ProjectFieldName: "Project",
                    ForeignCurrencyFieldName: null,
                    Visible: false
                });

            if (that._FormMode == "New") {
                that._NowDateTime = afw.uiApi.CallServerMethodSync("core.GetServerDateTime");
                var nowDateTimeSplited = that._NowDateTime.split(' ');
                that._RegisterDateFieldControl.SetValue(nowDateTimeSplited[0]);
            }
            else if (that._FormMode == "Edit") {
                if (options.IsView)
                    that.EntityWindowBaseVDockPanel1.Panes[0].SetSizeSetting(1, 1);
            }

            that._SetFilterOnTankhahDef();
        },

        _AdjustFloatAccountsSelectionControl: function () {
            var that = this;

            var accountID = null;

            if (!ValueIsEmpty(that._BindableEntity.get("TankhahDef"))) {
                var tankhahDefID = afw.uiApi.FetchEntity("rp.TarafHesabeTankhahAccSetting",
                    String.Format("TarafHesabeTankhah = '{0}' and FinancialYear = '{1}'",
                        that._BindableEntity.get("TankhahDef"),
                        that._ActiveFinancialYearID));

                accountID = tankhahDefID.GetFieldValue("Account");
            }

            that._FloatAccountsSelectionControl.SetAccount(accountID);

            if (accountID != null && acc.AccountHasFloat(accountID)) {
                that._FloatAccountsPanel.SetVisible(true);

                if (that._FormMode == "New")
                    that._FloatAccountsPanel.SetFillParent(true);

                that._MainDockPanel.SetPaneSizeSetting(2, 70);
                that._FloatAccountsSelectionControl.SetVisible(true);
                that._FloatAccountsSelectionControl.SetFillParent(true);
            }
            else {
                that._MainDockPanel.SetPaneSizeSetting(2, 1);
                that._FloatAccountsPanel.SetVisible(false);
                that._FloatAccountsPanel.SetFillParent(false);
                that._FloatAccountsSelectionControl.SetVisible(false);
                that._FloatAccountsSelectionControl.SetFillParent(false);
            }
        },

        _TankhahDefFieldControl_ValueChanged: function (e) {
            var that = this;

            that._AdjustForm();
        },

        _TankhahTypeFieldControl_ValueChanged: function (e) {
            var that = this;

            that._TankhahDefFieldControl.SetValue(null);
            that._SetFilterOnTankhahDef();
        },

        _SetFilterOnTankhahDef: function () {
            var that = this;

            var TankhahType = that._TankhahTypeFieldControl.GetValue();
            that._TankhahDefFieldControl.SetBaseFilterExpression(String.Format("TankhahType = '{0}'", TankhahType));
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

            if (ValueIsEmpty(that._TankhahDefFieldControl.GetValue()))
                that._MainDockPanel.SetPaneSizeSetting(2, 1);

            that._AdjustFloatAccountsSelectionControl();
        },

        _ValidateForm: function () {
            var that = this;

            if (!that._FloatAccountsSelectionControl.ValidateControl())
                return false;

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

    FormClass.TypeName = "rp.TankhahItemEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    rp.TankhahItemEditForm = FormClass;
})();