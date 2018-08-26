(function () {
    var FormClass = afw.Window.extend({
        GetType: function () {
            return rp.ChequesStatusChangeForm;
        },

        init: function (options) {
            var that = this;

            options.Title = "تغییر وضعیت چک ها";
            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            that._CurrentStatus = options.ChequeCurrentStatus;
            that._ChequesEntityList = options.ChequesEntityList;
            that._ChequesType = options.ChequesType;
            that._BankAccountInPriorStatus = options.BankAccountInPriorStatus;
            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._CurrentStatusName = afw.OptionSetHelper.GetOptionSetItemName(that._CurrentStatus);

            that._ChequeStatusStatusChangeEntity = null;
            that._CreateChequeStatusChangeEntity();

            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._FloatAccountsPanel = that.FindControl("FloatAccountsPanel");
            that._NewStatusOptionSetControl = that.FindControl("NewStatusOptionSetControl");
            that._DateTimeControl = that.FindControl("DateTimeControl");
            that._BankAccountLookupControl = that.FindControl("BankAccountLookupControl");
            that._CashLookupControl = that.FindControl("CashLookupControl");
            that._ChequeStatusChangeAccSettingLookupControl = that.FindControl("ChequeStatusChangeAccSettingLookupControl");

            that._OkButton = that.FindControl("OkButton");
            that._CancelButton = that.FindControl("CancelButton");
            that._ChequesCountLabel = that.FindControl("ChequesCountLabel");

            var currentStatusTitle = afw.OptionSetHelper.GetOptionSetItemTitle(that._CurrentStatus);
            that.FindControl("CurrentStatusLabel").SetText("وضعیت فعلی:  " + currentStatusTitle);

            that._DateTimeControl.SetValue(afw.DateTimeHelper.GetServerDateTime());

            that._BankAccountLookupControl.SetVisible(false);
            that._ChequeStatusChangeAccSettingLookupControl.SetVisible(false);
            that._CashLookupControl.SetVisible(false);

            that._NewStatusOptionSetControl.bind("ValueChanged", function (e) { that._NewStatusOptionSetControl_ValueChanged(e); });
            that._ChequeStatusChangeAccSettingLookupControl.bind("ValueChanged", function (e) {
                that._ChequeStatusChangeAccSettingLookupControl_ValueChanged(e);
            });

            that._OkButton.bind("Click", function (e) { that._OkButton_Click(e); });
            that._CancelButton.bind("Click", function (e) { that._CancelButton_Click(e); });

            that._ChequesCountLabel.SetText("تعداد " + that._ChequesEntityList.Entities.length + " چک انتخاب شده است");

            that._FilterNewStatusOptionSetControlItems();

            that._AdjustForm();
        },

        _AdjustFloatAccountsSelectionControl: function (accountID, hasPerson, hasCostCenter, hasProject, hasForeignCurrency) {
            var that = this;

            if (that._FloatAccountsSelectionControl != null && !that._FloatAccountsSelectionControl.IsDestroying)
                that._FloatAccountsSelectionControl.Destroy();

            that._FloatAccountsSelectionControl = afw.uiApi.CreateSavedFormByName(
                that._FloatAccountsPanel, "acc.FloatAccountsSelectionControl",
                {
                    BindableEntity: that._BindableEntity,
                    PersonFieldName: hasPerson == true ? "Person" : null,
                    CostCenterFieldName: hasCostCenter == true ? "CostCenter" : null,
                    ProjectFieldName: hasProject == true ? "Project" : null,
                    ForeignCurrencyFieldName: hasForeignCurrency == true ? "ForeignCurrency" : null,
                    Visible: false,
                    RightPadding: 1,
                    LabelWidth: 110
                });

            that._FloatAccountsSelectionControl.SetAccount(accountID);

            if (!ValueIsEmpty(accountID) && acc.AccountHasFloat(accountID)) {
                that._FloatAccountsPanel.SetVisible(true);

                if (that._FormMode == "New")
                    that._FloatAccountsPanel.SetFillParent(true);

                that._MainDockPanel.SetPaneSizeSetting(7, 70);
                that._FloatAccountsSelectionControl.SetVisible(true);
                that._FloatAccountsSelectionControl.SetFillParent(true);
            }
            else {
                that._MainDockPanel.SetPaneSizeSetting(7, 1);
                that._FloatAccountsPanel.SetVisible(false);
                that._FloatAccountsPanel.SetFillParent(false);
                that._FloatAccountsSelectionControl.SetVisible(false);
                that._FloatAccountsSelectionControl.SetFillParent(false);
            }
        },

        _CreateChequeStatusChangeEntity: function () {
            var that = this;

            if (that._ChequesType == "Received")
                that._ChequeStatusStatusChangeEntity = afw.uiApi.CreateNewEntity("rp.ReceivedChequeStatusChange");
            else
                that._ChequeStatusStatusChangeEntity = afw.uiApi.CreateNewEntity("rp.PaidChequeStatusChange");

            that._BindableEntity = that._ChequeStatusStatusChangeEntity.ToBindableEntity();
            that.InitDataBinding(that._BindableEntity);
            that._BindableEntity._Entity.AddField("CurrentStatus", that._CurrentStatus);
            that._BindableEntity.set("FinancialYear", that._FinancialYearID)

        },

        _FilterNewStatusOptionSetControlItems: function () {
            var that = this;

            var filter = "";
            if (that._ChequesType == "Received") {
                that._NewStatusOptionSetControl.SetOptionSetFullName("rp.ReceivedChequeStatus");

                if (that._CurrentStatusName == "AsnadeDaryaftani")
                    filter += " and Name in ('BargashtBeMalekeCheque', 'DarJaryaneVosol', 'VosoolShode', 'VarizShodeBeSandogh', 'VagozariBeShakhs')";
                else if (that._CurrentStatusName == "DarJaryaneVosol")
                    filter += " and Name in ('VosoolShode', 'BargashtKhordeh')";
                else if (that._CurrentStatusName == "VagozariBeShakhs")
                    filter += " and Name in ('AsnadeDaryaftani', 'BargashtBeMalekeCheque')";
            }
            else {
                that._NewStatusOptionSetControl.SetOptionSetFullName("rp.PaidChequeStatus");

                if (that._CurrentStatusName == "PasShode" || that._CurrentStatusName == "Odat")
                    filter += " and 1=2";
            }

            that._NewStatusOptionSetControl.SetFilterExpression(String.Format("ID <> '{0}' {1}", that._CurrentStatus, filter));

        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _OkButton_Click: function () {
            var that = this;

            if (that._ValidateForm()) {

                try {
                    if (that._ChequesType == "Received")
                        that.ResultEntity = afw.uiApi.CallServerMethodSync("rp.ChangeReceivedChequesStatus",
                                                  [that._ChequesEntityList, that._ChequeStatusStatusChangeEntity]);
                    else
                        that.ResultEntity = afw.uiApi.CallServerMethodSync("rp.ChangePaidChequesStatus",
                                                  [that._ChequesEntityList, that._ChequeStatusStatusChangeEntity]);

                    that.SetDialogResult("Ok");
                    that.Close();
                }
                catch (ex) {
                    afw.ErrorDialog.Show(ex);
                }
            }
        },

        _CancelButton_Click: function () {
            var that = this;

            that.SetDialogResult("Cancel");
            that.Close();
        },

        _ValidateForm: function () {
            var that = this;

            var date = that._DateTimeControl.GetType();
            if (ValueIsEmpty(date)) {
                afw.ErrorDialog.Show("تاریخ وارد نشده است");
                return false;
            }

            var newStatusID = that._NewStatusOptionSetControl.GetValue();
            if (ValueIsEmpty(newStatusID)) {
                afw.ErrorDialog.Show("وضعیت جدید وارد نشده است");
                return false;
            }

            if (that._BankAccountLookupControl.GetVisible()) {
                var statusChangeAccountID = that._BankAccountLookupControl.GetValue();
                if (ValueIsEmpty(statusChangeAccountID)) {
                    afw.ErrorDialog.Show("حساب بانکی وارد نشده است");
                    return false;
                }
            }

            if (that._ChequeStatusChangeAccSettingLookupControl.GetVisible()) {
                var statusChangeAccountID = that._ChequeStatusChangeAccSettingLookupControl.GetValue();
                if (ValueIsEmpty(statusChangeAccountID)) {
                    afw.ErrorDialog.Show("حساب تغییر وضعیت وارد نشده است");
                    return false;
                }
            }

            if (that._CashLookupControl.GetVisible()) {
                var statusChangeAccountID = that._CashLookupControl.GetValue();
                if (ValueIsEmpty(statusChangeAccountID)) {
                    afw.ErrorDialog.Show("حساب صندوق وارد نشده است");
                    return false;
                }
            }

            if (!ValueIsEmpty(that._FloatAccountsSelectionControl))
                if (!that._FloatAccountsSelectionControl.ValidateControl())
                    return false;

            return true;
        },

        _NewStatusOptionSetControl_ValueChanged: function () {
            var that = this;

            var newStatusName = that._GetNewStatusName();

            if (newStatusName == "VosoolShode" && that._BankAccountInPriorStatus != null)
                that._BankAccountLookupControl.SetValue(that._BankAccountInPriorStatus);

            if (!ValueIsEmpty(that._NewStatusOptionSetControl.GetValue())) {
                var NewStatusID = that._NewStatusOptionSetControl.GetValue();
                if (that._ChequesType == "Received")
                    that._ChequeStatusChangeAccSettingLookupControl.SetBaseFilterExpression(
                        String.Format("ReceivedChequeStatus = '{0}' and IsActive = 1", NewStatusID));
                else
                    that._ChequeStatusChangeAccSettingLookupControl.SetBaseFilterExpression(
                        String.Format("PaidChequeStatus = '{0}' and IsActive = 1", NewStatusID));
            }

            that._AdjustForm();
        },

        _ChequeStatusChangeAccSettingLookupControl_ValueChanged: function (e) {
            var that = this;

            that._BindableEntity.set("Person", null);

            if (!ValueIsEmpty(that._ChequeStatusChangeAccSettingLookupControl.GetValue())) {
                var newStatusName = that._GetNewStatusName();

                var chequeStatusChangeAccSetting = afw.uiApi.FetchEntityByID("rp.ChequeStatusChangeAccSetting",
                    that._ChequeStatusChangeAccSettingLookupControl.GetValue());

                var accountInCoding = chequeStatusChangeAccSetting.GetFieldValue("AccountInCoding");
                if (ValueIsEmpty(accountInCoding)) {
                    that._ChequeStatusChangeAccSettingLookupControl.SetValue(null);
                    afw.ErrorDialog.Show("حساب کدینگ در حساب تغییر وضعیت تعیین نشده است");
                    return;
                }

                if (ValueIsIn(newStatusName, ["VagozariBeShakhs"]))
                    if (!acc.AccountHasFloat(accountInCoding, "Person")) {
                        that._ChequeStatusChangeAccSettingLookupControl.SetValue(null);
                        afw.ErrorDialog.Show("حساب انتخاب شده حتما باید دارای شناور شخص باشد");
                        return;
                    }

                if (newStatusName == "VagozariBeShakhs")
                    that._AdjustFloatAccountsSelectionControl(accountInCoding, true, true, true, true);
                else
                    that._AdjustFloatAccountsSelectionControl(accountInCoding, false, true, true, true);
            }

            that._AdjustForm();
        },

        _GetNewStatusName: function () {
            var that = this;

            var newStatusId = that._NewStatusOptionSetControl.GetValue();
            if (newStatusId == null)
                return null;

            var newStatusName = afw.OptionSetHelper.GetOptionSetItemName(newStatusId);
            return newStatusName;
        },

        _AdjustForm: function () {
            var that = this;

            if (that._ChequesType == "Received") {
                var newStatusName = that._GetNewStatusName();

                if (newStatusName == null) {
                    that._ChequeStatusChangeAccSettingLookupControl.SetVisible(false);
                    that._BankAccountLookupControl.SetVisible(false);
                    that._CashLookupControl.SetVisible(false);
                }
                else {
                    if (newStatusName == "VosoolShode" && !ValueIsEmpty(that._BankAccountInPriorStatus))
                        that._BankAccountLookupControl.SetReadOnly(true);
                    else
                        that._BankAccountLookupControl.SetReadOnly(false);

                    if (ValueIsIn(newStatusName, ["VagozariBeShakhs"]))
                        that._ChequeStatusChangeAccSettingLookupControl.SetVisible(true);
                    else
                        that._ChequeStatusChangeAccSettingLookupControl.SetVisible(false);

                    if (ValueIsIn(newStatusName, ["DarJaryaneVosol", "VosoolShode"]))
                        that._BankAccountLookupControl.SetVisible(true);
                    else
                        that._BankAccountLookupControl.SetVisible(false);

                    if (newStatusName == "VarizShodeBeSandogh")
                        that._CashLookupControl.SetVisible(true);
                    else
                        that._CashLookupControl.SetVisible(false);
                }
            }

            if (!ValueIsEmpty(that._CurrentStatusName)) {
                if (ValueIsIn(that._CurrentStatusName, ["VarizShodeBeSandogh", "VosoolShode", "PasShode", "Odat"])) {
                    that._NewStatusOptionSetControl.SetReadOnly(true);
                    that._NewStatusOptionSetControl.SetValue(null);
                }
            }
            that._MainDockPanelSetPaneSizeSetting();
        },

        _MainDockPanelSetPaneSizeSetting: function () {
            var that = this;

            if (that._ChequeStatusChangeAccSettingLookupControl.GetVisible()) {
                that._MainDockPanel.SetPaneSizeSetting(5, 48);
                that._MainDockPanel.SetPaneSizeSetting(6, 70);
            }
            else {
                that._MainDockPanel.SetPaneSizeSetting(5, 1);
                that._MainDockPanel.SetPaneSizeSetting(6, 1);
            }

            if (that._BankAccountLookupControl.GetVisible())
                that._MainDockPanel.SetPaneSizeSetting(4, 48);
            else
                that._MainDockPanel.SetPaneSizeSetting(4, 1);

            if (that._CashLookupControl.GetVisible())
                that._MainDockPanel.SetPaneSizeSetting(7, 48);
            else
                that._MainDockPanel.SetPaneSizeSetting(7, 1);
        }

    });

    //Static Members:

    FormClass.TypeName = "rp.ChequesStatusChangeForm";
    FormClass.BaseType = afw.Window;

    rp.ChequesStatusChangeForm = FormClass;
})();