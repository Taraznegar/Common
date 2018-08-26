(function () {
    var typeName = "cmn.PersonsControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var PersonsControl = baseType.extend({
        events: events,

        GetType: function () {
            return cmn.PersonsControl;
        },

        init: function (options) {
            var that = this;

            that._FilterControl = null;
            that._GridContainerWrapperDockPanel = null;
            that._PreviewControl = null;

            options.LoadDataOnInit = false;

            options.DataListFullName = "cmn.Persons";
            afw.DataListControl.fn.init.call(that, options);

            //that._VDockPanel.SetPaneSizeSetting(2, 100);
            that._QuickSearchDockPanel = that.FindControl(that.GetName() + "_QuickSearchDockPanel");

            //that._QuickSearchDockPanel.AppendPane();
            //that._QuickSearchDockPanel.SetPaneSizeSetting(0, 300);
            //that._QuickSearchDockPanel.SetPaneSizeSetting(1, "fill");
            //that._FilterControl = afw.uiApi.CreateSavedFormByName(that._QuickSearchDockPanel.Panes[1], "cmn.PersonsFilterControl");

            that._VDockPanel.InsertPane(2, { Size: 90 }, true);
            that._FilterControl = afw.uiApi.CreateSavedFormByName(that._VDockPanel.Panes[2], "cmn.PersonsFilterControl");

            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });
            that._EntitiesGridView.bind("SelectedRowsChanged", function (e) { that._EntitiesGridView_SelectedRowsChanged(e); });

            var personName = null;
            if ("PersonName" in options && options.PersonName != null) {
                personName = options.PersonName;
                that._FilterControl.ClearFilters();
                that._FilterControl.SetColumnFilterValue("PersonName", personName);
            }
            else
                personName = null;

            if ("PreviewIsEnabled" in options)
                that._PreviewIsEnabled = options.PreviewIsEnabled;
            else
                that._PreviewIsEnabled = false;//default value

            if ("PersonRoleFilterIsDisabled" in options) {
                that._FilterControl.SetColumnFilterDisabled("PersonName");
            }

            if (that.GetContainerWindow() != null)
                that._EntityFormContainerType = "Window";
            else
                that._EntityFormContainerType = "MdiContainer";

            that._LoadData();
        },

        _GetEntitiesGridViewContainer: function () {
            var that = this;

            if (!that._VDockPanel.Panes[3].HasChildControls) {
                that._GridContainerWrapperDockPanel = new afw.DockPanel({
                    ParentControl: that._VDockPanel.Panes[3],
                    Name: "GridContainerWrapperDockPanel",
                    Orientation: "Horizontal",
                    PanesCount: 2
                });

                that._GridContainerWrapperDockPanel.SetPaneSizeSetting(1, 1);
            }

            return that._GridContainerWrapperDockPanel.Panes[0];
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");

            var containerWindow = that.GetContainerWindow();

            if (containerWindow == null || containerWindow.GetName() != "EntitySelectWindow") {
                that._Toolbar.AddButton("CreateCustomer", "ایجاد مشتری", { Image: "resource(cmn.CustomerIcon)" });
                that._Toolbar.AddButton("CreateConnectedPerson", "شخص مرتبط", { Image: "resource(cmn.Add)" });
                that._Toolbar.SetButtonEnabled("CreateConnectedPerson", false);

                that._Toolbar.AddButton("SalesProformaInvoices", "پیش فاکتور ها", { Image: "resource(ps.Invoice)" });
                that._Toolbar.AddButton("CreateSalesProformaInvoice", "پیش فاکتور", { Image: "resource(cmn.Add)" });
            }
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);

            var selectedPersonID = null;
            var selectedPersonFullName = null;
            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            if (selectedEntities.length != 0) {
                selectedPersonID = selectedEntities[0].DataItem["ID"];
                selectedPersonFullName = selectedEntities[0].DataItem["FullName"];
            }

            if (buttonKey == "CreateCustomer") {
                var roleName = "Customer";
                var personEntity = afw.uiApi.CreateNewEntity("cmn.Person");
                //var roleCustomer = afw.uiApi.FetchEntity("cmn.PersonRole", "Name = 'Customer'")

                var customerWindow = null;

                if (cmn.OpenWindowExists())
                    customerWindow = afw.EntityHelper.OpenEntityFormInWindow(personEntity, "cmn.PersonEditForm", "New", {
                        RoleName: roleName,
                        Title: "مشتری جدید"
                    });
                else
                    customerWindow = afw.EntityHelper.OpenEntityFormInMdiContainer(personEntity, "cmn.PersonEditForm", "New", {
                        RoleName: roleName,
                        Title: "مشتری جدید"
                    });

                customerWindow.bind("Close", function (e) { that._CustomerWindows_Close(e); });
            }

            if (buttonKey == "SalesProformaInvoices") {
                ps.OpenSalesProformaInvoicesForm(selectedPersonID);
            }

            if (buttonKey == "CreateSalesProformaInvoice") {
                if (cmn.GetUserActiveFinancialYearID() == null) {
                    afw.ErrorDialog.Show("سال مالی فعال انتخاب نشده است.");
                    return;
                }

                var entity = afw.uiApi.CreateNewEntity("ps.SalesInvoice");
                entity.SetFieldValue("IsProforma", true);
                entity.SetFieldValue("Customer", selectedPersonID);

                if (that._PreviewControl != null) {
                    var selectedConnectedPersonEntities = that._PreviewControl._ConnectedPersonsGridView.GetSelectedRows();
                    if (selectedConnectedPersonEntities.length != 0 && selectedConnectedPersonEntities[0].DataItem["ID"] != selectedPersonID)
                        entity.SetFieldValue("ConnectedPerson", selectedConnectedPersonEntities[0].DataItem["ID"]);
                }

                if (cmn.OpenWindowExists())
                    afw.EntityHelper.OpenEntityFormInWindow(entity, "ps.SalesInvoiceEditForm", "New");
                else
                    afw.EntityHelper.OpenEntityFormInMdiContainer(entity, "ps.SalesInvoiceEditForm", "New");              
            }

            if (buttonKey == "CreateConnectedPerson") {
                var connectedPersonWindow = afw.uiApi.OpenSavedWindow("cmn.ConnectedPersonQuickInsertForm",
                   {
                       Modal: true,
                       ParentPersonID: selectedPersonID,
                       ParentPersonDisplayName: selectedPersonFullName
                   });

                connectedPersonWindow.bind("Close", function (e) {
                    if (e.Sender.GetDialogResult() == "Ok")
                        if (that._PreviewIsEnabled)
                            that._ShowPreviewPanel();
                });
            }

        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

            that.LoadData();
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filter = afw.DataListControl.fn._GetTotalFilterExpression.call(that);
            if (that._FilterControl != null && !ValueIsEmpty(that._FilterControl.GetFilterExpression())) {
                if (!ValueIsEmpty(filter))
                    filter += " and ";
                filter += that._FilterControl.GetFilterExpression();
            }

            return filter;
        },

        _CustomerWindows_Close: function (e) {
            var that = this;

            if (e.Sender._DialogResult == "Ok")
                that._LoadData();
        },

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _ShowEntityWindow: function (entity, formMode) {
            var that = this;

            return afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode);
        },

        _OnEntityWindowOpened: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowOpened.call(that, entityWindow);
        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        },

        _EntitiesGridView_SelectedRowsChanged: function (e) {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            if (selectedEntities.length != 0) {
                if (that._Toolbar.ButtonExists("CreateConnectedPerson"))
                    that._Toolbar.SetButtonEnabled("CreateConnectedPerson", true);
                if (that._Toolbar.ButtonExists("SalesProformaInvoices"))
                    that._Toolbar.SetButtonEnabled("SalesProformaInvoices", true);
                if (that._Toolbar.ButtonExists("CreateSalesProformaInvoice"))
                    that._Toolbar.SetButtonEnabled("CreateSalesProformaInvoice", true);
            }
            else {
                if (that._Toolbar.ButtonExists("CreateConnectedPerson"))
                    that._Toolbar.SetButtonEnabled("CreateConnectedPerson", false);
                if (that._Toolbar.ButtonExists("SalesProformaInvoices"))
                    that._Toolbar.SetButtonEnabled("SalesProformaInvoices", false);
                if (that._Toolbar.ButtonExists("CreateSalesProformaInvoice"))
                    that._Toolbar.SetButtonEnabled("CreateSalesProformaInvoice", false);
            }

            if (that._PreviewIsEnabled) {
                if (e.SelectedRows.length != 0)
                    that._ShowPreviewPanel();
                else
                    that._HidePreviewPanel();
            }
        },

        _ShowPreviewPanel: function () {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            var selectedPersonID = selectedEntities[0].DataItem["ID"];

            that._GridContainerWrapperDockPanel.SetPaneSizeSetting(0, 300);
            that._GridContainerWrapperDockPanel.SetPaneSizeSetting(1, "fill");

            if (that._PreviewControl == null) {
                that._PreviewControl = afw.uiApi.CreateSavedControl("cmn.PersonPreviewControl2",
                    {
                        Name: "PersonPreviewControl",
                        ParentControl: that._GridContainerWrapperDockPanel.Panes[1]
                    });
            }
            else
                that._PreviewControl.SetVisible(true);

            afw.uiApi.ShowProgress(that._PreviewControl);
            afw.uiApi.CallServerMethodAsync("cmn.GetPersonPreviewInfo", [selectedPersonID, 2],
                function (result) {
                    afw.uiApi.HideProgress(that._PreviewControl);

                    if (result.HasError)
                        afw.Application.HandleError(result.ErrorMessage);
                    else {
                        var personInfoEntity = result.Value;

                        //skip if another row is selected after async load or something wrong happened:
                        var currentSelectedEntities = that._EntitiesGridView.GetSelectedRows();
                        if (currentSelectedEntities.length != 0) {
                            var currentSelectedPersonID = currentSelectedEntities[0].DataItem["ID"];

                            if (personInfoEntity.GetFieldValue("ID") == currentSelectedPersonID)
                                that._PreviewControl.SetPersonInfo(personInfoEntity);
                        }
                    }
                });
        },

        _HidePreviewPanel: function () {
            var that = this;

            if (that._PreviewControl != null)
                that._PreviewControl.SetVisible(false);

            that._GridContainerWrapperDockPanel.SetPaneSizeSetting(0, "fill");
            that._GridContainerWrapperDockPanel.SetPaneSizeSetting(1, 1);
        },

        SetPersonNameFilterValue: function (personName) {
            var that = this;

            that._FilterControl.ClearFilters();
            that._FilterControl.SetColumnFilterValue("PersonName", personName);
            //that._EntitiesGridView.SelectRowByIndex(0);
        }
    });

    //Static Members:

    PersonsControl.TypeName = typeName;
    PersonsControl.BaseType = baseType;
    PersonsControl.Events = events;


    cmn.PersonsControl = PersonsControl;
})();
