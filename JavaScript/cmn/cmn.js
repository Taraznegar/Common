(function () {
    window.cmn = {
        Init: function () {
            var that = this;

            that._ReminderManager = new cmn.ReminderManager();

            that._CurrentUser = null;
            that._OrganizationUnitsEntityList = null;
            that._SystemUserOrganizationUnits = null;
            that._UserActiveOrganizationUnitIDs = [];
            that._UserActiveOrganizationUnitsFilterExpression = null;

            that._MeasurementUnitsEntityList = null;
            that._UserActiveFinancialYearID = null;
            that._FinancialYearsEntityList = null;
            that._UserSettingsEntity = null;
            that._WorkfolwSystemActions = null;
            that._DefaultFinancialGroupID = null;
            that._AppStatusBarDockPanel_UsablePaneIndex = 2;

            that._IsMegaModavem = false;

            that._PersonsListControl = null;

            that._FinancialGroupEntityList = afw.uiApi.FetchEntityList("cmn.FinancialGroup", null, null);

            if (that.GetOrganizationUnitsEntityList().Entities.length == 0)
                afw.ErrorDialog.Show("اطلاعات سازمان در تنظیمات سیستم ثبت نشده است.");
            else
                that._CreateOrganizationNameControl();

            if (that.GetOrganizationUnitsEntityList().Entities.length == 1) {
                //اگر تنها یک واحد سازمانی تعریف شده، نیازی به نمایش مجزای آن نیست
                //زیرا همان نام سازمان است که قبلا نمایش داده شده.
                that._UserActiveOrganizationUnitIDs = [that.GetOrganizationUnitsEntityList().Entities[0].GetFieldValue("ID")];
            }
            else {
                if (that.GetSystemUserOrganizationUnits().length == 0)
                    afw.ErrorDialog.Show("واحد های سازمانی مجاز شما تعیین نشده اند.");
                else
                    that._CreateActiveOrganizationUnitControl();
            }

            afw.uiApi.ShowProgress(afw.App.AppContainer);
            afw.uiApi.CallServerMethodAsync("cmn.GrantEssentialPermissions", null,
                function (result) {
                    if (result.HasError) {
                         
                        afw.Application.HandleError(result.ErrorMessage);
                    }
                    else {
                        afw.uiApi.AsyncFetchEntityList("cmn.FinancialYear", null, "StartDate", null, null, null,
                            function (result) {
                                if (result.HasError) {
                                     
                                    afw.Application.HandleError(result.ErrorMessage);
                                }
                                else {
                                    that._FinancialYearsEntityList = result.Value;

                                    afw.uiApi.AsyncFetchEntity("cmn.UserSettings", String.Format("SystemUser = '{0}'", afw.App.CurrentUserID), null,
                                        function (result) {
                                            if (result.HasError) {
                                                 
                                                afw.Application.HandleError("خطا در دریافت تنظیمات عمومی کاربر.\r\n" + result.ErrorMessage);
                                            }
                                            else {
                                                that._UserSettingsEntity = result.Value;

                                                var shouldSaveUserSettings = false;

                                                if (that._UserSettingsEntity == null) {
                                                    that._UserSettingsEntity = afw.uiApi.CreateNewEntity("cmn.UserSettings");
                                                    that._UserSettingsEntity.SetFieldValue("SystemUser", afw.App.CurrentUserID);
                                                    shouldSaveUserSettings = true;
                                                }
                                                else {
                                                    that._UserSettingsEntity.ChangeStatus = "Modify";
                                                }

                                                that._UserActiveFinancialYearID = that._UserSettingsEntity.GetFieldValue("ActiveFinancialYear");

                                                if (ValueIsEmpty(that._UserActiveFinancialYearID) && that._FinancialYearsEntityList.Entities.length > 0) {
                                                    var lastFinancialYearID = that._FinancialYearsEntityList.Entities[that._FinancialYearsEntityList.Entities.length - 1].GetFieldValue("ID");
                                                    that._UserActiveFinancialYearID = lastFinancialYearID;
                                                    that._UserSettingsEntity.SetFieldValue("ActiveFinancialYear", that._UserActiveFinancialYearID);
                                                    shouldSaveUserSettings = true;
                                                }

                                                if (shouldSaveUserSettings) {
                                                    afw.uiApi.ApplyEntityChanges(that._UserSettingsEntity);
                                                    that._UserSettingsEntity.ChangeStatus = "Modify";
                                                }

                                                that._CreateActiveFinancialYearControl();
                                                that._CreateTodayDateControl();

                                                afw.uiApi.HideProgress(afw.App.AppContainer);                                         
                                            }
                                        });
                                }
                            });
                    }
                });

            that._WorkflowForms = null;
            that._WorkflowDefs = null;
            that._WorkflowStages = null;

            afw.App.BindEvent("PreviewKeyUp", function (e) { that._App_PreviewKeyUp(e); });

            setTimeout(function () {
                that._CreateTodayDateControl();
            }, 3600000);
        },

        OpenWindowExists: function () {
            return afw.uiApi.GetActiveWindow() != null;
        },

        _App_PreviewKeyUp: function (e) {
            var that = this;

            if (e.Key == "F1" && e.CtrlKey) {
                acc.CreateNewAccDocEditForm();
            }
            else if (e.Key == "F2" && e.CtrlKey) {
                acc.ShowAccDocsList();
            }
            else if (e.Key == "F3" && e.CtrlKey) {
                cmn.CreateNewPersonEditForm();
            }
            else if (e.Key == "F6" && e.CtrlKey) {
                acc.ShowAccountReviewForm();
            }
            else if (e.Key.toLowerCase() == "q" && e.CtrlKey) {
                acc.ShowShenavarhaReportForm();
            }
        },

        IsMegaModavem: function () {
            var that = this;

            return that._IsMegaModavem;
        },

        GetCurrentUser: function () {
            var that = this;

            if (that._CurrentUser == null)
                that._CurrentUser = afw.uiApi.FetchEntityByID("afw.SystemUser", afw.App.CurrentUserID);

            return that._CurrentUser;
        },

        GetUserSettingsEntity: function () {
            var that = this;

            return that._UserSettingsEntity;
        },

        SaveUserSettings: function () {
            var that = this;

            afw.uiApi.ApplyEntityChanges(that._UserSettingsEntity);
            that._UserSettingsEntity.ChangeStatus = "Modify";
        },

        ShowPersonsListForm: function (personName) {
            var that = this;

            if (that._PersonsListControl != null && !that._PersonsListControl.IsDestroying && !ValueIsEmpty(personName))
                that._PersonsListControl.SetPersonNameFilterValue(personName);

            that._PersonsListControl = afw.DataListHelper.DisplayDataListInAppContainer("cmn.Persons", "اشخاص",
                {
                    PreviewIsEnabled: true,
                    VisibleColumns: ["FullName"/*, "CreationTime_Persian", "CreatorUser_Text"*/],
                    PersonName: personName
                });
        },

        CreateNewPersonEditForm: function (){
            var that = this;

            try {
                afw.uiApi.ShowProgress(afw.App.AppContainer);
                setTimeout(function () { }, 100);

                var personEntity = afw.uiApi.CreateNewEntity("cmn.Person");
                var personEditForm = null;

                if (cmn.OpenWindowExists())
                    personEditForm = afw.EntityHelper.OpenEntityFormInWindow(personEntity, "cmn.PersonEditForm", "New", { Title: "شخص جدید" });
                else
                    personEditForm = afw.EntityHelper.OpenEntityFormInMdiContainer(personEntity, "cmn.PersonEditForm", "New", { Title: "شخص جدید" });

                //personEditForm.BindEvent("Opened",
                //    function (e) {                        
                afw.uiApi.HideProgress(afw.App.AppContainer);
                //});
            }
            catch (ex) {
                afw.uiApi.HideProgress(afw.App.AppContainer);
            }
        },

        OpenSettingsForm: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("cmn.SettingsForm", "تنظیمات");
        },

        EditOrganizationInformation: function () {
            var that = this;

            var orgInfoEntity = afw.uiApi.FetchEntity("cmn.OrganizationInformation", "ParentOrganizationUnit is null");

            if (!ValueIsEmpty(orgInfoEntity)) {
                afw.EntityHelper.ShowEntityWindow(orgInfoEntity, "cmn.OrganizationInformationEditForm", "Edit");
            }
            else {
                orgInfoEntity = afw.uiApi.CreateNewEntity("cmn.OrganizationInformation");
                afw.EntityHelper.ShowEntityWindow(orgInfoEntity, "cmn.OrganizationInformationEditForm", "New");
            }
        },

        TryGetDefaultFinancialGroupID: function () {
            var that = this;

            if (that._DefaultFinancialGroupID == null) {
                var financialGroup = afw.uiApi.FetchEntity("cmn.FinancialGroup", "IsDefault = 1");
                if (financialGroup != null)
                    that._DefaultFinancialGroupID = financialGroup.GetFieldValue("ID");
            }

            return that._DefaultFinancialGroupID;
        },

        GetDefaultFinancialGroupID: function () {
            var that = this;

            var financialGroupID = that.TryGetDefaultFinancialGroupID();
            if (ValueIsEmpty(financialGroupID))
                throw "گروه مالی پیش فرضی تعیین نشده است.";

            return that._DefaultFinancialGroupID;
        },

        GetFinancialGroupEntity: function (organizationUnitID, financialYearID, financialDocTypeID) {
            var that = this;

            if (ValueIsEmpty(organizationUnitID))
                throw "organizationUnitID parameter is not set!";
            if (ValueIsEmpty(financialYearID))
                throw "financialYearID parameter is not set!";
            if (ValueIsEmpty(financialDocTypeID))
                throw "financialDocTypeID parameter is not set!";

            var financialGroupEntities = $.grep(that._FinancialGroupEntityList.Entities, function (o) {
                return o.GetFieldValue("FinancialYear") == financialYearID
                    && o.GetFieldValue("OrganizationUnit") == organizationUnitID
                    && o.GetFieldValue("FinancialDocType") == financialDocTypeID;
            });

            if (financialGroupEntities.length == 0) {
                var organizationUnit = that.GetOrganizationUnitByID(organizationUnitID);
                var financialYear = $.grep(that._FinancialYearsEntityList.Entities, function (o) { return o.GetFieldValue("ID") == financialYearID; })[0];
                var financialDocTypeTitle = afw.OptionSetHelper.GetOptionSetItemTitle(financialDocTypeID);

                throw String.Format("تنظیمات واحد سازمانی برای واحد {0} در سال مالی {1} و نوع سند مالی {2} موجود نیست.",
                    organizationUnit.GetFieldValue("Name"), financialYear.GetFieldValue("YearNo"), financialDocTypeTitle);
            }
            else
                return financialGroupEntities[0];
        },

        GetFinancialGroupTaxCalculationIsEnabled: function (organizationUnitID, financialYearID, financialDocTypeID) {
            var that = this;

            var financialGroupEntity = that.GetFinancialGroupEntity(organizationUnitID, financialYearID, financialDocTypeID);
            return financialGroupEntity.GetFieldValue("CalculationTax");
        },

        GetMeasurementUnitsEntityList: function () {
            var that = this;

            if (that._MeasurementUnitsEntityList == null)
                that._MeasurementUnitsEntityList = afw.uiApi.FetchEntityList("cmn.MeasurementUnit");
            return that._MeasurementUnitsEntityList;
        },


        //--------------OrganizationUnits--------------
        GetOrganizationUnitsEntityList: function () {
            var that = this;

            if (that._OrganizationUnitsEntityList == null)
                that._OrganizationUnitsEntityList = afw.uiApi.FetchEntityList("cmn.OrganizationInformation");

            return that._OrganizationUnitsEntityList;
        },

        GetOrganizationInformation: function () {
            var that = this;

            var orgUnits = that.GetOrganizationUnitsEntityList().Entities;

            if (orgUnits.length == 0)
                throw "اطلاعات سازمان در تنظیمات سیستم ثبت نشده است.";

            var orgInfo = $.grep(orgUnits, function (o) { return o.GetFieldValue("ParentOrganizationUnit") == null; })[0];
            return orgInfo;
        },

        GetSystemUserOrganizationUnits: function () {
            var that = this;

            if (that._SystemUserOrganizationUnits == null) {
                that._SystemUserOrganizationUnits = afw.uiApi.FetchEntityList("afw.SystemUserOrganizationUnit",
                    String.Format("SystemUser = '{0}'", afw.App.CurrentUserID)).Entities;
            }

            return that._SystemUserOrganizationUnits;
        },

        GetUserOrganizationUnitsDataSourceData: function () {
            var that = this;

            var systemUserOrganizationUnits = cmn.GetSystemUserOrganizationUnits();

            if (systemUserOrganizationUnits.length < 1)
                afw.ErrorDialog.Show("واحد سازمانی برای کاربر تعریف نشده است.");

            that._OrganizationUnitsEntityList.Entities
            var organizationUnitDataSource = [{ ID: '', Name: " " }]

            for (var i = 0; i < systemUserOrganizationUnits.length; i++) {
                var id = systemUserOrganizationUnits[i].GetFieldValue("OrganizationUnit");
                var name = that.GetOrganizationUnitNameByID(id);

                organizationUnitDataSource.push({ ID: id, Name: name });
            }

            return organizationUnitDataSource;
        },

        GetOrganizationUnitNameByID: function (organizationUnitID) {
            var that = this;

            var organizationUnitName = "";
            for (var j = 0 ; j < that._OrganizationUnitsEntityList.Entities.length; j++)
                if (organizationUnitID == that._OrganizationUnitsEntityList.Entities[j].GetFieldValue("ID"))
                    organizationUnitName = that._OrganizationUnitsEntityList.Entities[j].GetFieldValue("Name");

            return organizationUnitName;
        },

        GetUserActiveOrganizationUnitIDs: function () {
            var that = this;

            if (that._UserActiveOrganizationUnitIDs == null)
                that._UserActiveOrganizationUnitIDs = [];

            return that._UserActiveOrganizationUnitIDs;
        },

        GetUserActiveOrganizationUnitsFilterExpression: function () {
            var that = this;

            if (that._UserActiveOrganizationUnitsFilterExpression == null) {
                if (that._UserActiveOrganizationUnitIDs.length == 0)
                    that._UserActiveOrganizationUnitsFilterExpression = "OrganizationUnit is null";
                else if (that._UserActiveOrganizationUnitIDs.length == 1)
                    that._UserActiveOrganizationUnitsFilterExpression = String.Format("OrganizationUnit = '{0}'", that._UserActiveOrganizationUnitIDs[0]);
                else {
                    var idsString = "";
                    for (var i = 0; i < that._UserActiveOrganizationUnitIDs.length; i++) {
                        if (idsString != "")
                            idsString += ", ";

                        idsString += "'" + that._UserActiveOrganizationUnitIDs[i] + "'";
                    }

                    that._UserActiveOrganizationUnitsFilterExpression = String.Format("OrganizationUnit in ({0})", idsString);
                }
            }

            return that._UserActiveOrganizationUnitsFilterExpression;
        },

        GetOrganizationUnitByID: function (id) {
            var that = this;

            var allOrgUnits = that.GetOrganizationUnitsEntityList().Entities;
            var foundOrgUnits = $.grep(allOrgUnits, function (o) { return o.GetFieldValue("ID") == id });

            if (foundOrgUnits.length == 0)
                throw String.Format("OrganizationUnit by ID '{0}' not exists!", id);

            return foundOrgUnits[0];
        },

        //-----------------------------------------------

        GetUserOrganizationalPosition: function () {
            return afw.App.Session.GetFieldValue("SystemUser_Entity").GetFieldValue("OrganizationalPosition");
        },


        GetUserActiveFinancialYearID: function () {
            var that = this;

            return that._UserActiveFinancialYearID;
        },

        GetUserActiveFinancialYearEntity: function () {
            var that = this;

            var userActiveFinancialYearID = that.GetUserActiveFinancialYearID();

            if (ValueIsEmpty(userActiveFinancialYearID))
                return null;
            else {
                return $.grep(that._FinancialYearsEntityList.Entities,
                    function (o) { return o.GetFieldValue("ID").toLowerCase() == userActiveFinancialYearID.toLowerCase(); })[0];
            }
        },

        GetFinantialYearNo: function (finantialYearID) {
            var that = this;

            return $.grep(that._FinancialYearsEntityList.Entities,
                    function (o) { return o.GetFieldValue("ID").toLowerCase() == finantialYearID.toLowerCase(); })[0].GetFieldValue("YearNo");
        },

        GetFinantialYearEntity: function (finantialYearID) {
            var that = this;

            return $.grep(that._FinancialYearsEntityList.Entities,
                    function (o) { return o.GetFieldValue("ID").toLowerCase() == finantialYearID.toLowerCase(); })[0];
        },

        _CreateOrganizationNameControl: function () {
            var that = this;

            var organizationName = " ";

            try {
                var orgInfo = cmn.GetOrganizationInformation();
                organizationName = orgInfo.GetFieldValue("Name");
                if (!ValueIsEmpty(orgInfo.GetFieldValue("LatinName")))
                    if (orgInfo.GetFieldValue("LatinName") == "MegaModavem")
                        that._IsMegaModavem = true;
            }
            catch (ex) {
                afw.ErrorDialog.Show(ex);
            }

            var organizationNamePane = afw.App.AppContainer.AppStatusBarDockPanel.InsertPane(
                that._AppStatusBarDockPanel_UsablePaneIndex,
                { Size: that._GetTextWidthInPixels(organizationName) }, false);

            that._AppStatusBarDockPanel_UsablePaneIndex++;

            new afw.Label({
                ParentControl: organizationNamePane,
                Name: "OrganizationNameLabel",
                Text: organizationName
            });
        },

        _CreateActiveOrganizationUnitControl: function () {
            var that = this;

            var activeOrgUnitLabelWidth = 97;
            var activeOrgUnitStatusBarPaneIndex = that._AppStatusBarDockPanel_UsablePaneIndex;

            var activeOrganizationUnitPane = afw.App.AppContainer.AppStatusBarDockPanel.InsertPane(
                activeOrgUnitStatusBarPaneIndex, { Size: 350 }, true);

            that._AppStatusBarDockPanel_UsablePaneIndex++;

            var dockPanel = new afw.DockPanel({
                ParentControl: activeOrganizationUnitPane,
                Name: "ActiveOrganizationUnitDockPanel",
                Orientation: afw.Constants.Horizontal,
                PanesCount: 2
            });
            dockPanel.SetPanesSizeSetting([activeOrgUnitLabelWidth, "fill"]);

            var label = new afw.Label({
                ParentControl: dockPanel.Panes[0],
                Name: "OrganizationUnitLabel",
                Text: "| واحد سازمانی:"
            });

            var systemUserOrganizationUnits = that.GetSystemUserOrganizationUnits();
            var allOrgUnits = that.GetOrganizationUnitsEntityList().ToDataSourceData();

            if (systemUserOrganizationUnits.length == 1) {
                var userOrgUnit = that.GetOrganizationUnitByID(systemUserOrganizationUnits[0].GetFieldValue("OrganizationUnit"));
                var orgUnitName = userOrgUnit.GetFieldValue("Name");

                var organizationUnitLabel = new afw.Label({
                    ParentControl: dockPanel.Panes[1],
                    Name: "OrganizationUnitNameLabel",
                    Text: orgUnitName
                });

                afw.App.AppContainer.AppStatusBarDockPanel.SetPaneSizeSetting(
                    activeOrgUnitStatusBarPaneIndex, activeOrgUnitLabelWidth + that._GetTextWidthInPixels(orgUnitName));

                that._UserActiveOrganizationUnitIDs = [userOrgUnit.GetFieldValue("ID")];
            }
            else {
                var organizationUnitDropDownList = new afw.DropDownList({
                    ParentControl: dockPanel.Panes[1],
                    Name: "OrganizationUnitDropDownList",
                    LabelVisible: false,
                    DataTextField: "Name",
                    DataValueField: "ID"
                });

                var visibleOrgUnits = [{ ID: "All", Name: "همه واحد های مجاز" }];
                for (var i = 0; i < systemUserOrganizationUnits.length; i++) {
                    var orgUnit = that.GetOrganizationUnitByID(systemUserOrganizationUnits[i].GetFieldValue("OrganizationUnit"));
                    visibleOrgUnits.push({ ID: orgUnit.GetFieldValue("ID"), Name: orgUnit.GetFieldValue("Name") });
                }

                organizationUnitDropDownList.SetItemsDataSource(new kendo.data.DataSource({ data: visibleOrgUnits }));
                organizationUnitDropDownList.bind("ValueChanged", function (e) { that._OrganizationUnitDropDownList_ValueChanged(e); });
                organizationUnitDropDownList.SetValue("All");
            }
        },

        _OrganizationUnitDropDownList_ValueChanged: function (e) {
            var that = this;

            if (ValueIsEmpty(e.Sender.GetValue()) && that._OrganizationUnitsEntityList.Entities.length > 0) {
                e.Sender.SetValue("All");
                return;
            }
            else if (e.Sender.GetValue() == "All") {
                if (that.GetOrganizationUnitsEntityList().Entities.length == 0)
                    throw "اطلاعات سازمان در تنظیمات سیستم ثبت نشده است.";

                var systemUserOrganizationUnits = that.GetSystemUserOrganizationUnits();

                var orgUnitIds = [];
                for (var i = 0; i < systemUserOrganizationUnits.length; i++) {
                    var orgUnit = that.GetOrganizationUnitByID(systemUserOrganizationUnits[i].GetFieldValue("OrganizationUnit"));
                    orgUnitIds.push(orgUnit.GetFieldValue("ID"));
                }

                that._UserActiveOrganizationUnitIDs = orgUnitIds;
            }
            else
                that._UserActiveOrganizationUnitIDs = [e.Sender.GetValue()];

            that._UserActiveOrganizationUnitsFilterExpression = null;//to force recalculate
            that.CloseAllMdiContainerPages();
        },

        _CreateActiveFinancialYearControl: function () {
            var that = this;

            var activeFinancialYearPane = afw.App.AppContainer.AppStatusBarDockPanel.InsertPane(
                that._AppStatusBarDockPanel_UsablePaneIndex,
                { Size: 250 }, true);

            that._AppStatusBarDockPanel_UsablePaneIndex++;

            var dockPanel = new afw.DockPanel({
                ParentControl: activeFinancialYearPane,
                Name: "ActiveFinancialYearDockPanel",
                Orientation: afw.Constants.Horizontal,
                PanesCount: 2
            });
            dockPanel.SetPanesSizeSetting([97, "fill"]);

            var label = new afw.Label({
                ParentControl: dockPanel.Panes[0],
                Name: "FinancialYearLabel",
                Text: "| سال مالی فعال:"
            });

            var financialYearDropDownList = new afw.DropDownList({
                ParentControl: dockPanel.Panes[1],
                Name: "FinancialYearDropDownList",
                LabelVisible: false,
                DataTextField: "YearNo",
                DataValueField: "ID"
            });

            financialYearDropDownList.SetItemsDataSource(new kendo.data.DataSource({ data: that._FinancialYearsEntityList.ToDataSourceData() }));
            financialYearDropDownList.SetValue(that._UserActiveFinancialYearID);

            financialYearDropDownList.bind("ValueChanged", function (e) { that._FinancialYearDropDownList_ValueChanged(e); });
        },

        _FinancialYearDropDownList_ValueChanged: function (e) {
            var that = this;

            if (ValueIsEmpty(e.Sender.GetValue()) && that._FinancialYearsEntityList.Entities.length > 0) {
                var lastFinancialYearID = that._FinancialYearsEntityList.Entities[that._FinancialYearsEntityList.Entities.length - 1].GetFieldValue("ID");
                e.Sender.SetValue(lastFinancialYearID);
                return;
            }

            that.CloseAllMdiContainerPages();

            that._UserActiveFinancialYearID = e.Sender.GetValue();
            that._UserSettingsEntity.SetFieldValue("ActiveFinancialYear", that._UserActiveFinancialYearID);
            that.SaveUserSettings();
        },

        ShowCustomersCategory: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("cmn.CustomersCategoriesDefControl", "گروه بندی مشتریان");
        },

        //Workflow ---------------------------

        ShowWorkflowDashboard: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("cmn.WorkflowDashboard", "کارتابل گردش کار");
        },

        _GetWorkflowForms: function () {
            var that = this;

            if (that._WorkflowForms == null)
                that._WorkflowForms = afw.uiApi.FetchEntityList("cmn.WorkflowForm");
            return that._WorkflowForms;
        },

        GetWorkflowFormByName: function (workflowFormName) {
            var that = this;

            var workflowForms = that._GetWorkflowForms();
            var foundWorkflowForms = $.grep(workflowForms.Entities,
                function (o) { return o.GetFieldValue("Name") == workflowFormName; });

            if (foundWorkflowForms.length == 0)
                throw String.Format("WorkflowForm with Name '{0}' not exists!", workflowFormName);
            else
                return foundWorkflowForms[0];
        },

        _GetWorkflowFormByID: function (workflowFormId) {
            var that = this;

            var workflowForms = that._GetWorkflowForms();
            var foundWorkflowForms = $.grep(workflowForms.Entities, function (o) { return o.GetFieldValue("ID") == workflowFormId; });

            if (foundWorkflowForms.length == 0)
                throw String.Format("WorkflowForm with ID '{0}' not exists!", workflowFormName);
            else
                return foundWorkflowForms[0];
        },

        _GetWorkflowFormID: function (workflowFormName) {
            var that = this;

            return that.GetWorkflowFormByName(workflowFormName).GetFieldValue("ID").toLowerCase();
        },

        //_GetWorkflowSystemActions: function () {
        //    var that = this;

        //    if (that._WorkflowSystemActions == null)
        //        that._WorkflowSystemActions = afw.uiApi.FetchEntityList("cmn.WorkfolwSystemAction");
        //    return that._WorkflowSystemActions;
        //},

        GetWorkflowDefs: function () {
            var that = this;

            if (that._WorkflowDefs == null)
                that._WorkflowDefs = afw.uiApi.FetchEntityList("cmn.WorkflowDef", null, null, null, null, ["Stages"]);
            return that._WorkflowDefs;
        },

        TryGetWorkflowDefByFormName: function (workflowFormName) {
            var that = this;

            var workflowFormID = that._GetWorkflowFormID(workflowFormName);
            var workflowDefs = that.GetWorkflowDefs();
            var foundWorkflowDefs = $.grep(workflowDefs.Entities,
                function (o) { return o.GetFieldValue("WorkflowForm").toLowerCase() == workflowFormID; });

            if (foundWorkflowDefs.length == 0)
                return null;
            else
                return foundWorkflowDefs[0];
        },

        GetWorkflowDefByFormName: function (workflowFormName) {
            var that = this;

            var workflowDef = that.TryGetWorkflowDefByFormName(workflowFormName);

            if (workflowDef != null)
                return workflowDef;
            else
                throw String.Format("WorkflowDef for Form '{0}' not exists!", workflowFormName);
        },

        _GetWorkflowDefID: function (workflowFormName) {
            var that = this;

            return that.GetWorkflowDefByFormName(workflowFormName).GetFieldValue("ID");
        },

        _GetWorkflowStagesEntityList: function () {
            var that = this;

            if (that._WorkflowStages == null)
                that._WorkflowStages = afw.uiApi.FetchEntityList("cmn.WorkflowStage", null, "StageOrder");
            return that._WorkflowStages;
        },

        _GetWorkflowStagesByWorkflowDefID: function (workflowDefId) {
            var that = this;

            var allWorkflowStages = that._GetWorkflowStagesEntityList().Entities;

            return foundWorkflowStages = $.grep(allWorkflowStages, function (o) {
                return o.GetFieldValue("WorkflowDef").toLowerCase() == workflowDefId.toLowerCase();
            });
        },

        GetWorkflowStagesByFormName: function (workflowFormName) {
            var that = this;

            var workflowDefID = that._GetWorkflowDefID(workflowFormName);
            return that._GetWorkflowStagesByWorkflowDefID(workflowDefID);
        },

        TryGetFirstWorkflowStageID: function (workflowFormName) {
            var that = this;

            var firstWorkflowStageID = null;

            if (cmn.GetWorkflowDefByFormName(workflowFormName) != null) {
                var workflowStages = cmn.GetWorkflowStagesByFormName(workflowFormName);

                if (workflowStages.length != 0)
                    return workflowStages[0].GetFieldValue("ID");
            }

            return null;
        },

        GetWorkflowStageByName: function (workflowFormName, stageName) {
            var that = this;

            var workflowDefID = that._GetWorkflowDefID(workflowFormName);

            var allWorkflowStages = that._GetWorkflowStagesEntityList();
            var foundWorkflowStage = $.grep(allWorkflowStages.Entities, function (o) {
                return o.GetFieldValue("WorkflowDef") == workflowDefID 
                    && o.GetFieldValue("LatinName") == stageName;
            });

            if (foundWorkflowStage.length == 0)
                return null;
            else
                return foundWorkflowStage[0];
        },

        GetWorkflowStageByID: function (id) {
            var that = this;

            var workflowStages = that._GetWorkflowStagesEntityList();
            var foundWorkflowStages = $.grep(workflowStages.Entities, function (o) {
                return o.GetFieldValue("ID").toLowerCase() == id.toLowerCase();
            });

            if (foundWorkflowStages.length == 0)
                throw String.Format("WorkflowStage with ID '{0}' not exists!", id);
            else
                return foundWorkflowStages[0];
        },

        _GetWorkflowStageButtonTitle: function (id) {
            var that = this;

            return that.GetWorkflowStageByID(id).GetFieldValue("ButtonTitle");
        },

        GetWorkflowStageOrgPostions: function () {
            var that = this;

            return afw.uiApi.FetchEntityList("cmn.WorkflowStageOrgPostion");
        },

        _UserHasAccessToWorkflowStage: function (workflowFormName, stageID) {
            var that = this;

            var userOrganizationalPosition = that.GetUserOrganizationalPosition();
            var workflowStageOrgPostions = that.GetWorkflowStageOrgPostions();
            var workflowDef = that.GetWorkflowDefByFormName(workflowFormName);

            if (userOrganizationalPosition == null) {
                afw.ErrorDialog.Show('سمت سازمانی کاربر تعیین نشده است.');
                return false;
            }

            var foundWorkflowStageOrgPostions = $.grep(workflowStageOrgPostions.Entities, function (o) {
                        return o.GetFieldValue("WorkflowStage").toLowerCase() == stageID.toLowerCase()
                    && o.GetFieldValue("OrgPostion").toLowerCase() == userOrganizationalPosition.toLowerCase()
                    && o.GetFieldValue("WorkflowDef") == workflowDef.GetFieldValue("ID");
                    });

                return foundWorkflowStageOrgPostions.length > 0;
        },

        GetUserPermittedWorkflowStages: function (workflowFormName) {
            var that = this;

            var userOrganizationalPosition = that.GetUserOrganizationalPosition();
            if (userOrganizationalPosition == null) {
                afw.ErrorDialog.Show('سمت سازمانی کاربر تعیین نشده است.'); 
                return [];
            }

            var workflowStages = $.grep(that._WorkflowStages.Entities, function (o) {
                return that._UserHasAccessToWorkflowStage(workflowFormName, o.GetFieldValue("ID").toLowerCase());
            });
        },

        GetFormAvailableWorkflowStages: function (workflowFormName, formEntity) {
            var that = this;

            var userOrganizationalPosition = that.GetUserOrganizationalPosition();
            var formCurrentStageID = formEntity.GetFieldValue("WorkflowStage");
            var workflowStages = that.GetWorkflowStagesByFormName(workflowFormName);

            if (userOrganizationalPosition == null) {
                afw.ErrorDialog.Show('سمت سازمانی کاربر تعیین نشده است.');

                return foundworkflowStages = $.grep(workflowStages.Entities, function (o) {
                    return o.GetFieldValue("ID").toLowerCase() == formCurrentStageID;
                });
            }

            return foundworkflowStages = $.grep(workflowStages, function (o) {
                return that._UserHasAccessToWorkflowStage(workflowFormName, o.GetFieldValue("ID").toLowerCase())
                    || o.GetFieldValue("ID").toLowerCase() == formCurrentStageID;
            });
        },

        GetFormAvailableWorkflowStagesAsDataSourceData: function (workflowFormName, formEntity) {
            var that = this;

            var workflowStageEntities = that.GetFormAvailableWorkflowStages(workflowFormName, formEntity);
            var entityList = afw.uiApi.CreateEntityList("cmn.WorkflowStage");
            entityList.Entities = workflowStageEntities;

            return entityList.ToDataSourceData();
        },

        InitFormForWorkflow: function (form, workflowFormName) {
            var that = this;

            var workflowDef = that.TryGetWorkflowDefByFormName(workflowFormName);
            if (workflowDef == null)
                return;

            var stages = that._GetWorkflowStagesByWorkflowDefID(workflowDef.GetFieldValue("ID"));
            if (stages.length == 0)
                return;

            var formBindableEntity = form._BindableEntity;
            var currentStageID = formBindableEntity.get("WorkflowStage");

            if (currentStageID == null) {
                currentStageID = stages[0].GetFieldValue("ID");
                formBindableEntity.set("WorkflowStage", currentStageID);
            }

            form._BindableEntity.GetEntity().SetFieldValue("WorkflowStage", stages.Entities[0].GetFieldValue("ID"));

            var buttonTitle = that._GetWorkflowStageButtonTitle(stages.Entities[0].GetFieldValue("ID"));
            if (buttonTitle != null) {
                if (that._UserHasAccessToWorkflowStage(workflowFormName, stages.Entities[0].GetFieldValue("ID"))) {
                    form._Toolbar.AddButton("RunCurrentWorkflowStage", buttonTitle, { Image: "resource(cmn.WorkflowIcon)", BackColor: "#00b33c" });

                    if (!that._IsFirstWorkflowStage(stages.Entities[0].GetFieldValue("ID")) && !that._WorkflowStageHasSystemAction(stages.Entities[0].GetFieldValue("ID")))
                        form._Toolbar.AddButton("ReturnToPriorStage", "بازگشت به مرحله قبل", { Image: "resource(cmn.WorkflowIcon)", BackColor: "#00b33c" });

                    form._Toolbar.bind("ButtonClick", function (e) { that._WorkflowFormToolbar_ButtonClick(e); });
                }
            }
        },

        _WorkflowFormToolbar_ButtonClick: function (e) {
            var that = this;

            var form = e.Sender.GetContainerWindow();
            var currentWorkflowStage = that.GetWorkflowStageByID(form._BindableEntity.GetEntity().GetFieldValue("WorkflowStage"));
            var stages = that._GetWorkflowStagesByWorkflowDefID(currentWorkflowStage.GetFieldValue("WorkflowDef"));

            if (e.ButtonKey == "RunCurrentWorkflowStage") {
                if (that._IsLastWorkflowStage(currentWorkflowStage))
                    throw "RunCurrentWorkflowStage button is clicked on last workflow stage!";

                for (index = 0; index < stages.length; index++) {
                    if (stages[index].GetFieldValue("StageOrder") == currentWorkflowStage.GetFieldValue("StageOrder")) {
                        form._BindableEntity.GetEntity().SetFieldValue("WorkflowStage", stages[index + 1].GetFieldValue("ID"));
                        afw.uiApi.ApplyEntityChanges(form._BindableEntity.GetEntity());
                        form.Close();
                        return;
                    }
                }
            }
            else if (e.ButtonKey == "ReturnToPriorStage") {
                if (that._IsLastWorkflowStage(currentWorkflowStage))
                    throw "ReturnToPriorStage button is clicked on first workflow stage!";

                for (index = 0; index < stages.length; index++) {
                    if (stages[index].GetFieldValue("StageOrder") == currentWorkflowStage.GetFieldValue("StageOrder")) {
                        form._BindableEntity.GetEntity().SetFieldValue("WorkflowStage", stages[index - 1].GetFieldValue("ID"));
                        afw.uiApi.ApplyEntityChanges(form._BindableEntity.GetEntity());
                        form.SetDialogResult("Ok");
                        form.Close();
                    }
                }
            }
        },

        _WorkflowStageHasSystemAction: function (workflowStageId) {
            var that = this;

            var foundWorkflowStages = $.grep(that._GetWorkflowStagesEntityList().Entities, function (o) { return o.GetFieldValue("ID").toLowerCase() == workflowStageId.toLowerCase(); });
            var workflowStage = foundWorkflowStages[0];

            var systemAction = workflowStage.GetFieldValue("SystemAction");
            if (systemAction != null)
                return true;
            else
                return false;
        },

        _IsFirstWorkflowStage: function (workflowStageId) {
            var that = this;

            var workflowStage = that.GetWorkflowStageByID(workflowStageId);
            var workflowStageNumber = workflowStage.GetFieldValue("StageOrder");
            var stages = that._GetWorkflowStagesByWorkflowDefID(workflowStage.GetFieldValue("WorkflowDef"));

            if (workflowStageNumber == stages[0].GetFieldValue("StageOrder"))
                return true;
            else
                return false;
        },

        _IsLastWorkflowStage: function (workflowStage) {
            var that = this;

            var workflowStageNumber = workflowStage.GetFieldValue("StageOrder");
            var stages = that._GetWorkflowStagesByWorkflowDefID(workflowStage.GetFieldValue("WorkflowDef"));

            if (workflowStageNumber == stages[stages.length - 1].GetFieldValue("StageOrder"))
                return true;
            else
                return false;
        },

        InitFinancialOpList: function (options, financialYearID) {
            var that = this;

            if (financialYearID != null) {
                if (ValueIsEmpty(options.BaseFilterExpression))
                    options.BaseFilterExpression = String.Format("FinancialYear = '{0}'", financialYearID);
                else
                    options.BaseFilterExpression = String.Format("FinancialYear = '{0}' and ({1})", financialYearID, options.BaseFilterExpression);
            }
        },

        AddFilterToFilterExpression: function (currentFilterExpression, newFilter) {
            var that = this;

            if (!ValueIsEmpty(currentFilterExpression))
                currentFilterExpression = currentFilterExpression.trim();

            if (ValueIsEmpty(newFilter))
                newFilter = newFilter.trim();

            if (ValueIsEmpty(newFilter))
                return currentFilterExpression;

            if (!ValueIsEmpty(currentFilterExpression))
                return currentFilterExpression + " and " + newFilter;
            else
                return newFilter;
        },

        AddActiveFinancialYearFilterToFilterExpression: function (currentFilterExpression) {
            var that = this;

            var activeFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            if (activeFinancialYearEntity != null) {
                return cmn.AddFilterToFilterExpression(
                    currentFilterExpression,
                    String.Format("FinancialYear = '{0}'", activeFinancialYearEntity.GetFieldValue("ID")));
            }
        },

        CloseAllMdiContainerPages: function () {
            var mdiTabControl = afw.App.AppContainer.MdiTabControl;

            while (mdiTabControl.GetTabCount() > 0) {
                mdiTabControl.CloseTabByIndex(0);
            }
        },

        _GetTextWidthInPixels: function (text) {
            return text.length * 5 + 20;
        },

        //پیدا کردن ایندکس مثلا دومین - در متن
        GetIndexOfChar: function (text, requestedChar, repeatNumberBefore) {
            var count = 0;

            for (var i = 0 ; i < text.length ; i++)
                if (text.charAt(i) == requestedChar) {
                    if (count == repeatNumberBefore)
                        return i;
                    count++;
                }

            return -1;
        },

        _CreateTodayDateControl: function () {
            var that = this;

            var todayDateTime = "| امروز: ";
            todayDateTime += afw.DateTimeHelper.GetServerPersianDateTime().split(' ')[0];

            var todayDateTimePane = null;
            if (ValueIsEmpty(afw.App.AppContainer.AppStatusBarDockPanel.FindControl("TodayDateTimeLabel"))) {
                if (ValueIsEmpty(afw.App.AppContainer.AppStatusBarDockPanel.FindControl("ActiveOrganizationUnitDockPanel"))) {
                    todayDateTimePane = afw.App.AppContainer.AppStatusBarDockPanel.InsertPane(
                    that._AppStatusBarDockPanel_UsablePaneIndex + 1,
                    { Size: that._GetTextWidthInPixels(todayDateTime) }, true);
                }
                else {
                    todayDateTimePane = afw.App.AppContainer.AppStatusBarDockPanel.InsertPane(
                   that._AppStatusBarDockPanel_UsablePaneIndex,
                   { Size: that._GetTextWidthInPixels(todayDateTime) }, true);

                    that._AppStatusBarDockPanel_UsablePaneIndex++;
                }

                new afw.Label({
                    ParentControl: todayDateTimePane,
                    Name: "TodayDateTimeLabel",
                    Text: todayDateTime
                });
            }
            else {
                afw.App.AppContainer.AppStatusBarDockPanel.FindControl("TodayDateTimeLabel").SetText(todayDateTime);
            }
        }
    }
})();