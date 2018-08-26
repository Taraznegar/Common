(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return acc.AccDocManagmentDashboardForm;
        },

        init: function (options) {
            var that = this;

            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._OperationType = null;

            that._DocFilterComboBox = that.FindControl("DocFilterComboBox");
            that._OrganizationUnitLookup = that.FindControl("OrganizationUnitLookup");
            that._FinancialDocTypeOptionSet = that.FindControl("FinancialDocTypeOptionSet");

            that._OperationTypePanel = that.FindControl("OperationTypePanel");
            that._OperationPanel = that.FindControl("OperationPanel");
            that._AccDocOperationPanel = that.FindControl("AccDocOperationPanel");

            that._MoveUpButton = that.FindControl("MoveUpButton");
            that._MoveDownButton = that.FindControl("MoveDownButton");
            that._AccDocDeleteButton = that.FindControl("AccDocDeleteButton");
            that._AccDocGenerateButton = that.FindControl("AccDocGenerateButton");
            that._ViewItemsButton = that.FindControl("OpenTankhahItemsButton");

            that._MoveUpButton.bind("Click", function (e) { that._MoveUpButton_Click(e); });
            that._MoveDownButton.bind("Click", function (e) { that._MoveDownButton_Click(e); });
            that._AccDocDeleteButton.bind("Click", function (e) { that._AccDocDeleteButton_Click(e); });
            that._AccDocGenerateButton.bind("Click", function (e) { that._AccDocGenerateButton_Click(e); });
            that._ViewItemsButton.bind("Click", function (e) { that._ViewItemsButton_Click(e); });

            that._AccDocStatus = "All";

            var docFilterComboBoxItems = [
                { Key: "All", Title: "همه" },
                { Key: "IsDoc", Title: "سند شده" },
                { Key: "IsNotDoc", Title: "سند نشده" }];
            that._DocFilterComboBox.SetItemsDataSource(docFilterComboBoxItems);
            that._DocFilterComboBox.SetValue("All");

            that._DocFilterComboBox.bind("ValueChanged", function (e) { that._FilterControl_ValueChanged(e); });
            that._OrganizationUnitLookup.bind("ValueChanged", function (e) { that._FilterControl_ValueChanged(e); });
            that._FinancialDocTypeOptionSet.bind("ValueChanged", function (e) { that._FilterControl_ValueChanged(e); });

            that.CreateCountingGridView();
            that.CreateOperationsGridView();
            that.CreateAccDocOperationsGridView();

        },

        _FilterControl_ValueChanged: function (e) {
            var that = this;

            that._FillCountingItemsGrid();
        },

        CreateCountingGridView: function () {
            var that = this;

            that._CountingGridView = new afw.GridView({
                ParentControl: that._OperationTypePanel,
                Name: that.GetName() + "_CountingGridView",
                FillParent: true,
                Columns: [
                    {
                        title: "OperationType",
                        field: "OperationType",
                        rightToLeft: true,
                        width: 1
                    },
                    {
                        title: "ردیف",
                        field: "RowNumber",
                        rightToLeft: true,
                        width: 50,
                        valuesDisplayMethod: "number"
                    },
                    {
                        title: "نوع عملیات",
                        field: "OperationTypeText",
                        rightToLeft: true,
                        width: 150
                    },
                    {
                        title: "تعداد",
                        field: "Quantity",
                        rightToLeft: true,
                        width: 50,
                        valuesDisplayMethod: "number"
                    },
                ],

                SelectionMode: "SingleRow"
            });

            that._CountingGridView.bind("SelectedRowsChanged", function (e) { that._CountingGridView_SelectedRowsChanged(e); });

            that._FillCountingItemsGrid();
            },

        _SortCountingItems: function () {
            var that = this;

            if (ValueIsEmpty(that._CountingItems))
                return;

            that._CountingItems.Entities = that._CountingItems.Entities.sort(
                function (item1, item2) {
                    if (item1.GetFieldValue("RowNumber") < item2.GetFieldValue("RowNumber"))
                        return -1;
                    else if (item1.GetFieldValue("RowNumber") > item2.GetFieldValue("RowNumber"))
                        return 1;
                    else
                        return 0;
                });
        },

        _FillCountingItemsGrid: function () {
            var that = this;

            that._CountingItems = afw.uiApi.CallServerMethodSync("acc.GetCountingItems", [that._GetCountingItemsFilterExpresstion(true)]);
            //that._SortCountingItems();

            that._CountingGridView.GetDataSource().data(that._CountingItems.ToDataSourceData());

            if (that._CountingItems.Entities.length > 0)
                that._CountingGridView.SelectRowByIndex(0);
            
            if (!ValueIsEmpty(that._AccDocOperationGridView)) {
                that._AccDocOperations = afw.uiApi.CreateEntityList();
                that._AccDocOperationGridView.GetDataSource().data(that._AccDocOperations.ToDataSourceData());
            }
        },

        _CountingGridView_SelectedRowsChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._OperationGridView))
                that._FillOperationsGrid();            
        },

        CreateOperationsGridView: function () {
            var that = this;

            that._OperationGridView = new afw.GridView({
                ParentControl: that._OperationPanel,
                Name: that.GetName() + "_OperationGridView",
                FillParent: true,
                Columns: [
                    {
                        title: "ID",
                        field: "ID",
                        rightToLeft: true,
                        width: 1
                    },
                    {
                        title: "شماره",
                        field: "RowNumber",
                        rightToLeft: true,
                        width: 70,
                        valuesDisplayMethod: "number"
                    },
                    {
                        title: "زمان ایجاد",
                        field: "CreationTime",
                        rightToLeft: true,
                        width: 100
                    },
                    {
                        title: "تاریخ صدور",
                        field: "IssueDate",
                        rightToLeft: true,
                        width: 100
                    },
                    {
                        title: "واحد سازمانی",
                        field: "OrganizationUnitName",
                        rightToLeft: true,
                        width: 120
                    },
                    {
                        title: "نوع سند مالی",
                        field: "FinancialDocTypeTitle",
                        rightToLeft: true,
                        width: 100
                    },
                    {
                        title: "مشتری",
                        field: "CustomerName",
                        rightToLeft: true,
                        width: 100
                    },
                    {
                        title: "کاربر ثبت کننده",
                        field: "User_Text",
                        rightToLeft: true,
                        width: 100
                    },
                    {
                        title: "توضیحات",
                        field: "Description",
                        rightToLeft: true,
                        width: 120
                    },
                    {
                        title: "سند",
                        field: "DocNo",
                        rightToLeft: true,
                        width: 70,
                        valuesDisplayMethod: "number"
                    },
                    {
                        title: "AccDoc",
                        field: "AccDoc",
                        rightToLeft: true,
                        width: 1,
                    }
                ],

                SelectionMode: "SingleRow"
            });

            that._OperationGridView.bind("SelectedRowsChanged", function (e) { that._OperationGridView_SelectedRowsChanged(e); });

            that._FillOperationsGrid();
        },

        _SortOperations: function () {
            var that = this;

            if (ValueIsEmpty(that._Operations))
                return;

            that._Operations.Entities = that._Operations.Entities.sort(
                function (item1, item2) {
                    if (item1.GetFieldValue("RowNumber") < item2.GetFieldValue("RowNumber"))
                        return -1;
                    else if (item1.GetFieldValue("RowNumber") > item2.GetFieldValue("RowNumber"))
                        return 1;
                    else
                        return 0;
                });
        },

        _FillOperationsGrid: function () {
            var that = this;
            
            var selectedEntities = that._CountingGridView.GetSelectedRows();
            if (selectedEntities.length > 0) {
                that._OperationType = selectedEntities[0].DataItem["OperationType"];

                that._Operations = afw.uiApi.CallServerMethodSync("acc.GetOperations",
                    [that._OperationType, that._FinancialYearID, that._GetOperationItemsFilterExpresstion()]);

                //that._SortOperations();

                that._OperationGridView.GetDataSource().data(that._Operations.ToDataSourceData());

                if (that._OperationType == "FinancialDeclaration") {
                    that._OperationGridView.SetColumnVisible("CustomerName", false);
                    that._OperationGridView.SetColumnVisible("Description", false);
                }
                else {
                    that._OperationGridView.SetColumnVisible("CustomerName", true);
                    that._OperationGridView.SetColumnVisible("Description", true);
                }
            }
        },

        _OperationGridView_SelectedRowsChanged: function (e) {
            var that = this;

            var selectedEntities = that._OperationGridView.GetSelectedRows();
            if (selectedEntities.length > 0) {
                var docNo = selectedEntities[0].DataItem["DocNo"];
                if (!ValueIsEmpty(docNo))
                    that._AccDocDeleteButton.SetEnabled(true);
                else
                    that._AccDocDeleteButton.SetEnabled(false);
            }
        },

        CreateAccDocOperationsGridView: function () {
            var that = this;

            that._AccDocOperationGridView = new afw.GridView({
                ParentControl: that._AccDocOperationPanel,
                Name: that.GetName() + "_AccDocOperationGridView",
                FillParent: true,
                Columns: [
                     {
                         title: "ID",
                         field: "ID",
                         rightToLeft: true,
                         width: 1
                     },
                     {
                         title: "شماره",
                         field: "RowNumber",
                         rightToLeft: true,
                         width: 70,
                         valuesDisplayMethod: "number"
                     },
                     {
                         title: "زمان ایجاد",
                         field: "CreationTime",
                         rightToLeft: true,
                         width: 100
                     },
                     {
                         title: "تاریخ صدور",
                         field: "IssueDate",
                         rightToLeft: true,
                         width: 100
                     },
                     {
                         title: "واحد سازمانی",
                         field: "OrganizationUnitName",
                         rightToLeft: true,
                         width: 120
                     },
                     {
                         title: "نوع سند مالی",
                         field: "FinancialDocTypeTitle",
                         rightToLeft: true,
                         width: 100
                     },
                     {
                         title: "مشتری",
                         field: "CustomerName",
                         rightToLeft: true,
                         width: 100
                     },
                     {
                         title: "کاربر ثبت کننده",
                         field: "User_Text",
                         rightToLeft: true,
                         width: 100
                     },
                     {
                         title: "توضیحات",
                         field: "Description",
                         rightToLeft: true,
                         width: 120
                     },
                     {
                         title: "سند",
                         field: "DocNo",
                         rightToLeft: true,
                         width: 70,
                         valuesDisplayMethod: "number"
                     },
                     {
                         title: "AccDoc",
                         field: "AccDoc",
                         rightToLeft: true,
                         width: 1,
                     }
                ],

                SelectionMode: "SingleRow"
            });

            that._AccDocOperationGridView.bind("SelectedRowsChanged", function (e) { that._AccDocOperationGridView_SelectedRowsChanged(e); });

            that._AccDocOperations = afw.uiApi.CreateEntityList();
            that._AccDocOperationGridView.GetDataSource().data(that._AccDocOperations.ToDataSourceData());

            that._SortAccDocOperations();
        },

        _SortAccDocOperations: function () {
            var that = this;

            if (ValueIsEmpty(that._AccDocOperations))
                return;

            that._AccDocOperations.Entities = that._AccDocOperations.Entities.sort(
                function (item1, item2) {
                    if (item1.GetFieldValue("RowNumber") < item2.GetFieldValue("RowNumber"))
                        return -1;
                    else if (item1.GetFieldValue("RowNumber") > item2.GetFieldValue("RowNumber"))
                        return 1;
                    else
                        return 0;
                });
        },

        _AccDocOperationGridView_SelectedRowsChanged: function (e) {
            var that = this;

            //var selectedEntities = that._AccDocOperationGridView.GetSelectedRows();
            //if (selectedEntities.length > 0) {
            //    var refEntityID = selectedEntities[0].DataItem["ID"];
            //    var havaleEntity = afw.uiApi.CreateNewEntity("wm.Havale");
            //    var havaleWindow = afw.uiApi.OpenSavedFormWindow("wm.HavaleEditForm", {
            //        Name: "HavaleEditFormWindow",
            //        Modal: true,
            //        FormMode: "New",
            //        Title: "حواله",
            //        Entity: havaleEntity,
            //        RefEntityID: refEntityID,
            //        RefEntityFullProfile: that._RefEntityFullProfile
            //    });
            //    havaleWindow.Center();
            //}
        },

        _MoveUpButton_Click: function (e) {
            var that = this;

            that._MoveSelectedItemToOperationGrid();
        },

        _MoveDownButton_Click: function (e) {
            var that = this;

            that._MoveSelectedItemToAccDocOperationGrid();
        },

        _AccDocDeleteButton_Click: function (e) {
            var that = this;

            var selectedEntities = that._OperationGridView.GetSelectedRows();
            if (selectedEntities.length > 0) {
                var selectedItemID = selectedEntities[0].DataItem["ID"];
                var accDoc = selectedEntities[0].DataItem["AccDoc"];
                
                var confirmDialog = afw.ConfirmDialog.Show("آیا با حذف سند موافقید؟");
                confirmDialog.bind("Close", function () {
                    if (confirmDialog.GetDialogResult() == "Yes") {
                        if (that._OperationType == "Tankhah") {
                            var tankhahEntity = afw.uiApi.FetchEntity("rp.Tankhah", String.Format("ID = '{0}'", selectedItemID));
                            if (!ValueIsEmpty(tankhahEntity)) {
                                tankhahEntity.ChangeStatus = "Modify";
                                tankhahEntity.SetFieldValue("AccDoc", null);
                                afw.uiApi.ApplyEntityChanges(tankhahEntity);
                            }
                            else {
                                afw.ErrorDialog.Show("Developer Error : Can't Find Selected Tankhah");
                            }
                        }
                        else if (that._OperationType == "FinancialDeclaration") {                            
                            var recordFinancialDeclarationEntity = afw.uiApi.FetchEntity("cc.RecordFinancialDeclaration", String.Format("ID = '{0}'", selectedItemID));
                            if (!ValueIsEmpty(recordFinancialDeclarationEntity)) {
                                recordFinancialDeclarationEntity.ChangeStatus = "Modify";
                                recordFinancialDeclarationEntity.SetFieldValue("AccDoc", null);
                                afw.uiApi.ApplyEntityChanges(recordFinancialDeclarationEntity);
                            }
                            else {
                                afw.ErrorDialog.Show("Developer Error : Can't Find Selected FinancialDeclaration");
                            }
                        }

                        var accDocEntity = afw.uiApi.FetchEntity("acc.AccDoc", String.Format("ID = '{0}'", accDoc));
                        if (!ValueIsEmpty(accDocEntity)) {
                            accDocEntity.ChangeStatus = "Delete";
                            afw.uiApi.ApplyEntityChanges(accDocEntity);

                            that._FilterControl_ValueChanged(null);

                        }
                        else {
                            afw.ErrorDialog.Show("Developer Error : Can't Find Selected AccDoc");
                        }
                    }
                });
            }
        },

        _AccDocGenerateButton_Click: function (e) {
            var that = this;

            var selectedEntities = that._AccDocOperationGridView.GetSelectedRows();
            if (selectedEntities.length <= 0) {
                return;
            }
            else {
                if (ValueIsEmpty(selectedEntities[0].DataItem.DocNo)) {
                    var itemID = selectedEntities[0].DataItem.ID;
                    var itemNumber = selectedEntities[0].DataItem.RowNumber;
                    var issueDate = selectedEntities[0].DataItem.IssueDate;

                    var accDocGenerateFormWindow = afw.uiApi.OpenSavedFormWindow("acc.AccDocGenerateForm", {
                        Name: "AccDocGenerateFormWindow",
                        Title: "تولید سند حسابداری",
                        Modal: true,
                        OperationType: that._OperationType,
                        ItemID: itemID,
                        ItemNumber: itemNumber,
                        IssueDate: issueDate
                    });
                    accDocGenerateFormWindow.Center();

                    accDocGenerateFormWindow.bind("Close", function (e) { that._AccDocGenerateFormWindow_Close(e); });
                }
                else
                    afw.ErrorDialog.Show("این ردیف دارای شماره سند میباشد ، دوباره نمیتوان تولید سند کرد.");
            }
        },

        _AccDocGenerateFormWindow_Close: function (e) {
            var that = this;

            if (e.Sender.GetDialogResult() == "Ok") {
                if (e.Sender.AccDocGeneratedEntity.GetFieldValue("MaxDocNo") != 0)
                    afw.MessageDialog.Show("سند با شماره " + e.Sender.AccDocGeneratedEntity.GetFieldValue("MaxDocNo") + " ثبت گردید.");
                //else
                //    afw.MessageDialog.Show("به علت وجود شماره تکراری ، سند با شماره  " + e.Sender.MaxDocNo + " ثبت گردید.");

                var gridIndex = that._AccDocOperations.Entities.FindIndex(function (o) {
                    return o.GetFieldValue("ID").toLowerCase() == e.Sender._ItemID.toLowerCase();
                });

                that._AccDocOperations.Entities[gridIndex].SetFieldValue("DocNo", e.Sender.AccDocGeneratedEntity.GetFieldValue("MaxDocNo"));
                that._AccDocOperations.Entities[gridIndex].SetFieldValue("AccDoc", e.Sender.AccDocGeneratedEntity.GetFieldValue("AccDocID"));
                that._AccDocOperationGridView.GetDataSource().data(that._AccDocOperations.ToDataSourceData());
                //selectedEntities[0].DataItem.set("DocNo", 1); 
            }
        },

        _ViewItemsButton_Click: function (e) {
            var that = this;

            var selectedEntities = that._OperationGridView.GetSelectedRows();
            if (selectedEntities.length <= 0) {
                return;
            }
            else {
                var selectedItemID = selectedEntities[0].DataItem.ID;

                var itemsWindow = new afw.Window({
                    Name: "ViewItemsWindow",
                    Title: "مشاهده آیتم ها",
                    Modal: true,
                    Width: 1024,
                    Height: 700
                });

                if (that._OperationType == "Tankhah") {
                    var tankhahItemsListControl = afw.uiApi.CreateDataListControl("rp.TankhahItemsList",
                            {
                                ParentControl: itemsWindow,
                                BaseFilterExpression: String.Format("Tankhah = '{0}'", selectedItemID),
                                FillParent: true,
                                TankhahID: selectedItemID
                            });
                    itemsWindow.Center();
                    itemsWindow.Open();
                }
                else if (that._OperationType == "FinancialDeclaration") {
                    var financialDeclarationItemsListControl = afw.uiApi.CreateDataListControl("cc.RecordFinancialDeclarationItemList",
                            {
                                ParentControl: itemsWindow,
                                BaseFilterExpression: String.Format("RecordFinancialDeclaration = '{0}'", selectedItemID),
                                FillParent: true
                            });
                    itemsWindow.Center();
                    itemsWindow.Open();
                }
            }

        },

        _LoadOperationsGrid: function () {
            var that = this;

            if (that._Operations == null)
                that._Operations = afw.uiApi.CreateEntityList();

            that._OperationGridView.GetDataSource().data(that._Operations.ToDataSourceData());

            if (that._Operations.Entities.length > 0)
                that._OperationGridView.SelectRowByIndex(0);
        },

        _LoadAccDocOperationsGrid: function () {
            var that = this;

            if (that._AccDocOperations == null)
                that._AccDocOperations = afw.uiApi.CreateEntityList();

            that._AccDocOperationGridView.GetDataSource().data(that._AccDocOperations.ToDataSourceData());

            if (that._AccDocOperations.Entities.length > 0)
                that._AccDocOperationGridView.SelectRowByIndex(0);
        },

        _MoveSelectedItemToAccDocOperationGrid: function () {
            var that = this;

            var selectedEntities = that._OperationGridView.GetSelectedRows();
            if (selectedEntities.length <= 0) {
                return;
            }
            else {
                var selectedItemAccDocID = selectedEntities[0].DataItem.AccDoc;

                if (selectedItemAccDocID == null) {
                    var selectedItemID = selectedEntities[0].DataItem.ID;

                    var selectedItemIndex = that._Operations.Entities.FindIndex(
                            function (o) { return o.GetFieldValue("ID").toLowerCase() == selectedItemID.toLowerCase(); });
                    var selectedItem = that._Operations.Entities[selectedItemIndex];
                    that._Operations.Entities.RemoveItem(selectedItemIndex);
                    that._AccDocOperations.Entities.push(selectedItem);

                    that._LoadOperationsGrid();
                    that._LoadAccDocOperationsGrid();
                }
                else
                    afw.MessageDialog.Show("ردیف انتخاب شده سند دارد، دوباره نمیتوان تولید سند کرد.");
            }
        },

        _MoveSelectedItemToOperationGrid: function () {
            var that = this;

            var selectedEntities = that._AccDocOperationGridView.GetSelectedRows();
            if (selectedEntities.length <= 0) {
                return;
            }
            else {
                var selectedItemID = selectedEntities[0].DataItem.ID;
                var selectedItemIndex = that._AccDocOperations.Entities.FindIndex(
                        function (o) { return o.GetFieldValue("ID").toLowerCase() == selectedItemID.toLowerCase(); });
                var selectedItem = that._AccDocOperations.Entities[selectedItemIndex];
                that._AccDocOperations.Entities.RemoveItem(selectedItemIndex);
                that._Operations.Entities.push(selectedItem);

                that._LoadOperationsGrid();
                that._LoadAccDocOperationsGrid();
            }
        },

        _GetOperationItemsFilterExpresstion: function (hasFinancialYear) {
            var that = this;

            var filterExpresstion = "";

            if (!ValueIsEmpty(hasFinancialYear) && hasFinancialYear == true)
                filterExpresstion = String.Format("{0}FinancialYear = '{1}' ",
                    ValueIsEmpty(that._OperationType) ? "" : that._OperationType + ".", that._FinancialYearID);

            that._AccDocStatus = that._DocFilterComboBox.GetValue();
            if (that._AccDocStatus == "IsDoc"){
                if (filterExpresstion != "")
                    filterExpresstion += " and ";
                filterExpresstion += "AccDoc is not null";
            }
            else if (that._AccDocStatus == "IsNotDoc") {
                if (filterExpresstion != "")
                    filterExpresstion += " and ";
                filterExpresstion += "AccDoc is null";
            }
            
            if (!ValueIsEmpty(that._FinancialDocTypeOptionSet.GetValue())) {
                if (filterExpresstion != "")
                    filterExpresstion += " and ";
                filterExpresstion += String.Format("{0}FinancialDocType = '{1}'", ValueIsEmpty(that._OperationType) ? "" : that._OperationType + ".", that._FinancialDocTypeOptionSet.GetValue());
            }

            if (!ValueIsEmpty(that._OrganizationUnitLookup.GetValue())) {
                if (filterExpresstion != "")
                    filterExpresstion += " and ";
                filterExpresstion += String.Format("{0}OrganizationUnit = '{1}'", ValueIsEmpty(that._OperationType) ? "" : that._OperationType + ".", that._OrganizationUnitLookup.GetValue());
            }
            
            return filterExpresstion;
        },

        _GetCountingItemsFilterExpresstion: function (hasFinancialYear) {
            var that = this;

            var filterExpresstion = "";

            if (!ValueIsEmpty(hasFinancialYear) && hasFinancialYear == true)
                filterExpresstion = String.Format("FinancialYear = '{0}' ", that._FinancialYearID);

            that._AccDocStatus = that._DocFilterComboBox.GetValue();
            if (that._AccDocStatus == "IsDoc") {
                if (filterExpresstion != "")
                    filterExpresstion += " and ";
                filterExpresstion += "AccDoc is not null";
            }
            else if (that._AccDocStatus == "IsNotDoc") {
                if (filterExpresstion != "")
                    filterExpresstion += " and ";
                filterExpresstion += "AccDoc is null";
            }

            if (!ValueIsEmpty(that._FinancialDocTypeOptionSet.GetValue())) {
                if (filterExpresstion != "")
                    filterExpresstion += " and ";
                filterExpresstion += String.Format("FinancialDocType = '{0}'", that._FinancialDocTypeOptionSet.GetValue());
            }

            if (!ValueIsEmpty(that._OrganizationUnitLookup.GetValue())) {
                if (filterExpresstion != "")
                    filterExpresstion += " and ";
                filterExpresstion += String.Format("OrganizationUnit = '{0}'", that._OrganizationUnitLookup.GetValue());
            }

            return filterExpresstion;
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.AccDocManagmentDashboardForm";
    FormClass.BaseType = afw.BasePanel;


    acc.AccDocManagmentDashboardForm = FormClass;
})();