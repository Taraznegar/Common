(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return rp.ChequeStatusChangeAccSettingEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._UserActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._ChequeTypeFieldControl = that.FindControl("ChequeTypeFieldControl");
            that._StatusOptionSetControl = that.FindControl("StatusOptionSetControl");
            that._FinancialYearFieldControl = that.FindControl("FinancialYearFieldControl");
            that._AccountInCodingLookupControl = that.FindControl("AccountInCodingLookupControl");

            that._StatusOptionSetControl.SetShowRequiredStar(true);

            that._ChequeTypeFieldControl.bind("ValueChanged", function (e) { that._ChequeTypeFieldControl_ValueChanged(e); });
            that._FinancialYearFieldControl.bind("ValueChanged", function (e) { that._FinancialYearFieldControl_ValueChanged(e); });
            that._AccountInCodingLookupControl.bind("OpeningLookup", function (e) { that._AccountInCodingLookupControl_OpeningLookup(e); });

            if (that._FormMode == "New") {
                var id = afw.OptionSetHelper.GetOptionSetItemID("rp.ChequeGeneralType.Received");
                that._ChequeTypeFieldControl.SetValue(id);
                that._FinancialYearFieldControl.SetValue(that._UserActiveFinancialYearID);
            }
            else {
                that._AccountInCodingLookupControl.SetBaseFilterExpression(
                    String.Format("FinancialYear = '{0}'", that._BindableEntity.get("FinancialYear")));

                var chequeTypeID = that._BindableEntity.get("ChequeType");
                that._SetStatusControlProperties(chequeTypeID);
            } 
        },

        _FinancialYearFieldControl_ValueChanged: function (e) {
            var that = this;

            that._AccountInCodingLookupControl.SetValue(null);

            if (that._FinancialYearFieldControl.GetValue() != null)
                that._AccountInCodingLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._FinancialYearFieldControl.GetValue()));
            else
                that._AccountInCodingLookupControl.SetBaseFilterExpression(String.Format("FinancialYear = '{0}'", that._UserActiveFinancialYearID));
        },

        _AccountInCodingLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({ FinancialYear: that._FinancialYearFieldControl.GetValue() });
        },

        _ChequeTypeFieldControl_ValueChanged: function (e) {
            var that = this;

            var chequeTypeID = that._ChequeTypeFieldControl.GetValue();

            if (chequeTypeID == null) {
                var id = afw.OptionSetHelper.GetOptionSetItemID("rp.ChequeGeneralType.Received");
                that._ChequeTypeFieldControl.SetValue(id);
                return;
            }

            that._AccountInCodingLookupControl.SetValue(null);
            that._StatusOptionSetControl.SetValue(null);

            that._SetStatusControlProperties(chequeTypeID);

        },

        _SetStatusControlProperties: function (chequeTypeID) {
            var that = this;

            var chequeTypeName = afw.OptionSetHelper.GetOptionSetItemName(chequeTypeID);

            switch (chequeTypeName) {
                case "Received": {
                    that._StatusOptionSetControl.SetOptionSetFullName("rp.ReceivedChequeStatus");
                    that._StatusOptionSetControl.SetValueDataMember("ReceivedChequeStatus");
                    that._StatusOptionSetControl.SetFilterExpression("Name <> 'VarizShodeBeSandogh' and Name <> "+
                        "'VosoolShode' and Name <> 'DarJaryaneVosol' and Name <> 'AsnadeDaryaftani' ");
                    break;
                }
                case "Paid": {
                    that._StatusOptionSetControl.SetOptionSetFullName("rp.PaidChequeStatus");
                    that._StatusOptionSetControl.SetValueDataMember("PaidChequeStatus");
                    that._StatusOptionSetControl.SetFilterExpression("Name <> 'PasShode' and Name <> 'PasNashode'");
                    break;
                }
            }

            that._StatusOptionSetControl.InitDataBinding(that._BindableEntity);

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

            if (ValueIsIn(buttonKey, ["Save", "SaveAndClose"])) {
                if (that._HasAccDoc()) {
                    var confirmDialog = afw.ConfirmDialog.Show("برای این حساب وضعیت سند حسابداری ثبت شده است، آیا تغییرات ثبت شود؟");
                    confirmDialog.bind("Close", function () {
                        if (confirmDialog.GetDialogResult() == "Yes") {
                            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
                        }
                    });
                }
                else {
                    afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
                }
            }
            else
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

            if (that._StatusOptionSetControl.GetValue() == null) {
                afw.ErrorDialog.Show("وضعیت مقدار ندارد");
                return false;
            }

            return true;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            return saved;
        },

        _HasAccDoc: function () {
            var that = this;

            var has = false;

            if (that._FormMode == "Edit" && that._FormHasUnsavedChanges) {
                var entity = afw.uiApi.FetchEntity("rp.ChequeStatusChangeAccSetting", String.Format("ID = '{0}' ", that._BindableEntity.get("ID")));
                var AccDocItemList = null;
                var chequeTypeName = afw.OptionSetHelper.GetOptionSetItemName(that._ChequeTypeFieldControl.GetValue());
                switch (chequeTypeName) {
                    case "Received": {
                        AccDocItemList = afw.uiApi.FetchEntityList("acc.AccDocItem",
                                                        String.Format("RefOp_ReceivedChequeStatusChange is not null and Account = '{0}'",
                                                        entity.GetFieldValue("AccountInCoding")));
                        break;
                    }
                    case "Paid": {
                        AccDocItemList = afw.uiApi.FetchEntityList("acc.AccDocItem",
                                                        String.Format("RefOp_PaidChequeStatusChange is not null and Account = '{0}'",
                                                        entity.GetFieldValue("AccountInCoding")));
                        break;
                    }
                }

                if (AccDocItemList.Entities.length > 0) {
                    has = true;
                }
            }

            return has;
        }

    });

    //Static Members:

    FormClass.TypeName = "rp.ChequeStatusChangeAccSettingEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    rp.ChequeStatusChangeAccSettingEditForm = FormClass;
})();