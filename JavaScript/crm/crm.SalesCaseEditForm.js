(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return crm.SalesCaseEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._SalesCaseID = that._BindableEntity._Entity.FieldValues.ID;
            that._CustomerEntity = null;

            that._Toolbar = that.FindControl("Toolbar");

            that.FindControl("MainHorizontalSplitterPanel").SetPaneSize(1, crm.SalesCaseEditForm.HistoryPaneDefaultSize);

            that._MainTabControl = that.FindControl("MainTabControl");
            that._HistoryDockPanel = that.FindControl("HistoryDockPanel");
            
            that._CustomerFieldInnerControl = that.FindControl("CustomerFieldControl").FindControl("InnerControl");
            that._realStartDateControl = that.FindControl("RealStartDateFieldControl").FindControl("InnerControl");
            that._RequestTypeControl = that.FindControl("RequestTypeFieldControl").FindControl("InnerControl");
            that._SalesCaseStageControl = that.FindControl("SalesCaseStageFieldControl").FindControl("InnerControl");
            that._OwnerUserControl = that.FindControl("OwnerUserFieldControl").FindControl("InnerControl");

            that._CustomerAutoComplete = that._CustomerFieldInnerControl.GetAutoComplete();
            that._NewCustomerButton = that.FindControl("NewCustomerButton");
            that._MainConnectedPersonAutoComplete = that.FindControl("MainConnectedPersonFieldControl").FindControl("InnerControl").GetAutoComplete();
            that._NewMainConnectedPersonButton = that.FindControl("NewMainConnectedPersonButton");
            that._IntroducerPersonAutoComplete = that.FindControl("IntroducerPersonFieldControl").FindControl("InnerControl").GetAutoComplete();
            that._NewIntroducerPersonButton = that.FindControl("NewIntroducerPersonButton");

            that._OwnerUserControl.SetLabelText("مسئول پرونده");

            that.FindControl("ActiveInactiveImageButton").bind("Click", function (e) { that._ActiveInactiveImageButton_Click(e); });

            that._RequestTypeControl.bind("ValueChanged", function (e) { that._RequestTypeControl_ValueChanged(e); });

            that._CustomerFieldInnerControl.bind("ValueChanged", function (e) { that._CustomerFieldInnerControl_ValueChanged(e); });

            that._CustomerAutoComplete.bind("TextChanged", function (e) { that._CustomerAutoComplete_TextChanged(e); });
            that._CustomerAutoComplete.bind("ValueChanged", function (e) { that._CustomerAutoComplete_ValueChanged(e); });
            that._CustomerAutoComplete.bind("KeyPressed", function (e) { that._CustomerAutoComplete_KeyPressed(e); });
            that._NewCustomerButton.SetVisible(false);
            that._NewCustomerButton.bind("Click", function (e) { that._NewCustomerButton_Click(e); });

            that._MainConnectedPersonAutoComplete.bind("TextChanged", function (e) { that._MainConnectedPersonAutoComplete_TextChanged(e); });
            that._MainConnectedPersonAutoComplete.bind("ValueChanged", function (e) { that._MainConnectedPersonAutoComplete_ValueChanged(e); });
            that._MainConnectedPersonAutoComplete.bind("KeyPressed", function (e) { that._MainConnectedPersonAutoComplete_KeyPressed(e); });
            that._NewMainConnectedPersonButton.SetVisible(false);
            that._NewMainConnectedPersonButton.bind("Click", function (e) { that._NewMainConnectedPersonButton_Click(e); });

            that._IntroducerPersonAutoComplete.bind("TextChanged", function (e) { that._IntroducerPersonAutoComplete_TextChanged(e); });
            that._IntroducerPersonAutoComplete.bind("ValueChanged", function (e) { that._IntroducerPersonAutoComplete_ValueChanged(e); });
            that._IntroducerPersonAutoComplete.bind("KeyPressed", function (e) { that._IntroducerPersonAutoComplete_KeyPressed(e); });
            that._NewIntroducerPersonButton.SetVisible(false);
            that._NewIntroducerPersonButton.bind("Click", function (e) { that._NewIntroducerPersonButton_Click(e); });

            that._HideCustomerInfo();

            that.FindControl("TitleFieldControl").FindControl("InnerControl").bind("TextChanged",
                function (e) {
                    that._UpdateTitleLabel();
                });

            if (that._FormMode == "New") {
                that.FindControl("SalesCaseTitleLabel").SetText("");

                var lastDateTime = afw.uiApi.CallServerMethodSync("core.GetServerDateTime");
                that._realStartDateControl.SetValue(lastDateTime);

                var salesCaseStatus_OpenID = afw.OptionSetHelper.GetOptionSetItemID("crm.SalesCaseStatuses.Open");
                that._BindableEntity.set("Status", salesCaseStatus_OpenID);

                that._SalesCaseStageControl.SetReadOnly(true);

                var salesCaseRequestTypeEntityList = afw.uiApi.FetchEntityList("crm.SalesCaseRequestType")
                if (salesCaseRequestTypeEntityList.Entities.length == 1) {
                    var requestTypeID = salesCaseRequestTypeEntityList.Entities[0].GetFieldValue("ID");
                    that._RequestTypeControl.SetValue(requestTypeID);
                    that._SalesCaseStageControl.SetBaseFilterExpression(String.Format("RequestType = '{0}'", requestTypeID));
                    that._SelectFirstStage();
                }

                that._OwnerUserControl.SetValue(afw.App.Session.GetFieldValue("SystemUser"))

            }
            else if (that._FormMode == "Edit") {
                that._UpdateTitleLabel();

                var requestTypeID = that._RequestTypeControl.GetValue();
                if (requestTypeID == null)
                    that._SalesCaseStageControl.SetReadOnly(true);
                else
                    that._SalesCaseStageControl.SetReadOnly(false);

                that._SalesCaseStageControl.SetBaseFilterExpression(String.Format("RequestType = '{0}'", requestTypeID));

                afw.uiApi.ShowProgress(that._MainTabControl.GetTabPageByName("Tab1"));
                afw.uiApi.AsyncFetchEntity("cmn.Person",
                    String.Format("ID = '{0}'", that._BindableEntity.get("Customer")),
                    null,
                    function (result) {
                        if (that._IsDestroying)
                            return;

                        afw.uiApi.HideProgress(that._MainTabControl.GetTabPageByName("Tab1"));
                        if (result.HasError)
                            afw.ErrorDialog.Show(result.ErrorMessage);
                        else {
                            that._CustomerEntity = result.Value;
                            that._ShowCustomerInfo();
                        }
                    });
            }
            
            that._SalesCaseHistoryControl = afw.uiApi.CreateDataListControl("crm.SalesCaseHistory", {
                ParentControl: that._HistoryDockPanel.Panes[1],
                BaseFilterExpression: String.Format("SalesCase = '{0}'", that._SalesCaseID),
                FillParent: true
            });
            that._SalesCaseHistoryControl._VDockPanel.RemovePane(0);
            that._SalesCaseHistoryControl._VDockPanel.RemovePane(0);
            that._SalesCaseHistoryControl._VDockPanel.RemovePane(0);

            that._SalesCaseHistoryControl.bind("Resize", function (e) {
                crm.SalesCaseEditForm.HistoryPaneDefaultSize = e.Sender.GetWidth();
            });

            that._Toolbar.AddSeparator("Separator1");
            that._Toolbar.AddButton("NewConnectedPerson", "", { Image: "resource(cmn.NewConnectedPerson_ToolbarIcon)" });
            that._Toolbar.AddButton("NewActivity", "", { Image: "resource(cmn.NewActivity_ToolbarIcon)" });
            that._Toolbar.AddButton("NewNote", "", { Image: "resource(cmn.NewNote_ToolbarIcon)" });
            that._Toolbar.AddButton("NewFileAttachment", "", { Image: "resource(cmn.NewAttachment_ToolbarIcon)" });           
            that._Toolbar.AddSeparator("Separator2");

            that._AdjustForm2();
        },

        _OnOpening: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpening.call(that);

            that.Center();
            that.Maximize();
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
        },

        _ActiveInactiveImageButton_Click: function (e) {
            var that = this;

            if (that._BindableEntity.get("IsActive") == true)
                that._BindableEntity.set("IsActive", false);
            else
                that._BindableEntity.set("IsActive", true);

            //that._Save();
            that._AdjustForm2();
        },

        _CustomerAutoComplete_TextChanged: function (e) {
            var that = this;

            var autoComplete = e.Sender;

            setTimeout(function () {
                if (autoComplete.GetText().length > 1 && autoComplete.GetValue() == null)
                    that._NewCustomerButton.SetVisible(true);
                else
                    that._NewCustomerButton.SetVisible(false);
            }, 500);
        },

        _CustomerAutoComplete_ValueChanged: function (e) {
            var that = this;

            var autoComplete = e.Sender;

            if (autoComplete.GetValue() != null)
                that._NewCustomerButton.SetVisible(false);
        },

        _CustomerAutoComplete_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter")
                that._NewCustomer();
        },

        _NewCustomerButton_Click: function (e) {
            var that = this;

            that._NewCustomer();
        },

        _NewCustomer: function () {
            var that = this;

            var customerEntity = afw.uiApi.CreateNewEntity("cmn.Person");

            var customerWindow = null;

            if (cmn.OpenWindowExists())
                customerWindow = afw.EntityHelper.OpenEntityFormInWindow(customerEntity, "cmn.PersonEditForm", "New", { RoleName: "Customer",
                    PersonName: that._CustomerAutoComplete.GetText() });
            else
                customerWindow = afw.EntityHelper.OpenEntityFormInMdiContainer(customerEntity, "cmn.PersonEditForm", "New", { RoleName: "Customer",
                    PersonName: that._CustomerAutoComplete.GetText() });

            //Title: "مشتری جدید",

            customerWindow.bind("Close", function (e) {
                if (e.Sender._DialogResult == "Ok") {
                    that._BindableEntity.set("Customer", customerEntity.GetFieldValue("ID"));
                    that._NewCustomerButton.SetVisible(false);
                }
            });
        },

        _CustomerFieldInnerControl_ValueChanged: function (e) {
            var that = this;

            that._SetDefaultTitle();

            if (e.Sender.GetValue() == null) {
                that._CustomerEntity = null;
                that._HideCustomerInfo();
            }
            else {
                that._CustomerEntity = afw.uiApi.FetchEntity("cmn.Person", String.Format("ID = '{0}'", that._BindableEntity.get("Customer")));
                that._ShowCustomerInfo();
            }
        },

        _MainConnectedPersonAutoComplete_TextChanged: function (e) {
            var that = this;

            var autoComplete = e.Sender;

            setTimeout(function () {
                if (autoComplete.GetText().length > 1 && autoComplete.GetValue() == null)
                    that._NewMainConnectedPersonButton.SetVisible(true);
                else
                    that._NewMainConnectedPersonButton.SetVisible(false);
            }, 500);
        },

        _MainConnectedPersonAutoComplete_ValueChanged: function (e) {
            var that = this;

            var autoComplete = e.Sender;

            if (autoComplete.GetValue() != null)
                that._NewMainConnectedPersonButton.SetVisible(false);
        },

        _MainConnectedPersonAutoComplete_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter")
                that._NewMainConnectedPerson();
        },

        _NewMainConnectedPersonButton_Click: function (e) {
            var that = this;

            that._NewMainConnectedPerson();
        },

        _NewMainConnectedPerson: function () {
            var that = this;

            var mainConnectedPersonEntity = afw.uiApi.CreateNewEntity("cmn.Person");

            var mainConnectedPersonWindow = null;

            if (cmn.OpenWindowExists())
                mainConnectedPersonWindow = afw.EntityHelper.OpenEntityFormInWindow(mainConnectedPersonEntity, "cmn.PersonEditForm", "New", {
                    RoleName: "ConnectedPerson",
                    PersonType: afw.OptionSetHelper.GetOptionSetItemID("cmn.PersonTypes.Haghighi"),
                    PersonLastName: that._MainConnectedPersonAutoComplete.GetText()
                });
            else
                mainConnectedPersonWindow = afw.EntityHelper.OpenEntityFormInMdiContainer(mainConnectedPersonEntity, "cmn.PersonEditForm", "New", {
                    RoleName: "ConnectedPerson",
                    PersonType: afw.OptionSetHelper.GetOptionSetItemID("cmn.PersonTypes.Haghighi"),
                    PersonLastName: that._MainConnectedPersonAutoComplete.GetText()
                });
            //Title: "شخص مرتبط جدید",
            
            mainConnectedPersonWindow.bind("Close", function (e) {
                if (e.Sender._DialogResult == "Ok") {
                    that._BindableEntity.set("MainConnectedPerson", mainConnectedPersonEntity.GetFieldValue("ID"));
                    that._NewMainConnectedPersonButton.SetVisible(false);
                }
            });
        },

        _IntroducerPersonAutoComplete_TextChanged: function (e) {
            var that = this;

            var autoComplete = e.Sender;

            setTimeout(function () {
                if (autoComplete.GetText().length > 1 && autoComplete.GetValue() == null)
                    that._NewIntroducerPersonButton.SetVisible(true);
                else
                    that._NewIntroducerPersonButton.SetVisible(false);
            }, 500);
        },

        _IntroducerPersonAutoComplete_ValueChanged: function (e) {
            var that = this;

            var autoComplete = e.Sender;

            if (autoComplete.GetValue() != null)
                that._NewIntroducerPersonButton.SetVisible(false);
        },

        _IntroducerPersonAutoComplete_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter")
                that._NewIntroducerPerson();
        },

        _NewIntroducerPersonButton_Click: function (e) {
            var that = this;

            that._NewIntroducerPerson();
        },

        _NewIntroducerPerson: function () {
            var that = this;

            var introducerPersonEntity = afw.uiApi.CreateNewEntity("cmn.Person");
            var introducerPersonWindow = null;

            if (cmn.OpenWindowExists())
                introducerPersonWindow = afw.EntityHelper.OpenEntityFormInWindow(introducerPersonEntity, "cmn.PersonEditForm", "New", {
                    RoleName: "Marketer",
                    PersonType: afw.OptionSetHelper.GetOptionSetItemID("cmn.PersonTypes.Haghighi"),
                    PersonLastName: that._IntroducerPersonAutoComplete.GetText(),
                    Title: "معرف جدید"
                });
            else
                introducerPersonWindow = afw.EntityHelper.OpenEntityFormInMdiContainer(introducerPersonEntity, "cmn.PersonEditForm", "New", {
                    RoleName: "Marketer",
                    PersonType: afw.OptionSetHelper.GetOptionSetItemID("cmn.PersonTypes.Haghighi"),
                    PersonLastName: that._IntroducerPersonAutoComplete.GetText(),
                    Title: "معرف جدید"
                });

            introducerPersonWindow.bind("Close", function (e) {
                if (e.Sender._DialogResult == "Ok") {
                    that._BindableEntity.set("IntroducerPerson", introducerPersonEntity.GetFieldValue("ID"));
                    that._NewIntroducerPersonButton.SetVisible(false);
                }
            });
        },

        _RequestTypeControl_ValueChanged: function (e) {
            var that = this;

            that._SalesCaseStageControl.SetValue(null);

            that._SetDefaultTitle();

            var requestTypeID = that._RequestTypeControl.GetValue();
            if (requestTypeID == null) {
                that._SalesCaseStageControl.SetReadOnly(true);
            }
            else {
                that._SalesCaseStageControl.SetReadOnly(false);

                that._SalesCaseStageControl.SetBaseFilterExpression(String.Format("RequestType = '{0}'", requestTypeID));
                that._SelectFirstStage();
            }
        },

        _SelectFirstStage: function () {
            var that = this;

            var requestTypeID = that._RequestTypeControl.GetValue();

            var salesCaseStageEntityList = afw.uiApi.FetchEntityList("crm.SalesCaseStage", String.Format("RequestType = '{0}'", requestTypeID), "StageNumber");
            if (salesCaseStageEntityList.Entities.length > 0)
                that._SalesCaseStageControl.SetValue(salesCaseStageEntityList.Entities[0].GetFieldValue("ID"));
        },

        _ShowCustomerInfo: function () {
            var that = this;

            var phoneNumberText = "";
            if (!ValueIsEmpty(that._CustomerEntity.GetFieldValue("TelNumber1")))
                phoneNumberText += that._CustomerEntity.GetFieldValue("TelNumber1");
            if (!ValueIsEmpty(that._CustomerEntity.GetFieldValue("WorkPhoneNumber"))) {
                if (phoneNumberText != "")
                    phoneNumberText += ", ";

                phoneNumberText += that._CustomerEntity.GetFieldValue("WorkPhoneNumber");
            }

            that.FindControl("CustomerTelNumberLabel").SetText(phoneNumberText);

            if (!ValueIsEmpty(that._CustomerEntity.GetFieldValue("MobilePhoneNumber1")))
                that.FindControl("CustomerMobileNumberLabel").SetText(that._CustomerEntity.GetFieldValue("MobilePhoneNumber1"));
            else
                that.FindControl("CustomerMobileNumberLabel").SetText("");

            if (!ValueIsEmpty(that._CustomerEntity.GetFieldValue("Email")))
                that.FindControl("CustomerEmailLabel").SetText(that._CustomerEntity.GetFieldValue("Email"));
            else
                that.FindControl("CustomerEmailLabel").SetText("");

            that.FindControl("CustomerInfoWrapperPanel").SetVisible(true);
            that.FindControl("Tab1Panel2TabularPanel").AdjustRows();
        },

        _HideCustomerInfo: function () {
            var that = this;

            that.FindControl("CustomerInfoWrapperPanel").SetVisible(false);
            that.FindControl("Tab1Panel2TabularPanel").AdjustRows();
        },

        _AdjustForm2: function () {
            var that = this;

            var statusId = that._BindableEntity.get("Status");
            var statusName = afw.OptionSetHelper.GetOptionSetItemName(statusId);
            var statusImagePanel = that.FindControl("StatusImagePanel");
            var statusLabel = that.FindControl("StatusLabel");
            var activeInactiveImageButton = that.FindControl("ActiveInactiveImageButton");

            var showReopenButton = showWinButton = showLoseButton = false;
            var showActiveInactiveButton = statusName == "Open" && that._FormMode != "New";

            if (statusName == "Open") {
                statusImagePanel.SetBackgroundImage("resource(crm.OpenLabel)");
                statusLabel.SetText("باز");

                if (that._FormMode == "Edit") {
                    showReopenButton = false;
                    showWinButton = showLoseButton = true;
                }
            }
            else if (statusName == "Won") {
                statusImagePanel.SetBackgroundImage("resource(crm.WonLabel)");
                statusLabel.SetText("برنده");                

                showReopenButton = true;
                showWinButton = showLoseButton = false;
            }
            else if (statusName == "Lost") {
                statusImagePanel.SetBackgroundImage("resource(crm.LostLabel)");
                statusLabel.SetText("بازنده");

                showReopenButton = true;
                showWinButton = showLoseButton = false;
            }

            if (showReopenButton && !that._Toolbar.ButtonExists("ReopenSalesCase"))
                that._Toolbar.AddButton("ReopenSalesCase", "بازنمودن مجدد پرونده", { Image: "resource(crm.ReopenSalesCaseToolbarButtonIcon)" });
            if (!showReopenButton && that._Toolbar.ButtonExists("ReopenSalesCase"))
                that._Toolbar.RemoveButton("ReopenSalesCase");

            if (showWinButton && !that._Toolbar.ButtonExists("WinSalesCase"))
                that._Toolbar.AddButton("WinSalesCase", "بستن بعنوان برنده", { Image: "resource(crm.WinSalesCaseToolbarButtonIcon)" });
            if (!showWinButton && that._Toolbar.ButtonExists("WinSalesCase"))
                that._Toolbar.RemoveButton("WinSalesCase");

            if (showLoseButton && !that._Toolbar.ButtonExists("LoseSalesCase"))
                that._Toolbar.AddButton("LoseSalesCase", "بستن بعنوان بازنده", { Image: "resource(crm.LoseSalesCaseToolbarButtonIcon)" });
            if (!showLoseButton && that._Toolbar.ButtonExists("LoseSalesCase"))
                that._Toolbar.RemoveButton("LoseSalesCase");

            if (showActiveInactiveButton) {
                if (that._BindableEntity.get("IsActive") == true)
                    activeInactiveImageButton.SetImage("resource(crm.SalesCaseActiveButton)");
                else
                    activeInactiveImageButton.SetImage("resource(crm.SalesCaseInactiveButton)");
            }

            activeInactiveImageButton.SetVisible(showActiveInactiveButton);


            that._SalesCaseLoseInfoEntity = afw.uiApi.FetchEntity("crm.SalesCaseLoseInfo", String.Format("SalesCase = '{0}'", that._SalesCaseID));

            if (that._SalesCaseLoseInfoEntity != null) {
                if (!that._MainTabControl.TabExists("LoseInfoTab")) {
                    that._MainTabControl.AppendTab("LoseInfoTab", "اطلاعات باخت");

                    afw.uiApi.CreateSavedFormByName(that.FindControl("LoseInfoTab"), "crm.SalesCaseLoseInfoEditControl",
                        { FillParent: true });

                    var loseBindableEntity = that._SalesCaseLoseInfoEntity.ToBindableEntity();
                    that.FindControl("LoseInfoTab").InitDataBinding(loseBindableEntity);

                    that._BindableEntity._Entity.FieldValues["SalesCaseLoseInfo"] = that._SalesCaseLoseInfoEntity;
                    that._BindableEntity._Entity.FieldValues["SalesCaseLoseInfo"].ChangeStatus = "None";
                }
            }
            else {
                if (that._MainTabControl.TabExists("LoseInfoTab"))
                    that._MainTabControl.RemoveTabByName("LoseInfoTab");
            }
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);

            if (buttonKey == "NewConnectedPerson") {
                var composeControl = that.FindControl("ConnectedPeopleFieldControl").FindControl("InnerControl");
                var dataListControl = composeControl.FindControl("DataListControl");
                var entity = afw.uiApi.CreateNewEntity("crm.SalesCaseConnectedPerson");
                var entityWindow = dataListControl.ShowEntityWindow(entity, "New");
            }
            else if (buttonKey == "NewActivity") {
                var composeControl = that.FindControl("ActivitiesFieldControl").FindControl("InnerControl");
                var dataListControl = composeControl.FindControl("DataListControl");
                var entity = afw.uiApi.CreateNewEntity("cmn.Activity");
                var entityWindow = dataListControl.ShowEntityWindow(entity, "New");
            }
            else if (buttonKey == "NewNote") {
                var composeControl = that.FindControl("NotesFieldControl").FindControl("InnerControl");
                var dataListControl = composeControl.FindControl("DataListControl");
                var entity = afw.uiApi.CreateNewEntity("crm.SalesCaseNote");
                var entityWindow = dataListControl.ShowEntityWindow(entity, "New");
            }
            else if (buttonKey == "NewFileAttachment") {
                var composeControl = that.FindControl("AttachedFilesFieldControl").FindControl("InnerControl");
                var dataListControl = composeControl.FindControl("DataListControl");
                var entity = afw.uiApi.CreateNewEntity("crm.SalesCaseAttachedFile");
                var entityWindow = dataListControl.ShowEntityWindow(entity, "New");
            }
            else if (buttonKey == "WinSalesCase") {
                var salesCaseStatus_WonID = afw.OptionSetHelper.GetOptionSetItemID("crm.SalesCaseStatuses.Won");
                that._BindableEntity.set("Status", salesCaseStatus_WonID);
                that._Save();

                var closeForm = true;
                if (closeForm) {
                    that.SetDialogResult("Ok");
                    that.Close();
                }
                else {
                    that._AdjustForm2();
                }
            }
            else if (buttonKey == "LoseSalesCase") {
                var salesCaseLoseWindow = crm.ShowSalesCaseLoseInfoDialog(that._SalesCaseID);
                salesCaseLoseWindow.bind("Close", function (e) { that._SalesCaseLoseWindow_Close(e); });
            }
            else if (buttonKey == "ReopenSalesCase") {
                var salesCaseStatus_OpenID = afw.OptionSetHelper.GetOptionSetItemID("crm.SalesCaseStatuses.Open");
                that._BindableEntity.set("Status", salesCaseStatus_OpenID);
                that._Save();

                var closeForm = false;
                if (closeForm) {
                    that.SetDialogResult("Ok");
                    that.Close();
                }
                else {
                    that._AdjustForm2();
                }
            }
        },

        _SalesCaseLoseWindow_Close: function (e) {
            var that = this;

            if (e.Sender._DialogResult == "Ok") {
                var salesCaseStatus_LostID = afw.OptionSetHelper.GetOptionSetItemID("crm.SalesCaseStatuses.Lost");
                //Sales case status updates at server by saving LoseInfo entity. here we set it to show new status in UI
                that._BindableEntity.set("Status", salesCaseStatus_LostID);

                var closeForm = true;
                if (closeForm) {
                    that.SetDialogResult("Ok");
                    that.Close();
                }
                else {                    
                    that._AdjustForm2();
                }
            }
        },

        _SetDefaultTitle: function () {
            var that = this;

            var requestTypeText = that._RequestTypeControl.GetDropDownList().GetText();
            var customerText = that._CustomerFieldInnerControl.GetAutoComplete().GetText();
            var defaultTitle = requestTypeText + " " + customerText;

            that._BindableEntity.set("Title", defaultTitle);
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

            //var saved = afw.EntityWindowBase.fn._Save.call(that);

            if (that._BindableEntity._Entity.ChangeStatus == "Modify" && !that._FormHasUnsavedChanges)
                return true;

            try {
                if (that._ValidateForm()) {
                    afw.uiApi.CallServerMethodSync("crm.SaveSalesCase", [that._BindableEntity._Entity]);
                    that._FormHasUnsavedChanges = false;

                    if (that._FormMode == "New") {
                        that._BindableEntity._Entity.ChangeStatus = "Modify"; //Allow saving again if form is not closed

                        that._AdjustForm();
                    }

                    if (that._BindableEntity._Entity.FieldExists("SalesCaseLoseInfo") == true)
                        that._BindableEntity._Entity.FieldValues["SalesCaseLoseInfo"].ChangeStatus = "Modify";

                    return true;
                }
                else
                    return false;
            }
            catch (ex) {
                afw.App.HandleError(ex);
                return false;
            }

            return saved;
        },

        _UpdateTitleLabel: function () {
            var that = this;

            var title = that.FindControl("TitleFieldControl").FindControl("InnerControl").GetText();
            that.FindControl("SalesCaseTitleLabel").SetText(title);
        }
    });

    //Static Members:

    FormClass.TypeName = "crm.SalesCaseEditForm";
    FormClass.BaseType = afw.EntityWindowBase;

    FormClass.HistoryPaneDefaultSize = 500;


    crm.SalesCaseEditForm = FormClass;
})();
