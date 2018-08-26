(function () {
    var FormClass = afw.EntityFormBase.extend({
        GetType: function () {
            return ps.SalesInvoiceEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityFormBase.fn.init.call(that, options);

            that._FormHasUnsavedChanges = true;

            that.ItemsEntity = null;

            that.FormMode = that._FormMode;

            that._IsValidityDaysTextBox_ValueChanged = false;
            that._IsValidityDateControl_ValueChanged = false;

            that._Saved = false;
            that._InvoiceNumberPaneIndex = 0;
            that._RequestNumberPaneIndex = 1;
            that._WorkflowStagePaneIndex = 3;
            that._ValidityPaneIndex = 2;
            that._IsSettingGeneralDiscount = false;
            that._IsSettingGeneralDiscountPercent = false;
            that._IsSettingGeneralDiscountByDiscountPercent = false;
            that._IsSettingGeneralDiscountPercentByDiscount = false;

            that.IsAmani = options.IsAmani;
            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._PayPlanItemsPanel = that.FindControl("PayPlanItemsPanel");
            that._CustomerLookupControl = that.FindControl("CustomerLookupControl");
            that._CustomerAutoComplete = that._CustomerLookupControl.GetAutoComplete();
            that._ConnectedPersonFieldControl = that.FindControl("ConnectedPersonFieldControl").FindControl("InnerControl");
            that._SalesCaseLookupControl = that.FindControl("SalesCaseLookupControl");
            that._SalesCaseAutoComplete = that._SalesCaseLookupControl.GetAutoComplete();
            that._IssueDateControl = that.FindControl("IssueDateControl");
            that._ValidityDaysTextBox = that.FindControl("ValidityDaysTextBox");
            that._ValidityDateControl = that.FindControl("ValidityDateControl");
            that._FinancialDocTypeOptionSetControl = that.FindControl("FinancialDocTypeOptionSetControl");
            that._GeneralDiscountTextBox = that.FindControl("GeneralDiscountTextBox");
            that._GeneralDiscountPercentTextBox = that.FindControl("GeneralDiscountPercentTextBox");
            that._MohlateErsalChekFieldControl = that.FindControl("MohlateErsalChekFieldControl");
            that._MohlatPardakhtFieldControl = that.FindControl("MohlatPardakhtFieldControl");
            that._MohlateErsalChekTextBox = that.FindControl("MohlateErsalChekTextBox");
            that._MohlatePardakhtTextBox = that.FindControl("MohlatePardakhtTextBox");
            that._DeliverDateTimeControl = that.FindControl("DeliverDateTimeControl");
            that._DeliverDaysTextBox = that.FindControl("DeliverDaysTextBox");
            that._InvoiceTabControl = that.FindControl("InvoiceTabControl");
            that._FinalAmountLabel = that.FindControl("FinalAmountLabel");
            that._HorizontalDockPanel1 = that.FindControl("HorizontalDockPanel1");
            that._EntityFormBaseVDockPanel = that.FindControl("EntityFormBaseVDockPanel1");
            that._RequestNumberTextBox = that.FindControl("RequestNumberTextBox");
            that._OwnerUserLookupControl = that.FindControl("OwnerUserLookupControl");
            that._WorkflowStageDropDownList = that.FindControl("WorkflowStageDropDownList");
            that._TarikheTaahodeBargashtAzAmanatDockPanel = that.FindControl("TarikheTaahodeBargashtAzAmanatDockPanel");
            that._TarikheTaahodeBargashtAzAmanatDateControl = that.FindControl("TarikheTaahodeBargashtAzAmanatFieldControl");

            that._InvoiceNumberCaptionLabel = that.FindControl("InvoiceNumberCaptionLabel");
            that._InvoiceNumberTextBox = that.FindControl("InvoiceNumberTextBox");

            that._SetEntityFormTitle();

            if ("CreateNewEdition" in options && options.CreateNewEdition) {
                that._CustomerLookupControl.SetReadOnly(true);
                that._ValidityDaysTextBox.SetValue(null);
                that._ValidityDateControl.SetValue(null);
            }

            that._AdjustDynamicTextFieldsControl();
        },

        GetBindableEntity: function () {
            var that = this;

            return that._BindableEntity;
        },

        _SetEntityFormTitle: function () {
            var that = this;

            var title = "";

            if (that._BindableEntity.get("IsProforma")) {
                title = "پیش فاکتور فروش و خدمات";
                if (that.IsAmani)
                    title = "پیش فاکتور امانت کالا به دیگران";
            }
            else {
                title = "فاکتور فروش و خدمات";
                if (that.IsAmani)
                    title = "فاکتور امانت کالا به دیگران";
            }

            if (that.FormMode == "New")
                title = title + " جدید";
            else {
                if (that.FormMode == "View")
                    title = "مشاهده " + title;
                else if (that.FormMode == "Edit")
                    title = "ویرایش " + title;
                else if (that.FormMode == "Delete")
                    title = "حذف " + title;
                else
                    throw "Invalid FormMode!";

                title += " : " + that._InvoiceNumberTextBox.GetValue();
            }

            that.SetTitle(title);
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.EntityFormBase.fn._OnOpened.call(that);
            // بدلیل جلوگیری از نمایش پیغام خطا در پشت فرم، منطق کدها از متد اینیت به این متد منتقل شده است.
            that._SalesCaseLookupControl.bind("LoadingEntityList", function (e) {
                e.Sender.SetBaseFilterExpression(String.Format("Customer = '{0}'", that._BindableEntity.get("Customer")));
            });

            if (that._BindableEntity.get("IsProforma")) {
                that._InvoiceNumberCaptionLabel.SetText("شماره پیش فاکتور");
                that._InvoiceTabControl.GetTabPageByIndex(0).SetTabItemText("پیش فاکتور فروش و خدمات");
                that._RequestNumberTextBox.SetVisible(false);
                that._HorizontalDockPanel1.SetPaneSizeSetting(that._RequestNumberPaneIndex, 1);

                if (that.IsAmani) {
                    that._BindableEntity.set("IsAmani", true);
                    that._WorkflowStageDropDownList.SetItemsDataSource(
                        cmn.GetFormAvailableWorkflowStagesAsDataSourceData("AmaniProformaInvoice", that._BindableEntity.GetEntity()));
                }
                else {
                    that._WorkflowStageDropDownList.SetItemsDataSource(
                        cmn.GetFormAvailableWorkflowStagesAsDataSourceData("SalesProformaInvoice", that._BindableEntity.GetEntity()));

                    that._TarikheTaahodeBargashtAzAmanatDockPanel.SetPaneSizeSetting(0, 1);
                    that._TarikheTaahodeBargashtAzAmanatDockPanel.SetPaneSizeSetting(1, 1);
                    that._TarikheTaahodeBargashtAzAmanatDateControl.SetVisible(false);
                }
            }
            else {
                that._InvoiceNumberCaptionLabel.SetText("شماره فاکتور");
                that._InvoiceTabControl.GetTabPageByIndex(0).SetTabItemText("فاکتور فروش و خدمات");
                that._RequestNumberTextBox.SetVisible(true);
                that._HorizontalDockPanel1.SetPaneSizeSetting(that._RequestNumberPaneIndex, 200);
                that.FindControl("HorizontalDockPanel2").SetPaneSizeSetting(that._ValidityPaneIndex, 1);

                that._WorkflowStageDropDownList.SetVisible(false);
                that._HorizontalDockPanel1.SetPaneSizeSetting(that._WorkflowStagePaneIndex, 1);

                if (that.IsAmani) {
                    that._BindableEntity.set("IsAmani", true);
                }
                else {
                    that._TarikheTaahodeBargashtAzAmanatDockPanel.SetPaneSizeSetting(0, 1);
                    that._TarikheTaahodeBargashtAzAmanatDockPanel.SetPaneSizeSetting(1, 1);
                    that._TarikheTaahodeBargashtAzAmanatDateControl.SetVisible(false);
                }
            }

            that._InvoiceTabControl.SelectTabByIndex(0);
            that._IsMohlateErsalChekTextBox_ValueChanged = false;
            that._IsMohlatePardakhtTextBox_ValueChanged = false;
            that._IsMohlateErsalChek_ValueChanged = false;
            that._IsMohlatPardakhtFieldControl_ValueChanged = false;
            that._IsDeliverDateTimeControl_ValueChanged = false;
            that._IsDeliverDaysTextBox_ValueChanged = false;

            that._CustomerLookupControl.bind("ValueChanged", function (e) { that._CustomerLookupControl_ValueChanged(e); });
            that._MohlateErsalChekTextBox.bind("ValueChanged", function (e) { that._MohlateErsalChekTextBox_ValueChanged(e); });
            that._MohlatePardakhtTextBox.bind("ValueChanged", function (e) { that._MohlatePardakhtTextBox_ValueChanged(e); });
            that._MohlateErsalChekFieldControl.bind("ValueChanged", function (e) { that._MohlateErsalChekFieldControl_ValueChanged(); });
            that._MohlatPardakhtFieldControl.bind("ValueChanged", function (e) { that._MohlatPardakhtFieldControl_ValueChanged(); });
            that._DeliverDateTimeControl.bind("ValueChanged", function (e) { that._DeliverDateTimeControl_ValueChanged(e); });
            that._DeliverDaysTextBox.bind("ValueChanged", function (e) { that._DeliverDaysTextBox_ValueChanged(e); });
            that._WorkflowStageDropDownList.bind("ValueChanged", function (e) { that._WorkflowStageDropDownList_ValueChanged(e); });

            var entity = that._BindableEntity.GetEntity();

            if (!entity.FieldExists("StuffAndServiceItems"))
                entity.AddField("StuffAndServiceItems");

            if (!entity.FieldExists("PayPlanItems"))
                entity.AddField("PayPlanItems");

            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            if (that.FormMode == "New") {
                if (that._ActiveFinancialYearID == null) {
                    afw.ErrorDialog.Show("سال مالی فعال تعیین نشده است.");
                    that.Close();
                    return;
                }

                var activeOrgUnitID = cmn.GetUserActiveOrganizationUnitIDs();
                if (activeOrgUnitID.length != 1) {
                    afw.ErrorDialog.Show("واحد سازمانی فعال انتخاب نشده است.");
                    that.Close();
                    return;
                }

                that._BindableEntity.set("OrganizationUnit", activeOrgUnitID[0]);

                if (!that._BindableEntity.get("IsProforma") && !ValueIsEmpty(that._BindableEntity.get("FinancialGroup")))
                    that._SetNewInvoiceNumber();

                that._BindableEntity.set("IssueDate", afw.DateTimeHelper.GetServerDateTime());
                that._BindableEntity.set("HavaleIssuingStatus", afw.OptionSetHelper.GetOptionSetItemID("cmn.HavaleIssuingStatus.HavaleNashodeh"));

                var activeFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
                activeFinancialYearStartDate = activeFinancialYearEntity.GetFieldValue("StartDate");
                activeFinancialYearEndDate = activeFinancialYearEntity.GetFieldValue("EndDate");

                if ((new Date(that._IssueDateControl.GetValue()).getTime() < new Date(activeFinancialYearStartDate.split(' ')[0]).getTime())
                    || (new Date(that._IssueDateControl.GetValue()).getTime() > new Date(activeFinancialYearEndDate.split(' ')[0]).getTime())) {
                    var confirmDialog = afw.ConfirmDialog.Show("سال مالی جاری فعال نیست، آیا ادامه می دهید؟.");
                    confirmDialog.bind("Closed", function (e) {
                        if (confirmDialog.GetDialogResult() != "Yes") {
                            that.Close();
                            return;
                        }
                    });
                }

                if (entity.GetFieldValue("StuffAndServiceItems") == null) {
                    var itemsEntityList = afw.uiApi.CreateEntityList("ps.SalesInvoiceItem");
                    entity.SetFieldValue("StuffAndServiceItems", itemsEntityList);
                }

                if (entity.GetFieldValue("PayPlanItems") == null) {
                    var itemsEntityList = afw.uiApi.CreateEntityList("ps.SalesInvoicePayPlanItem");
                    entity.SetFieldValue("PayPlanItems", itemsEntityList);
                }

                that._BindableEntity.set("FinancialYear", that._ActiveFinancialYearID);

                that._OwnerUserLookupControl.SetValue(afw.App.CurrentUserID);

                that._ConnectedPersonFieldControl.SetBaseFilterExpression("1 = 2");

                if (that._BindableEntity.get("IsProforma")) {
                    that._InvoiceNumberCaptionLabel.SetVisible(false);
                    that._InvoiceNumberTextBox.SetVisible(false);
                    that._HorizontalDockPanel1.SetPaneSizeSetting(that._InvoiceNumberPaneIndex, 1);

                    if (that.IsAmani)
                        that._WorkflowStageDropDownList.SetValue(cmn.TryGetFirstWorkflowStageID("AmaniProformaInvoice"));
                    else
                        that._WorkflowStageDropDownList.SetValue(cmn.TryGetFirstWorkflowStageID("SalesProformaInvoice"));
                }
                else {
                    that._RequestNumberTextBox.SetValue(afw.uiApi.CallServerMethodSync("ps.GetMaxRequestNumber", [that._BindableEntity.get("OrganizationUnit")]));
                }
            }
            else {
                if (entity.GetFieldValue("StuffAndServiceItems") == null) {
                    var itemsEntityList = afw.uiApi.FetchEntityList("ps.SalesInvoiceItem",
                                              String.Format("SalesInvoice = '{0}'", that._BindableEntity.get("ID")), "RowNumber ");

                    entity.SetFieldValue("StuffAndServiceItems", itemsEntityList);
                }

                if (entity.GetFieldValue("PayPlanItems") == null) {
                    var itemsEntityList = afw.uiApi.FetchEntityList("ps.SalesInvoicePayPlanItem",
                                             String.Format("SalesInvoice = '{0}'", that._BindableEntity.get("ID")), "RowNumber");

                    entity.SetFieldValue("PayPlanItems", itemsEntityList);
                }

                if (that._BindableEntity.get("IsProforma")) {
                    that._InvoiceNumberTextBox.SetReadOnly(true);
                }

                that._InvoiceNumberTextBox.SetReadOnly(true);

                if (that._ShouldDisplayRequestNumber() && that._BindableEntity.get("RequestNumber") == null)
                    that._RequestNumberTextBox.SetValue(afw.uiApi.CallServerMethodSync("ps.GetMaxRequestNumber", [that._BindableEntity.get("OrganizationUnit")]));
            }

            if (that._CustomerLookupControl.GetValue() != null)
                that._ConnectedPersonFieldControl.SetBaseFilterExpression(String.Format("ParentPerson = '{0}'", that._CustomerLookupControl.GetValue()));

            that._MohlateErsalChekFieldControl_ValueChanged();
            that._MohlatPardakhtFieldControl_ValueChanged();
            that._ValidityDateControl_ValueChanged();

            that.ItemsEntityList = entity.GetFieldValue("StuffAndServiceItems");

            that.PayPlanItemsEntityList = entity.GetFieldValue("PayPlanItems");

            that._ItemsGridControl = new ps.SalesInvoiceItemsGridControl({
                ParentControl: that._MainDockPanel.Panes[2],
                Name: "ItemsGridControl",
                SalesInvoiceEditForm: that,
                FillParent: false
            });

            that._PayPlanItemsGridControl = new ps.SalesInvoicePayPlanItemsGridControl({
                ParentControl: that._PayPlanItemsPanel,
                Name: "PayPlanItemsGridControl",
                SalesInvoiceEditForm: that,
                FillParent: true
            });

            //Load Items Data
            if (that.ItemsEntityList.Entities.length == 0)
                that._ItemsGridControl.AddEmptyItems(1);
            else {
                for (var i = 0; i < that.ItemsEntityList.Entities.length; i++) {
                    that._ItemsGridControl.AddRow(that.ItemsEntityList.Entities[i]);
                }
            }

            //Load Pay Plan Items Data
            if (that.PayPlanItemsEntityList.Entities.length == 0)
                that._PayPlanItemsGridControl.AddEmptyItems(1);
            else {
                for (var i = 0; i < that.PayPlanItemsEntityList.Entities.length; i++) {
                    that._PayPlanItemsGridControl.AddRow(that.PayPlanItemsEntityList.Entities[i]);
                }
            }

            that._CustomerAutoComplete.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._SalesCaseAutoComplete.Focus();
                }
            });

            that._SalesCaseAutoComplete.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    if (that._ItemsGridControl.GetRowsCount() != 0)
                        that._ItemsGridControl.GetRowByIndex(0).Focus();
                }
            });

            that._FinancialDocTypeOptionSetControl.bind("ValueChanged", function (e) { that._FinancialDocTypeOptionSetControl_ValueChanged(e); });
            that._IssueDateControl.bind("ValueChanged", function (e) { that._IssueDateControl_ValueChanged(e); });
            that._ValidityDaysTextBox.bind("ValueChanged", function (e) { that._ValidityDaysTextBox_ValueChanged(e); });
            that._ValidityDateControl.bind("ValueChanged", function (e) { that._ValidityDateControl_ValueChanged(); });
            that._GeneralDiscountTextBox.bind("ValueChanged", function (e) { that._GeneralDiscountTextBox_ValueChanged(e); });
            that._GeneralDiscountPercentTextBox.bind("ValueChanged", function (e) { that._GeneralDiscountPercentTextBox_ValueChanged(e); });

            that._SetGeneralDiscountPercentByDiscount();

            if (ps.GetCurrentTaxAndTollPercentEntity() == null) {
                afw.ErrorDialog.Show("درصد مالیات و عوارض تعیین نشده است.");
                that.Close();
                return;
            }

            if (that._BindableEntity.get("IsProforma"))
                that._CustomerLookupControl.SetBaseFilterExpression("");
            else
                that._CustomerLookupControl.SetBaseFilterExpression(String.Format("RoleName = 'Customer'"));

            setTimeout(
                function () {
                    if (that._ItemsGridControl.GetRowsCount() != 0)
                        if (that.FormMode == "New")
                            that._CustomerAutoComplete.Focus();
                        else {
                            var lastRowIndex = that._ItemsGridControl.GetRowsCount() - 1;
                            that._ItemsGridControl.GetRowByIndex(lastRowIndex).Focus();
                        }
                }, 500);

            that._AdjustForm();
        },

        _OnClosed: function () {
            var that = this;

            afw.EntityFormBase.fn._OnClosed.call(that);
        },

        _MohlateErsalChekTextBox_ValueChanged: function (e) {
            var that = this;

            that._IsMohlateErsalChekTextBox_ValueChanged = true;

            if (!that._IsMohlateErsalChek_ValueChanged) {
                if (!ValueIsEmpty(that._IssueDateControl.GetValue())) {
                    var issueDate = that._IssueDateControl.GetValue();
                    var mohlateErsal = that._MohlateErsalChekTextBox.GetValue();
                    var mohlatErsalChekDate = afw.DateTimeHelper.AddDays(issueDate, mohlateErsal);
                    that._MohlateErsalChekFieldControl.SetValue(mohlatErsalChekDate);
                }
            }

            that._IsMohlateErsalChekTextBox_ValueChanged = false;
        },

        _MohlatePardakhtTextBox_ValueChanged: function (e) {
            var that = this;
            that._IsMohlatePardakhtTextBox_ValueChanged = true;
            if (!that._IsMohlatPardakhtFieldControl_ValueChanged) {

                if (!ValueIsEmpty(that._IssueDateControl.GetValue())) {
                    var issueDate = that._IssueDateControl.GetValue();
                    var mohlatePardakht = that._MohlatePardakhtTextBox.GetValue();
                    var mohlatPardakhtDate = afw.DateTimeHelper.AddDays(issueDate, mohlatePardakht);
                    that._MohlatPardakhtFieldControl.SetValue(mohlatPardakhtDate);
                }
            }
            that._IsMohlatePardakhtTextBox_ValueChanged = false;
        },

        _MohlateErsalChekFieldControl_ValueChanged: function () {
            var that = this;

            that._IsMohlateErsalChek_ValueChanged = true;

            if (!that._IsMohlateErsalChekTextBox_ValueChanged) {

                if (!ValueIsEmpty(that._IssueDateControl.GetValue())) {
                    var issueDate = that._IssueDateControl.GetValue();
                    var mohlateErsal = that._MohlateErsalChekFieldControl.GetValue();
                    if (mohlateErsal != null) {
                        var mohlatErsalChekDate = afw.DateTimeHelper.GetDatesDayDiff(issueDate, mohlateErsal);
                        that._MohlateErsalChekTextBox.SetValue(mohlatErsalChekDate);
                    }
                }
            }

            that._IsMohlateErsalChek_ValueChanged = false;
        },

        _MohlatPardakhtFieldControl_ValueChanged: function () {
            var that = this;

            that._IsMohlatPardakhtFieldControl_ValueChanged = true;

            if (!that._IsMohlatePardakhtTextBox_ValueChanged) {
                if (!ValueIsEmpty(that._IssueDateControl.GetValue())) {
                    var issueDate = that._IssueDateControl.GetValue();
                    var mohlatePardakht = that._MohlatPardakhtFieldControl.GetValue();
                    if (mohlatePardakht != null) {
                        var mohlatPardakhtDate = afw.DateTimeHelper.GetDatesDayDiff(issueDate, mohlatePardakht);
                        that._MohlatePardakhtTextBox.SetValue(mohlatPardakhtDate);
                    }
                }
            }

            that._IsMohlatPardakhtFieldControl_ValueChanged = false;
        },

        _DeliverDateTimeControl_ValueChanged: function (e) {
            var that = this;

            that._DeliverDate();
        },

        _DeliverDate: function (e) {
            var that = this;
            that._IsDeliverDateTimeControl_ValueChanged = true;
            if (!that._IsDeliverDaysTextBox_ValueChanged) {
                if (!ValueIsEmpty(that._IssueDateControl.GetValue())) {
                    var issueDate = that._IssueDateControl.GetValue();
                    var deliver = that._DeliverDateTimeControl.GetValue();
                    if (deliver != null) {
                        var deliverDate = afw.DateTimeHelper.GetDatesDayDiff(issueDate, deliver);
                        that._DeliverDaysTextBox.SetValue(deliverDate);
                    }
                }
            }

            that._IsDeliverDateTimeControl_ValueChanged = false;
        },

        _DeliverDaysTextBox_ValueChanged: function (e) {
            var that = this;
            that._IsDeliverDaysTextBox_ValueChanged = true;
            if (!that._IsDeliverDateTimeControl_ValueChanged) {
                if (!ValueIsEmpty(that._IssueDateControl.GetValue())) {
                    var issueDate = that._IssueDateControl.GetValue();
                    var deliverDaysTextBox = that._DeliverDaysTextBox.GetValue();
                    var deliverDate = afw.DateTimeHelper.AddDays(issueDate, deliverDaysTextBox);
                    that._DeliverDateTimeControl.SetValue(deliverDate);
                }
            }
            that._IsDeliverDaysTextBox_ValueChanged = false;

        },

        _WorkflowStageDropDownList_ValueChanged: function (e) {
            var that = this;

            var organizationUnit = that._BindableEntity.get("OrganizationUnit");
            var requestNumber = that._BindableEntity.get("RequestNumber");
            if (that._Saved) {
                that._RequestNumberTextBox.SetValue(requestNumber);
            }
            else {
                if (that._ShouldDisplayRequestNumber()) {
                    if (that._FormMode == "New"
                        || (that._FormMode == "Edit" && requestNumber == null)) {
                        that._RequestNumberTextBox.SetValue(afw.uiApi.CallServerMethodSync("ps.GetMaxRequestNumber", [organizationUnit]));
                    }
                }
                else
                    that._RequestNumberTextBox.SetValue(null);
            }

            that._AdjustForm();
        },

        _CustomerLookupControl_ValueChanged: function (e) {
            var that = this;

            that._BindableEntity.set("SalesCase", null);
            that._AdjustForm();

            if (!ValueIsEmpty(that._IssueDateControl.GetValue())) {
                var issueDate = that._IssueDateControl.GetValue();
                if (!ValueIsEmpty(that._CustomerLookupControl.GetValue())) {
                    var molatErsalChekEntity = afw.uiApi.FetchEntity("cmn.Person",
                            String.Format("ID = '{0}'", that._CustomerLookupControl.GetValue()));
                    var mohlatErsalChekField = molatErsalChekEntity.GetFieldValue("MohlateErsalChek");
                    var mohlatErsalChekDate = afw.DateTimeHelper.AddDays(issueDate, mohlatErsalChekField);
                    that._MohlateErsalChekFieldControl.SetValue(mohlatErsalChekDate);

                    var mohlatePardakhtEntity = afw.uiApi.FetchEntity("cmn.Person",
                            String.Format("ID = '{0}'", that._CustomerLookupControl.GetValue()));
                    var mohlatePardakhtField = mohlatePardakhtEntity.GetFieldValue("DorehMghararePardakht");
                    var mohlatePardakhtDate = afw.DateTimeHelper.AddDays(issueDate, mohlatePardakhtField);
                    that._MohlatPardakhtFieldControl.SetValue(mohlatePardakhtDate);

                    that._ConnectedPersonFieldControl.SetBaseFilterExpression(String.Format("ParentPerson = '{0}'", that._CustomerLookupControl.GetValue()));
                }
            }
        },

        _IssueDateControl_ValueChanged: function (e) {
            var that = this;

            that._ValidityDaysTextBox.SetText("");
            that._ValidityDateControl.SetValue(null);

            that._AdjustForm();
        },

        _ValidityDaysTextBox_ValueChanged: function (e) {
            var that = this;

            that._IsValidityDaysTextBox_ValueChanged = true;
            try {
                if (!that._IsValidityDateControl_ValueChanged) {
                    if (ValueIsEmpty(that._ValidityDaysTextBox.GetText()))
                        that._ValidityDateControl.SetValue(null);
                    else {
                        if (!ValueIsEmpty(that._IssueDateControl.GetValue())) {
                            var issueDate = that._IssueDateControl.GetValue();
                            var validityDays = that._ValidityDaysTextBox.GetValue();
                            var validityDate = afw.DateTimeHelper.AddDays(issueDate, validityDays);
                            that._ValidityDateControl.SetValue(validityDate);
                        }
                    }
                }
            }
            finally {
                that._IsValidityDaysTextBox_ValueChanged = false;
            }
        },

        _ValidityDateControl_ValueChanged: function () {
            var that = this;

            that._IsValidityDateControl_ValueChanged = true;

            try {
                if (!that._IsValidityDaysTextBox_ValueChanged) {
                    if (ValueIsEmpty(that._ValidityDateControl.GetValue()))
                        that._ValidityDaysTextBox.SetValue("");
                    else {
                        if (!ValueIsEmpty(that._IssueDateControl.GetValue())) {
                            var issueDate = that._IssueDateControl.GetValue();
                            var validityDate = that._ValidityDateControl.GetValue();
                            if (validityDate != null) {
                                var validityDays = afw.DateTimeHelper.GetDatesDayDiff(issueDate, validityDate);
                                that._ValidityDaysTextBox.SetValue(validityDays);
                            }
                        }
                    }
                }
            }
            finally {
                that._IsValidityDateControl_ValueChanged = false;
            }
        },

        _FinancialDocTypeOptionSetControl_ValueChanged: function (e) {
            var that = this;

            if (ValueIsEmpty(that._FinancialDocTypeOptionSetControl.GetValue()))
                return;

            try {
                var financialGroupEntity = cmn.GetFinancialGroupEntity(that._BindableEntity.get("OrganizationUnit"),
                    that._BindableEntity.get("FinancialYear"), that._BindableEntity.get("FinancialDocType"));
                if (financialGroupEntity != null)
                    that._BindableEntity.set("FinancialGroup", financialGroupEntity.GetFieldValue("ID"));
                else
                    that._BindableEntity.set("FinancialGroup", null);

                that._UpdateItemsTaxAndToll();

                if (!that._BindableEntity.get("IsProforma") && !ValueIsEmpty(that._ActiveFinancialYearID))
                    that._SetNewInvoiceNumber();
            }
            catch (ex) {
                that._BindableEntity.set("FinancialDocType", null);
                afw.ErrorDialog.Show(ex);
            }
        },

        _SetNewInvoiceNumber: function () {
            var that = this;

            var invoiceNumber = afw.uiApi.CallServerMethodSync("ps.GetSalesInvoiceDefaultNumber",
                    [that._BindableEntity.get("OrganizationUnit"), that._ActiveFinancialYearID,
                        that._BindableEntity.get("FinancialGroup"), that._BindableEntity.get("FinancialDocType"), that.IsAmani]);

            that._InvoiceNumberTextBox.SetValue(invoiceNumber.toString());
        },

        _UpdateItemsTaxAndToll: function () {
            var that = this;

            for (var i = 0; i < that._ItemsGridControl.GetRowsCount() ; i++) {
                var rowControl = that._ItemsGridControl.GetRowByIndex(i);
                rowControl.UpdateTaxAndToll();
            }
        },

        GetTaxCalculationIsEnabled: function () {
            var that = this;

            return cmn.GetFinancialGroupTaxCalculationIsEnabled(that._BindableEntity.get("OrganizationUnit"),
                that._BindableEntity.get("FinancialYear"), that._BindableEntity.get("FinancialDocType"));
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityFormBase.fn._AdjustForm.call(that);

            var enableSalesCase = that._BindableEntity.get("Customer") != null;
            that._SalesCaseLookupControl.SetReadOnly(!enableSalesCase);

            that._ValidityDaysTextBox.SetReadOnly(that._BindableEntity.get("IssueDate") == null);
            that._ValidityDateControl.SetReadOnly(that._BindableEntity.get("IssueDate") == null);

            if (that._ShouldDisplayRequestNumber()) {
                that._HorizontalDockPanel1.SetPaneSizeSetting(that._RequestNumberPaneIndex, 200);
                that._RequestNumberTextBox.SetVisible(true);
            }
            else {
                if (that._BindableEntity.get("IsProforma")) {
                    that._HorizontalDockPanel1.SetPaneSizeSetting(that._RequestNumberPaneIndex, 1);
                    that._RequestNumberTextBox.SetVisible(false);
                }
            }
        },

        _ShouldDisplayRequestNumber: function () {
            var that = this;

            var workflowStageID = that._BindableEntity.get("WorkflowStage");
            if (workflowStageID != null) {

                workflowStage = cmn.GetWorkflowStageByID(workflowStageID);
                if (cmn.IsMegaModavem() && workflowStage != null && workflowStage.GetFieldValue("LatinName") == "FinalApproved")
                    return true;
                else
                    return false;
            }

            return true;
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityFormBase.fn._ValidateForm.call(that))
                return false;

            if (that._ShouldDisplayRequestNumber() && ValueIsEmpty(that._BindableEntity.get("RequestNumber"))) {
                afw.ErrorDialog.Show("شماره درخواست وارد نشده است.");
                return false;
            }

            if (!that._ItemsGridControl.ValidateRows())
                return false;

            that._PayPlanItemsGridControl.RemoveEmptyRows();

            if (!that._PayPlanItemsGridControl.ValidateRows())
                return false;

            return true;
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (buttonKey == "Save" && that._BindableEntity.GetEntity().ChangeStatus == "Add") {
                if (!that._Save())
                    return;

                var salesInvoceEntity = afw.uiApi.FetchEntityByID("ps.SalesInvoice", that._BindableEntity.get("ID"));
                that._BindableEntity.set("AccDoc", salesInvoceEntity.GetFieldValue("AccDoc"));
                that._BindableEntity.set("InvoiceNumber", salesInvoceEntity.GetFieldValue("InvoiceNumber"));
                that._BindableEntity.set("InternalNumber1", salesInvoceEntity.GetFieldValue("InternalNumber1"));
                that._BindableEntity.set("InternalNumber2", salesInvoceEntity.GetFieldValue("InternalNumber2"));
                return;
            }
            else
                afw.EntityFormBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _Save: function () {
            var that = this;
            var saved = false;

            if (ValueIsEmpty(that._GeneralDiscountTextBox.GetValue()))
                that._GeneralDiscountTextBox.SetText(0)

            saved = afw.EntityFormBase.fn._Save.call(that);

            that._Saved = saved;

            return saved;
        },

        _GeneralDiscountTextBox_ValueChanged: function (e) {
            var that = this;

            that._IsSettingGeneralDiscount = true;
            try {
                if (!that._IsSettingGeneralDiscountPercent && !that._IsSettingGeneralDiscountByDiscountPercent) {
                    that._GeneralDiscountPercentTextBox.SetText(null);
                }

                that.UpdateSummaryFields();
            }
            finally {
                that._IsSettingGeneralDiscount = false;
            }
        },

        _GeneralDiscountPercentTextBox_ValueChanged: function (e) {
            var that = this;

            that._IsSettingGeneralDiscountPercent = true;
            try {
                if (!that._IsSettingGeneralDiscount && !that._IsSettingGeneralDiscountPercentByDiscount) {
                    if (ValueIsEmpty(that._GeneralDiscountPercentTextBox.GetText()))
                        that._GeneralDiscountTextBox.SetText("");
                    else {
                        that._SetGeneralDiscountByDiscountPercent();
                    }
                }
            }
            finally {
                that._IsSettingGeneralDiscountPercent = false;
            }
        },

        _SetGeneralDiscountByDiscountPercent: function () {
            var that = this;

            that._IsSettingGeneralDiscountByDiscountPercent = true;
            try {
                var discountPercent = that._GeneralDiscountPercentTextBox.GetText().ToNumber();
                var totalPrice = that._ItemsGridControl.GetTotalPriceSum();
                var discount = Math.round(totalPrice * discountPercent / 100);
                that._GeneralDiscountTextBox.SetText(discount);
            }
            finally {
                that._IsSettingGeneralDiscountByDiscountPercent = false;
            }
        },

        _SetGeneralDiscountPercentByDiscount: function () {
            var that = this;

            that._IsSettingGeneralDiscountPercentByDiscount = true;
            try {
                var discount = that._GeneralDiscountTextBox.GetValue();
                if (discount == 0 || ValueIsEmpty(discount))
                    that._GeneralDiscountPercentTextBox.SetText("");
                else {
                    var totalPrice = that._ItemsGridControl.GetTotalPriceSum();
                    var discountPercent = Math.round(discount * 100 / totalPrice, 2);
                    that._GeneralDiscountPercentTextBox.SetText(discountPercent);
                }
            }
            finally {
                that._IsSettingGeneralDiscountPercentByDiscount = false;
            }
        },

        UpdateSummaryFields: function () {
            var that = this;

            if (!ValueIsEmpty(that._GeneralDiscountPercentTextBox.GetText()))
                that._SetGeneralDiscountByDiscountPercent();

            var generalDiscount = that._BindableEntity.get("GeneralDiscount");
            var totalStuffAndServicesPrice = that._ItemsGridControl.GetTotalPriceSum();
            var stuffAndServicesTotalAmountAfterDiscount = that._ItemsGridControl.GetTotalPriceSum() - that._ItemsGridControl.GetDiscountSum();
            var totalTaxAndToll = that._ItemsGridControl.GetTaxAndTollSum();
            var totalDiscount = that._ItemsGridControl.GetDiscountSum() + generalDiscount;
            var finalAmount = that._ItemsGridControl.GetFinalPriceSum() - generalDiscount;

            that._BindableEntity.set("TotalStuffAndServicesPrice", totalStuffAndServicesPrice);
            that._BindableEntity.set("StuffAndServicesTotalAmountAfterDiscount", stuffAndServicesTotalAmountAfterDiscount);
            that._BindableEntity.set("TotalTaxAndToll", totalTaxAndToll);
            that._BindableEntity.set("TotalDiscount", totalDiscount);
            that._BindableEntity.set("FinalAmount", finalAmount);

            var formatedFinalAmount = FormatNumber(finalAmount) + " ریال";
            that._FinalAmountLabel.SetText(formatedFinalAmount);
            that._PayPlanItemsGridControl.RefreshAmounts();
        },

        _AdjustDynamicTextFieldsControl: function () {
            var that = this;

            that._HideDynamicTextFieldControls();

            afw.DataListHelper.AsyncFetchEntityListOfDataList("cmn.CustomTextFieldInfoList", null, null,
                "EntityFullName = 'ps.SalesInvoice'", "FieldNumber", null, null,
                function (result) {
                    if (that._IsDestroying)
                        return;

                    afw.uiApi.HideProgress(that);
                    if (result.HasError)
                        afw.ErrorDialog.Show(result.ErrorMessage);
                    else {
                        var dynamicTextFieldsVerticalDockPanel = that.FindControl("DynamicTextFieldsVerticalDockPanel");

                        var dynamicTextFieldEntities = result.Value.Entities;
                        if (dynamicTextFieldEntities.length < 1)
                            return;
                        else {

                            dynamicTextFieldsVerticalDockPanel.SetVisible(true);
                            that.FindControl("Tab2MainDockPanel").SetPaneSizeSetting(11, 300);

                            for (var i = 0; i < dynamicTextFieldEntities.length ; i++) {
                                dynamicTextFieldsVerticalDockPanel.SetPaneSizeSetting(Math.floor(i / 2), 40);

                                that.FindControl(String.Format("DynamicTextField{0}Label", i + 1)).SetVisible(true);
                                that.FindControl(String.Format("DynamicTextField{0}TextBox", i + 1)).SetVisible(true);

                                that.FindControl(String.Format("DynamicTextField{0}Label", i + 1)).SetText(dynamicTextFieldEntities[i].GetFieldValue("Title"));
                                that.FindControl(String.Format("DynamicTextField{0}TextBox", i + 1)).InitDataBinding(that._BindableEntity);
                            }
                        }
                    }
                });
        },

        _HideDynamicTextFieldControls: function () {
            var that = this;

            var dynamicTextFieldsVerticalDockPanel = that.FindControl("DynamicTextFieldsVerticalDockPanel");

            dynamicTextFieldsVerticalDockPanel.SetVisible(false);
            that.FindControl("Tab2MainDockPanel").SetPaneSizeSetting(11, 1);

            for (var i = 0 ; i < 10; i++) {
                dynamicTextFieldsVerticalDockPanel.SetPaneSizeSetting(Math.floor(i / 2), 1);

                that.FindControl(String.Format("DynamicTextField{0}Label", i + 1)).SetVisible(false);
                that.FindControl(String.Format("DynamicTextField{0}TextBox", i + 1)).SetVisible(false);
            }
        }
    });

    //Static Members:

    FormClass.TypeName = "ps.SalesInvoiceEditForm";
    FormClass.BaseType = afw.EntityFormBase;


    ps.SalesInvoiceEditForm = FormClass;
})();