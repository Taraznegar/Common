(function () {
    var FormClass = afw.EntityFormBase.extend({
        GetType: function () {
            return acc.AccDocEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityFormBase.fn.init.call(that, options);

            that._IsEditableGridMode = false;
            that._NotSetDocNoValue = -1;
            that._TabControl = that.FindControl("TabControl1");
            that._TabControl.SelectTabByIndex(0);

            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._Tab1MainDockPanel = that.FindControl("Tab1MainDockPanel");
            that._MasterHeaderDockPanel1 = that.FindControl("MasterHeaderDockPanel1");
            that._DocNoTextBox = that.FindControl("DocNoTextBox");
            that._FinancialDocTypeDropDownList = that.FindControl("FinancialDocTypeOptionSetControl").FindControl("FinancialDocTypeOptionSetControl_DropDownList");
            that._OrganizationUnitLookup = that.FindControl("OrganizationUnitLookup");
            that._LastModifierUserLabel = that.FindControl("LastModifierUserLabel");
            that._IssueDateControl = that.FindControl("IssueDateFieldControl").FindControl("InnerControl");
            that._DescriptionControl = that.FindControl("DescriptionFieldControl").FindControl("InnerControl");
            that._SumDebtorLabel = that.FindControl("SumDebtorLabel");
            that._SumCreditorLabel = that.FindControl("SumCreditorLabel");
            that._RemainedLabel = that.FindControl("RemainedLabel");
            that._SaveButton = that.FindControl("SaveButton");
            that._SaveAndNewButton = that.FindControl("SaveAndNewButton");
            that._SaveAndCloseButton = that.FindControl("SaveAndCloseButton");
            that._SaveAndPrintButton = that.FindControl("SaveAndPrintButton");
            that._DocKindTextBox = that.FindControl("DocKindTextBox");
            that._FinalNumberLabel = that.FindControl("FinalNumberLabel");
            that._FinalNumberValueLabel = that.FindControl("FinalNumberValueLabel");
            that._DocStatusOptionSetControl = that.FindControl("DocStatusOptionSetControl");

            that._LastModifierUserLabel.SetVisible(false);

            that._DocNoTextBox.bind("KeyPressed", function (e) { that._DocNoTextBox_KeyPressed(e); });
            that._DescriptionControl.bind("KeyPressed", function (e) { that._DescriptionControl_KeyPressed(e); });
            that._FinancialDocTypeDropDownList.bind("KeyPressed", function (e) { that._FinancialDocTypeDropDownList_KeyPressed(e); });
            that._OrganizationUnitLookup.GetDropDownList().bind("KeyPressed", function (e) { that._OrganizationUnitLookup_KeyPressed(e); });

            that._DocStatusOptionSetControl.bind("ValueChanged", function (e) { that._DocStatusOptionSetControl_ValueChanged(e); });
            that._OrganizationUnitLookup.bind("ValueChanged", function (e) { that._OrganizationUnitLookup_ValueChanged(e); });
            that._FinancialDocTypeDropDownList.bind("ValueChanged", function (e) { that._FinancialDocTypeDropDownList_ValueChanged(e); });

            that._StoredDocNo = null;

            that._DocStatus_NotCheckedID = afw.OptionSetHelper.GetOptionSetItemID("acc.DocStatus.NotChecked");
            that._DocStatus_CheckedID = afw.OptionSetHelper.GetOptionSetItemID("acc.DocStatus.Checked");
            that._DocStatus_ApprovedID = afw.OptionSetHelper.GetOptionSetItemID("acc.DocStatus.Approved");
            that._DocStatus_FinalID = afw.OptionSetHelper.GetOptionSetItemID("acc.DocStatus.Final");

            that._DebtorID = afw.OptionSetHelper.GetOptionSetItemID("acc.BalanceStatus.Debtor");
            that._CreditorID = afw.OptionSetHelper.GetOptionSetItemID("acc.BalanceStatus.Creditor");
            that._BalanceID = afw.OptionSetHelper.GetOptionSetItemID("acc.BalanceStatus.Balance");

            that._EntityFormBaseVDockPanel = that.FindControl("EntityFormBaseVDockPanel1");
            that._EntityFormBaseVDockPanel.SetPaneSizeSetting(0, 1);//hide toolbar

            that._SaveButton.bind("Click", function (e) { that._SaveButton_Click(e); });
            that._SaveAndNewButton.bind("Click", function (e) { that._SaveAndNewButton_Click(e); });
            that._SaveAndCloseButton.bind("Click", function (e) { that._SaveAndCloseButton_Click(e); });
            that._SaveAndPrintButton.bind("Click", function (e) { that._SaveAndPrintButton_Click(e); });

            that.ItemsEntityList = null;

            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();
            that._ActiveFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();

            that._OldDocStatus = that._BindableEntity.get("DocStatus");

            if (ValueIsEmpty(that._BindableEntity.get("FinalNumber"))) {
                //that._MasterHeaderDockPanel1.SetPaneSizeSetting(1, 1);//hide FinalNumber
                that._FinalNumberLabel.SetVisible(false);
                that._FinalNumberValueLabel.SetVisible(false);
            }

            if (that._FormMode == "New") {
                that._TabControl.SetTabEnabled(1, false);

                if (that._IsEditableGridMode) {
                    that.ItemsEntityList = afw.uiApi.CreateEntityList("acc.AccDocItem");
                    that._BindableEntity._Entity.SetFieldValue("AccDocItems", that.ItemsEntityList);
                }

                that._BindableEntity.set("FinancialYear", that._ActiveFinancialYearID);
                that._BindableEntity.set("DocStatus", that._DocStatus_NotCheckedID);
                that._BindableEntity.set("IsTransferred", false);

                that._IssueDateControl.SetValue(afw.DateTimeHelper.GetServerDateTime().split(' ')[0]);

                var composeDocKind = afw.uiApi.FetchEntity("acc.DocKind", "Name = 'ComposeDoc'");
                that._BindableEntity.set("DocKind", composeDocKind.GetFieldValue("ID"));
                that._DocKindTextBox.SetValue(composeDocKind.GetFieldValue("Title"));

                that._BindableEntity.set("DocNo", that._NotSetDocNoValue);
            }
            else if (that._FormMode == "Edit")
                that._InitForEdit();

            if (that._IsEditableGridMode) {
                that._CreateItemsGrid();
                that._ItemsGridControl.AddEmptyItems(1);
                that._ItemsGridControl.LastSelectedRowIndex = 0;
            }
            else {
                that._CreateItemsDataList();
                
                if (that._FormMode == "Edit") {
                    that.SetFormSummaryFields();
                }
            }

            that._FormHasUnsavedChanges = true;

            that._DialogResult = "";
        },

        _AccDocItemEntitiesGridView_SelectedRowsChanged: function (e) {
            var that = this;

            //بررسی شده است. محددا بررسی نشود
            if (that._AccDocItemEntitiesGridView.GetDataSource().data().length > 0
                && !ValueIsEmpty(that._AccDocItemForm))
                that._AccDocItemForm.CloseForm();
        },

        _FinancialDocTypeDropDownList_ValueChanged: function (e) {
            var that = this;

            that._BindableEntity.set("FinancialDocType", that._FinancialDocTypeDropDownList.GetValue());
            that._SetBindableEntityFinancialGroup();
        },

        _DocStatusOptionSetControl_ValueChanged: function (e) {
            var that = this;

            if (that._DocStatusOptionSetControl.GetValue() == that._DocStatus_ApprovedID) {
                that._MainDockPanel.SetPaneSizeSetting(2, 50);
                that._SaveAndCloseButton.SetVisible(true);
            }
            else
                that._AdjustForm();
        },
        
        _OrganizationUnitLookup_ValueChanged: function (e) {
            var that = this;

            that._BindableEntity.set("OrganizationUnit", that._OrganizationUnitLookup.GetValue());
            that._SetBindableEntityFinancialGroup();
        },

        _FinancialDocTypeDropDownList_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                if (that.FormIsReadOnly())
                    return;

                if (ValueIsEmpty(that._OrganizationUnitLookup.GetValue()))
                    that._OrganizationUnitLookup.Focus();

                that._OpenNewAccDocItemForm();
            }
        },

        _OrganizationUnitLookup_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                if (that.FormIsReadOnly())
                    return;

                if (ValueIsEmpty(that._FinancialDocTypeDropDownList.GetValue()))
                    that._FinancialDocTypeDropDownList.Focus();

                that._OpenNewAccDocItemForm();
            }
        },

        _AccDocItemEntitiesGridView_RowKeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                if (that.FormIsReadOnly())
                    return;

                that._OpenNewAccDocItemForm();
            }
        },

        _ItemsDataListControl_DataLoaded: function (e) {
            var that = this;

            if (that._AccDocItemEntitiesGridView.GetDataSource().data().length > 0) {
                that._AccDocItemEntitiesGridView.SelectRowByIndex(0);
                that._AccDocItemEntitiesGridView.Focus();
            }
        },

        FormIsReadOnly: function () {
            var that = this;

            if (that._BindableEntity.get("IsAutoGenerated") || !ValueIsEmpty(that._BindableEntity.get("FinalNumber")))
                return true;
            else
                return false;
        },

        CreateAccDocItemForm: function (accDocEditForm, accDocItemEntity, formMode) {
            var that = this;

            that._DataListDockPanel.SetPaneSizeSetting(1, 220);

            if (that._DataListDockPanel.Panes[1].HasChildControls) {
                that._DataListDockPanel.Panes[1].ChildControls[0].Destroy()
            }

            that._AccDocItemForm = new acc.AccDocItemForm({
                Name: "AccDocItemForm",
                ParentControl: that._DataListDockPanel.Panes[1],
                AccDocEditForm: accDocEditForm,
                AccDocItemEntity: accDocItemEntity,
                FormMode: formMode
            });

            that._AccDocItemForm.GetControl("AccountLookupControl").Focus();           
        },

        _InitForEdit: function () {
            var that = this;

            var docKind = afw.uiApi.FetchEntityByID("acc.DocKind", that._BindableEntity.get("DocKind"));
            that._DocKindTextBox.SetValue(docKind.GetFieldValue("Title"));

            that._StoredDocNo = that._BindableEntity.get("DocNo");
            that._DocNoTextBox.SetText(that._StoredDocNo);

            var lastModifierUser = that._BindableEntity.get("LastModifierUser");
            var userName = "";
            if (lastModifierUser != null) {
                var systemUser = afw.uiApi.FetchEntity("afw.SystemUser", String.Format("ID = '{0}'", lastModifierUser));
                if (systemUser.GetFieldValue("Name") != null)
                    userName = systemUser.GetFieldValue("Name");
                else
                    userName = systemUser.GetFieldValue("UserName")

                that._LastModifierUserLabel.SetVisible(true);
                that._LastModifierUserLabel.SetText("کاربر ویرایش کننده : " + userName);
            }

            if (that._IsEditableGridMode) {
                that.ItemsEntityList = afw.uiApi.FetchEntityList("acc.AccDocItem", String.Format("AccDoc = '{0}'", that._BindableEntity.get("ID")), "RowNo");
                that._BindableEntity._Entity.AddField("AccDocItems", that.ItemsEntityList);
            }
        },

        _SetBindableEntityFinancialGroup: function () {
            var that = this;

            try {
                if (ValueIsEmpty(that._BindableEntity.get("OrganizationUnit"))) {
                    that._OrganizationUnitLookup.Focus();
                    that._BindableEntity.set("FinancialGroup", null);
                    return;
                }
                else if (ValueIsEmpty(that._BindableEntity.get("FinancialDocType"))) {
                    that._FinancialDocTypeDropDownList.Focus();
                    that._BindableEntity.set("FinancialGroup", null);
                    return;
                }

                var financialGroupEntity = cmn.GetFinancialGroupEntity(
                    that._BindableEntity.get("OrganizationUnit"),
                    that._BindableEntity.get("FinancialYear"),
                    that._BindableEntity.get("FinancialDocType"));

                if (financialGroupEntity != null)
                    that._BindableEntity.set("FinancialGroup", financialGroupEntity.GetFieldValue("ID"));
                else
                    that._BindableEntity.set("FinancialGroup", null);
            }
            catch (ex) {
                that._BindableEntity.set("FinancialGroup", null);
                var errorDialog = afw.ErrorDialog.Show(ex);
                errorDialog.bind("Closed", function (e) { that._FinancialDocTypeDropDownList.Focus(); });
            }
        },

        _CreateItemsGrid: function () {
            var that = this;

            that._ItemsGridControl = new acc.AccDocItemsGridControl({
                ParentControl: that._Tab1MainDockPanel.Panes[2],
                Name: "ItemsGridControl",
                AccDocEditForm: that,
                RowsEntityList: that.ItemsEntityList,
                FillParent: false
            });

            for (var i = 0; i < that.ItemsEntityList.Entities.length; i++) {
                that._ItemsGridControl.AddRow(that.ItemsEntityList.Entities[i]);
            }
        },

        _CreateItemsDataList: function () {
            var that = this;

            if (!ValueIsEmpty(that._DataListDockPanel))
                that._DataListDockPanel.Destroy();

            that._DataListDockPanel = new afw.DockPanel({
                ParentControl: that._Tab1MainDockPanel.Panes[2],
                Name: "DataListDockPanel",
                Orientation: "Vertical",
                PanesCount: 2,
                FillParent: true,
                Visible: true
            });

            that._DataListDockPanel.SetPaneSizeSetting(1, 1);

            that._ItemsDataListControl = new afw.uiApi.CreateDataListControl("acc.AccDocOneItems", {
                ParentControl: that._DataListDockPanel.Panes[0],
                BaseFilterExpression: String.Format("AccDoc = '{0}'", that._BindableEntity.get("ID")),
                AccDocEditForm: that,
                FillParent: true
            });

            that._ItemsDataListControl.SetRowDoubleClickHandler(function (e) { });

            that._AccDocItemEntitiesGridView = that._ItemsDataListControl.GetEntitiesGridView();
            that._AccDocItemEntitiesGridView.bind("SelectedRowsChanged", function (e) { that._AccDocItemEntitiesGridView_SelectedRowsChanged(e); });
            that._AccDocItemEntitiesGridView.bind("RowKeyPressed", function (e) { that._AccDocItemEntitiesGridView_RowKeyPressed(e); });
            that._ItemsDataListControl.bind("DataLoaded", function (e) { that._ItemsDataListControl_DataLoaded(e); });
        },

        _DocNoTextBox_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                setTimeout(
                    function () {
                        var docNo = that._DocNoTextBox.GetValue();
                        if (!ValueIsEmpty(docNo)) {
                            if (ValueIsEmpty(that._BindableEntity.get("FinancialDocType"))) {
                                var errorDialog = afw.ErrorDialog.Show("نوع سند مالی تعیین نشده است.");

                                errorDialog.bind("Closed", function (e) { that._FinancialDocTypeDropDownList.Focus(); });
                                return;
                            }

                            var foundAccDocEntity = afw.uiApi.FetchEntity("acc.AccDoc",
                                String.Format("FinancialYear = '{0}' and FinancialDocType = '{1}' and DocNo = {2}",
                                    that._ActiveFinancialYearID, that._BindableEntity.get("FinancialDocType"), docNo));

                            if (foundAccDocEntity != null && foundAccDocEntity.GetFieldValue("ID") != that._BindableEntity.get("ID")) {
                                foundAccDocEntity.ChangeStatus = "Modify";

                                if (cmn.OpenWindowExists())
                                    afw.EntityHelper.OpenEntityFormInWindow(foundAccDocEntity, "acc.AccDocEditForm", "Edit");
                                else
                                    afw.EntityHelper.OpenEntityFormInMdiContainer(foundAccDocEntity, "acc.AccDocEditForm", "Edit");                               
                            }
                            else {
                                var errorDialog = afw.ErrorDialog.Show(String.Format("سندی با شماره {0} یافت نشد.", docNo));
                                that._DocNoTextBox.SetText(that._StoredDocNo);
                                return;
                            }
                        }

                        that._DocNoTextBox.SetText(that._StoredDocNo);
                    }, 500);
            }
        },

        _DescriptionControl_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter")
                that._SaveAndCloseButton.Focus();
        },

        GetBindableEntity: function () {
            var that = this;

            return that._BindableEntity;
        },

        _OnOpening: function () {
            var that = this;

            afw.EntityFormBase.fn._OnOpening.call(that);

            if (that.GetContainerWindow() != null)
                that.GetContainerWindow().Center();
        },

        _OnOpened: function () {
            var that = this;

            afw.EntityFormBase.fn._OnOpened.call(that);

            if (!ValueIsEmpty(that._ItemsGridControl)) {
                setTimeout(function () {
                    if (that._ItemsGridControl.GetRowsCount() != 0)
                        if (that._FormMode == "New")
                            that._ItemsGridControl.GetRowByIndex(0).Focus();
                        else {
                            var lastRowIndex = that._ItemsGridControl.GetRowsCount() - 1;
                            that._ItemsGridControl.GetRowByIndex(lastRowIndex).Focus();

                            that.SetFormSummaryFields();
                        }
                }, 500);
            }

            if (that._ActiveFinancialYearID == null) {
                afw.ErrorDialog.Show("سال مالی فعال تعیین نشده است.");
                that.Close();
                return;
            }

            if (that._FormMode == "Edit") {
                that._OrganizationUnitLookup.SetReadOnly(true);
                that._FinancialDocTypeDropDownList.SetReadOnly(true);
            }
            setTimeout(function () { that._FinancialDocTypeDropDownList.Focus() }, 1000);
        },

        _OpenNewAccDocItemForm: function () {
            var that = this;

            var accDocItemEntity = afw.uiApi.CreateNewEntity("acc.AccDocItem");

            var lastRowNo = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue",
                ["RowNo", "acc_AccDocItems", String.Format("AccDoc = '{0}'", that._BindableEntity.get("ID"))]);

            accDocItemEntity.SetFieldValue("AccDoc", that._BindableEntity.get("ID"));
            accDocItemEntity.SetFieldValue("RowNo", lastRowNo + 1);

            that.CreateAccDocItemForm(that, accDocItemEntity, "New");
        },

        _OnClosed: function () {
            var that = this;

            afw.EntityFormBase.fn._OnClosed.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityFormBase.fn._OnToolbarButtonClicked.call(that, buttonKey);

        },

        _SaveButton_Click: function (e) {
            var that = this;

            that._Save(null);
        },

        _SaveAndCloseButton_Click: function (e) {
            var that = this;

            that._Save("CloseForm");
        },

        _SaveAndNewButton_Click: function (e) {
            var that = this;

            that._Save("OpenNewForm");
        },

        _SaveAndPrintButton_Click: function (e) {
            var that = this;

            that._Save("PrintForm");
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityFormBase.fn._AdjustForm.call(that);

            if (that.FormIsReadOnly()) {
                that._MainDockPanel.SetPaneSizeSetting(2, 1);
                //that._DocNoTextBox.SetReadOnly(true);
                that._IssueDateControl.SetReadOnly(true);
                that._FinancialDocTypeDropDownList.SetReadOnly(true);
                that._SaveButton.SetVisible(false);
                that._SaveAndCloseButton.SetVisible(false);
                that._SaveAndNewButton.SetVisible(false);

                if (that._DocStatusOptionSetControl.GetValue() == that._DocStatus_ApprovedID)
                    that._DocStatusOptionSetControl.SetReadOnly(true);
            }
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityFormBase.fn._ValidateForm.call(that))
                return false;

            return true;
        },

        SetFormSummaryFields: function () {
            var that = this;

            if (!ValueIsEmpty(that._ItemsGridControl))
                that._CalculateSummaryFieldsFromGrid();
            else
                that.CalculateSummaryFieldsFromServer();

            that._SumDebtorLabel.SetText("جمع بدهکار : " + afw.BaseUtils.FormatNumber(that._SumDebtorAmount));
            that._SumCreditorLabel.SetText("جمع بستانکار : " + afw.BaseUtils.FormatNumber(that._SumCreditorAmount));
            var reminded = that._SumDebtorAmount - that._SumCreditorAmount;

            if (reminded > 0)
                that._RemainedLabel.SetText("مانده : " + afw.BaseUtils.FormatNumber(reminded) + " بد ");
            else if (reminded < 0)
                that._RemainedLabel.SetText("مانده : (" + afw.BaseUtils.FormatNumber(reminded * -1) + ") بس ");
            else if (reminded == 0)
                that._RemainedLabel.SetText("مانده : 0");
        },

        _CalculateSummaryFieldsFromGrid: function () {
            var that = this;

            that._ItemCount = that._ItemsGridControl.GetRowsCount();
            that._SumDebtorAmount = 0, that._SumCreditorAmount = 0;

            for (var i = 0; i < that._ItemCount; i++) {
                var item = that._ItemsGridControl.GetRowByIndex(i);
                that._SumDebtorAmount += item._BindableEntity.get("DebtorAmount");
                that._SumCreditorAmount += item._BindableEntity.get("CreditorAmount");
            }
        },

        CalculateSummaryFieldsFromServer: function () {
            var that = this;

            that._SumDebtorAmount = 0, that._SumCreditorAmount = 0;

            var debtorAndCreditorSum = afw.uiApi.CallServerMethodSync("acc.GetDebtorAndCreditorSum",
                [that._BindableEntity.get("ID")]);
            if (!ValueIsEmpty(debtorAndCreditorSum)) {
                that._SumDebtorAmount = debtorAndCreditorSum.GetFieldValue("DebtorAmountSum");
                that._SumCreditorAmount = debtorAndCreditorSum.GetFieldValue("CreditorAmountSum");
            }

        },

        _SetEntitiesChangeStatusToNone: function () {
            var that = this;

            that._BindableEntity._Entity.ChangeStatus = "None";

            if (that._IsEditableGridMode) {
                for (var i = 0; i < that._BindableEntity.get("AccDocItems").Entities.length; i++) {
                    if (!ValueIsEmpty(that.ItemsEntityList.Entities[i].GetFieldValue("Account")))
                        that.ItemsEntityList.Entities[i].ChangeStatus = "None";
                }
            }
        },

        _Save: function (afterSaveAction) {
            var that = this;

            if (that._AccDocItemForm != null && !that._AccDocItemForm.IsDestroying)
                that._AccDocItemForm.Save();

            if (afw.uiApi.GetEntityCount("acc.AccDocItem", String.Format("AccDoc = '{0}'", that._BindableEntity.get("ID"))) == 0) {
                var errorDialog =  afw.ErrorDialog.Show("سند بدون آیتم قابل ثبت نیست.");

                errorDialog.bind("Closed", function (e) { that._FinancialDocTypeDropDownList.Focus(); });
                return;
            }

            var docEntity = that._BindableEntity.GetEntity();
            var startDate = afw.DateTimeHelper.ToTenCharactersDateFormat(that._ActiveFinancialYearEntity.GetFieldValue("StartDate"));
            var endDate = afw.DateTimeHelper.ToTenCharactersDateFormat(that._ActiveFinancialYearEntity.GetFieldValue("EndDate"));
            var issueDate = afw.DateTimeHelper.ToTenCharactersDateFormat(docEntity.GetFieldValue("IssueDate"));

            if (docEntity.GetFieldValue("IsAutoGenerated") == true && that._DocStatusOptionSetControl.GetValue() != that._DocStatus_ApprovedID) {
                var messageDialog = afw.MessageDialog.Show("امکان تغییر سند اتوماتیک وجود ندارد.");

                messageDialog.bind("Closed", function (e) { that._FinancialDocTypeDropDownList.Focus(); });
                return;
            }

            if (!(issueDate >= startDate && issueDate <= endDate)) {
                var messageDialog = afw.MessageDialog.Show("تاریخ صدور سند خارج از محدوده سال مالی است.");

                messageDialog.bind("Closed", function (e) { that._IssueDateControl.Focus(); });
                return;
            }

            if (that._FinancialDocTypeDropDownList.GetValue() == null) {
                var messageDialog = afw.MessageDialog.Show("نوع سند مالی را انتخاب نمایید.");

                messageDialog.bind("Closed", function (e) { that._FinancialDocTypeDropDownList.Focus(); });
                return;
            }

            if (that._OrganizationUnitLookup.GetValue() == null) {
                var messageDialog = afw.MessageDialog.Show("واحد سازمانی را انتخاب نمایید.");

                messageDialog.bind("Closed", function (e) { that._OrganizationUnitLookup.Focus(); });
                return;
            }

            if (!ValueIsEmpty(that._ItemsGridControl)) {
                that._ItemCount = that._ItemsGridControl.GetRowsCount();

                for (var i = 0; i < that._ItemCount; i++) {
                    var item = that._ItemsGridControl.GetRowByIndex(i);

                    if (item._BindableEntity.get("Account") == null && ((item._BindableEntity.get("DebtorAmount") == null) || (item._BindableEntity.get("CreditorAmount") == null))) {
                        if (that._ItemCount == 1)
                            return;
                    }
                    else if (item._BindableEntity.get("Account") != null && ((item._BindableEntity.get("DebtorAmount") == null) || (item._BindableEntity.get("CreditorAmount") == null))) {
                        var messageDialog = afw.MessageDialog.Show(" در ردیف " + item._BindableEntity.get("RowNo") + " مبلغ وارد نشده است.");

                        messageDialog.bind("Closed", function (e) { that._AccDocItemForm.GetControl("DebtorAmountTextBox").Focus(); });
                        return;
                    }
                    else if (item._BindableEntity.get("Account") == null && ((item._BindableEntity.get("DebtorAmount") != null) || (item._BindableEntity.get("CreditorAmount") != null))) {
                        var messageDialog = afw.MessageDialog.Show(" در ردیف " + item._BindableEntity.get("RowNo") + " مبلغ وارد شده اما حساب انتخاب نشده است.");

                        messageDialog.bind("Closed", function (e) { that._AccDocItemForm.GetControl("AccountLookupControl").Focus(); });
                        return;
                    }
                    else if (item._BindableEntity.get("Account") != null) {
                        if (acc.AccountHasFloat(item._BindableEntity.get("Account"), null)) {
                            var floatPriorityEntity = afw.uiApi.FetchEntity("cmn.FloatPriority", String.Format("Account = '{0}'", account));
                            var personPriority = floatPriorityEntity.GetFieldValue("PersonPriority");
                            var costCenterPriority = floatPriorityEntity.GetFieldValue("CostCenterPriority");
                            var projectPriority = floatPriorityEntity.GetFieldValue("ProjectPriority");
                            var ForeignCurrencyPriority = floatPriorityEntity.GetFieldValue("ForeignCurrencyPriority");

                            if (item._BindableEntity.get("Person") == null && !(personPriority == null || personPriority == 0)) {
                                var messageDialog = afw.MessageDialog.Show(" در ردیف " + item._BindableEntity.get("RowNo") + " مقدار فیلد شخص وارد نشده است.");

                                messageDialog.bind("Closed", function (e) { that._AccDocItemForm.GetControl("PersonLookupControl").Focus(); });
                                return;
                            }
                            else if (item._BindableEntity.get("CostCenter") == null && !(costCenterPriority == null || costCenterPriority == 0)) {
                                var messageDialog = afw.MessageDialog.Show(" در ردیف " + item._BindableEntity.get("RowNo") + " مقدار فیلد هزینه وارد نشده است.");

                                messageDialog.bind("Closed", function (e) { that._AccDocItemForm.GetControl("CostCenterLookupControl").Focus(); });
                                return;
                            }
                            else if (item._BindableEntity.get("Project") == null && !(projectPriority == null || projectPriority == 0)) {
                                var messageDialog = afw.MessageDialog.Show(" در ردیف " + item._BindableEntity.get("RowNo") + " مقدار فیلد پروژه وارد نشده است.");

                                messageDialog.bind("Closed", function (e) { that._AccDocItemForm.GetControl("ProjectLookupControl").Focus(); });
                                return;
                            }
                            else if (item._BindableEntity.get("ForeignCurrency") == null && !(ForeignCurrencyPriority == null || ForeignCurrencyPriority == 0)) {
                                var messageDialog = afw.MessageDialog.Show(" در ردیف " + item._BindableEntity.get("RowNo") + " مقدار فیلد ارز را وارد نشده است.");

                                messageDialog.bind("Closed", function (e) { that._AccDocItemForm.GetControl("ForeignCurrencyLookupControl").Focus(); });
                                return;
                            }
                        }
                    }
                }
            }

            that.SetFormSummaryFields();

            if (that._SumDebtorAmount > that._SumCreditorAmount) {
                that._BindableEntity.set("BalanceStatus", that._DebtorID);
                that._BindableEntity.set("RemainingAmount", that._SumDebtorAmount - that._SumCreditorAmount);
            }
            else if (that._SumDebtorAmount < that._SumCreditorAmount) {
                that._BindableEntity.set("BalanceStatus", that._CreditorID);
                that._BindableEntity.set("RemainingAmount", that._SumDebtorAmount - that._SumCreditorAmount);
            }
            else {
                that._BindableEntity.set("BalanceStatus", that._BalanceID);
                that._BindableEntity.set("RemainingAmount", 0);
            }

            var balanceStatus = that._BindableEntity.get("BalanceStatus");

            if (balanceStatus == that._BalanceID) {
                if (that.GetDocStatusID() != that._DocStatus_NotCheckedID) //وضعیت غیر از تنظیم نشده
                    that._DoSave(afterSaveAction);
                else {//وضعیت تنظیم نشده
                    if (that._FormMode == "New") {
                        that._BindableEntity.set("DocStatus", that._DocStatus_CheckedID);
                        that._DoSave(afterSaveAction);
                    }
                    else if (that._FormMode == "Edit") {
                        var confirmDialog = afw.ConfirmDialog.Show("آیا با تغییر وضعیت سند به 'تنظیم شده' موافقید؟");

                        confirmDialog.bind("Opened", function (e) {
                            e.Sender.FindControl("Button1").Focus(); //focus on yes
                        });

                        confirmDialog.bind("Closed", function (e) {
                            if (confirmDialog.GetDialogResult() == "Yes") {
                                that._BindableEntity.set("DocStatus", that._DocStatus_CheckedID);
                                that._DoSave(afterSaveAction);
                            }
                            else
                                that._DoSave(afterSaveAction);
                        });
                    }
                }
            }
            else if (balanceStatus != that._BalanceID) {
                that._BindableEntity.set("DocStatus", that._DocStatus_NotCheckedID);
                that._DoSave(afterSaveAction);

                if (that._OldDocStatus != that._DocStatus_NotCheckedID)
                    afw.MessageDialog.Show("سند بالانس نیست. وضعیت سند به تنظیم نشده تغییر یافت.");
            }
        },

        _DoSave: function (afterSaveAction) {
            var that = this;

            if (that.GetDocStatusID() == that._DocStatus_NotCheckedID)
                that._BindableEntity.set("IsActive", false);
            else
                that._BindableEntity.set("IsActive", true);

            var saved = afw.EntityFormBase.fn._Save.call(that);

            if (saved) {
                that._SetEntitiesChangeStatusToNone();

                if (afterSaveAction == "CloseForm") {
                    that.Close();
                }
                else if (afterSaveAction == "OpenNewForm") {
                    that.Close();
                    var accDocEntity = afw.uiApi.CreateNewEntity("acc.AccDoc");
                    afw.EntityHelper.OpenEntityFormInMdiContainer(accDocEntity, "acc.AccDocEditForm", "New");
                }
                else if (afterSaveAction == "PrintForm") {
                    if (that._BindableEntity.get("DocStatus") == that._DocStatus_CheckedID)
                        that._PrintAccDoc();
                    else {
                        afw.MessageDialog.Show("فقط اسناد تنظیم شده را میتوان چاپ کرد.");
                        that.Close();
                    }
                }
                else {
                    that._TabControl.SetTabEnabled(1, true);

                    that._FormMode = "Edit";
                    that._BindableEntity.GetEntity().ChangeStatus = "Modify";
                    that.GetDocReferenceNoFromServer();
                }
            }

            return saved;
        },

        GetDocReferenceNoFromServer: function () {
            var that = this;

            var fetchedDoc = afw.uiApi.FetchEntityByID("acc.AccDoc", that._BindableEntity.get("ID"));
            that._StoredDocNo = fetchedDoc.GetFieldValue("DocNo")
            that._BindableEntity.set("DocNo", that._StoredDocNo);
            that._DocNoTextBox.SetText(that._StoredDocNo);
        },

        GetDocStatusID: function () {
            var that = this;

            return that._BindableEntity.get("DocStatus");
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            if (e.Key == "Escape") {
                e.Handled = true;
                that._OpenBeforeExitPopupWindow();
            }
            else if (e.Key == "F6" && e.CtrlKey) {
                e.Handled = true;
                that._ShowShenavarhaReport();
            }
            else if (e.Key == "F7" && !e.CtrlKey) {
                e.Handled = true;

                if (that._AccDocItemForm != null &&
                        (that._AccDocItemForm.GetControl("DebtorAmountTextBox").HasFocus() ||
                            that._AccDocItemForm.GetControl("CreditorAmountTextBox").HasFocus()
                        )
                    )
                    that._SetDocRemainingAmountToCurrentItem();
            }
        },

        _SetDocRemainingAmountToCurrentItem: function () {
            //ست کردن مبلغ مانده سند به آرتیکل در حال ویرایش
            var that = this;

            if (that._AccDocItemForm == null)
                throw "AccDocItemForm is null";

            var remainedAmount = that._SumDebtorAmount - that._SumCreditorAmount;

            if (remainedAmount > 0)
                that._AccDocItemForm.GetControl("CreditorAmountTextBox").SetValue(remainedAmount);
            else if (remainedAmount < 0)
                that._AccDocItemForm.GetControl("DebtorAmountTextBox").SetValue(remainedAmount * -1);
            else {
                that._AccDocItemForm.GetControl("CreditorAmountTextBox").SetValue(0);
                that._AccDocItemForm.GetControl("DebtorAmountTextBox").SetValue(0);
            }
        },

        _ShowShenavarhaReport: function () {
            var that = this;

            afw.uiApi.ShowProgress(that);

            var selectedRows = that._AccDocItemEntitiesGridView.GetSelectedRows();

            if (selectedRows.length != 0) {
                var shenavars = [];
                var shenavarsType = [];
                    
                if (!ValueIsEmpty(selectedRows[0].DataItem["Person"])) {
                    shenavars.push(selectedRows[0].DataItem["Person"]);
                    shenavarsType.push("Shenavar_Person");
                }
                if (!ValueIsEmpty(selectedRows[0].DataItem["CostCenter"])) {
                    shenavars.push(selectedRows[0].DataItem["CostCenter"]);
                    shenavarsType.push("Shenavar_CostCenter");
                }
                if (!ValueIsEmpty(selectedRows[0].DataItem["Project"])) {
                    shenavars.push(selectedRows[0].DataItem["Project"]);
                    shenavarsType.push("Shenavar_Project");
                }
                if (!ValueIsEmpty(selectedRows[0].DataItem["ForeignCurrency"])) {
                    shenavars.push(selectedRows[0].DataItem["ForeignCurrency"]);
                    shenavarsType.push("Shenavar_ForeignCurrency");
                }

                var shenavarhaReportWindow = new afw.Window({
                    Name: "ShenavarhaReportWindow",
                    Title: "گزارش شناورها",
                    Modal: true,
                    Width: 1200,
                    Height: 800
                });

                var shenavarhaReport = afw.uiApi.CreateSavedControl(
                    "acc.ShenavarhaReportForm",
                    {
                        Name: "ShenavarhaReportForm",
                        ParentControl: shenavarhaReportWindow,
                        Modal: true,
                        FillParent: true,
                        Account: selectedRows[0].DataItem["Account"],
                        ShenavarsType: shenavarsType,
                        Shenavars: shenavars,
                        OrganizationUnit: that._OrganizationUnitLookup.GetValue(),
                        FinancialDocType: that._FinancialDocTypeDropDownList.GetValue()
                    });

                shenavarhaReportWindow.Center();
                shenavarhaReportWindow.Open();

                afw.uiApi.HideProgress(that);
            }
        },
        
        _OpenBeforeExitPopupWindow: function () {
            var that = this;

            that._BeforeExitPopupWindow = afw.uiApi.OpenSavedFormWindow("acc.BeforeExitPopup", {
                Name: "BeforeExitPopup",
                Modal: true
            });

            that._BeforeExitPopupWindow.Center();

            that._BeforeExitPopupWindow.FindControl("SaveAndNewButton").BindEvent("Click",
                function (e) {
                   that._BeforeExitPopupWindow.Close();
                    that._SaveAndNewButton_Click(e);
                });
            that._BeforeExitPopupWindow.FindControl("SaveAndCloseButton").BindEvent("Click",
                function (e) {
                    that._BeforeExitPopupWindow.Close();
                    that._SaveAndCloseButton_Click(e);
                });
            that._BeforeExitPopupWindow.FindControl("CloseButton").BindEvent("Click",
                function (e) {
                    that._BeforeExitPopupWindow.Close();
                    that.Close();
                });

            setTimeout(function () {
                if (!ValueIsEmpty(that._BeforeExitPopupWindow))
                    that._BeforeExitPopupWindow.FindControl("SaveAndCloseButton").Focus();
            }, 1000);
        },

        _PrintAccDoc: function () {
            var that = this;

            var docNo = that._BindableEntity.get("DocNo");
            docNo = docNo.toString();

            var financialDocType = that._BindableEntity.get("FinancialDocType");
            var balanceAmount = that._SumDebtorAmount;
            var balanceAmountWords = afw.NumberHelper.NumberToPersianWords(balanceAmount) + " ريال";

            var organizationUnitID = that._BindableEntity.get("OrganizationUnit");

            var parametrNames = ["FromDocReferenceNo", "ToDocReferenceNo", "BalanceAmountWords", "OrganizationUnitID", "FinancialYear", "FinancialDocType"];
            var parametrValues = [docNo, docNo, balanceAmountWords, organizationUnitID, that._ActiveFinancialYearID, financialDocType];

            var accDocPrinTypeID = acc.GetAccConfigValue("DefaultDocPrintType");
            if (accDocPrinTypeID == null) {
                afw.MessageDialog.Show("نوع چاپ پیش فرض سند در تنظیمات تعیین نشده است.");
                return;
            }

            var accDocPrinTypeName = afw.OptionSetHelper.GetOptionSetItemName(accDocPrinTypeID);

            if (accDocPrinTypeName == "OfficialWithFloat") {
                afw.uiApi.ShowProgress(that);
                afw.ReportHelper.RunReport("acc.AccDocOfficialWithFloatReport", parametrNames, parametrValues, null,
                function (result) {
                    afw.uiApi.HideProgress(that);
                    if (result.HasError)
                        afw.ErrorDialog.Show(result.ErrorMessage);
                    else
                        that.Close();
                });
            }
            else if (accDocPrinTypeName == "OffcialWithDetailAndFloat") {
                afw.uiApi.ShowProgress(that);
                afw.ReportHelper.RunReport("acc.AccDocOfficialWithDetailAndFloatReport", parametrNames, parametrValues, null,
                    function (result) {
                        afw.uiApi.HideProgress(that);
                        if (result.HasError)
                            afw.ErrorDialog.Show(result.ErrorMessage);
                    });
            }
            else if (accDocPrinTypeName == "AccDocPrintWithOutFloat") {
                afw.uiApi.ShowProgress(that);
                afw.ReportHelper.RunReport("acc.AccDocPrintWithOutFloatReport", parametrNames, parametrValues, null,
                    function (result) {
                        afw.uiApi.HideProgress(that);
                        if (result.HasError)
                            afw.ErrorDialog.Show(result.ErrorMessage);
                    });
            }
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.AccDocEditForm";
    FormClass.BaseType = afw.EntityFormBase;


    acc.AccDocEditForm = FormClass;
})();