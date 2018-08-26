//Arrays:
var array1 = [1, 2, 3];
var array2 = [{ ID: "1"}, {ID: "2"}];

//ValueIsArray(value):
var isArray = ValueIsArray(array2);

//IndexOf (simple search):
var foundItemIndex = array1.IndexOf(2);
//FindIndex (advanced search)
var foundItemIndex = array2.FindIndex(function (o) { return o.ID == "1" });

//MoveItem(fromIndex, toIndex):
array2.MoveItem(0, 2); //

//Sorting array of objects:
that._accountReview.Entities = that._accountReview.Entities.sort(
    function (item1, item2) {
        if (item1.GetFieldValue("RowNumber") < item2.GetFieldValue("RowNumber"))
            return -1;
        else if (item1.GetFieldValue("RowNumber") > item2.GetFieldValue("RowNumber"))
            return 1;
        else
            return 0;
    });

//RemoveItem(index):
array2.RemoveItem(index);


//Popup:
var popup = new afw.Popup({ Name: "WarningsPopup", Width: 280, Height: 115 });
var popupContentForm = afw.uiApi.CreateSavedFormByName(popup, "crm.WarningPopupForm");

popup.SetAnchor(anchorControl, "bottom left", "top left");
popup.bind("Closed", function (e) { that._Popup_Closed(e); });
popup.Open();


//MessageBox:
afw.MessageDialog.Show(".........."); 


//ConfirmDialog:
var confirmDialog = afw.ConfirmDialog.Show("آیا با حذف موافقید؟");
confirmDialog.bind("Close", function () {
    if (confirmDialog.GetDialogResult() == "Yes") { 
        //.....
    }
});


//ComboBox:
var comboBox1 = new afw.ComboBox({
    Name: "ComboBox1",
    ParentControl: that,
    LabelVisible: false,
    DataTextField: "Title",
    DataValueField: "ID",
    IsInDesignMode: that.GetIsInDesignMode()
});
var itemsEntityList = afw.uiApi.FetchEntityList(............);
comboBox1.SetItemsDataSource(new kendo.data.DataSource({ data: itemsEntityList.ToDataSourceData() }));


//TreeView:
var treeView = new afw.TreeView({
    ParentControl: infoBarSplitterPanel.Pane1,
    Name: "ObjectsTreeView",
    FillParent: true,
    BackColor: "#FFFFFF"
});

treeView.bind("SelectedNodeChanged", function (e) { that._treeView_SelectedNodeChanged(e); });

_treeView_SelectedNodeChanged: function (e) {
    var that = this;

    var itemId = e.SelectedNodeDataItem.id;
}

treeView.AppendNode({ id: "node id", text: "." });

var foundParentNodeItem = treeView.FindNodeDataItemById(parentNodeItemId);

treeView.AppendNode(
    { id: "node id", text: "node text" },
    foundParentNodeItem);

treeView.RemoveNodeById("node id");

var selectedNodeDataItem = treeView.GetSelectedNodeDataItem();

//AutoComplete
var autoComplete = new afw.AutoComplete({
    Name: "AutoComplete",
    ParentControl: inputControl.Panes[0],
    LabelVisible: false,
    DataTextField: that.GetEntityCaptionFieldName(),
    DataValueField: "ID"
});
autoComplete.SetSignPlaceHolderWidth(1);
autoComplete.SetReadOnly(false);
autoComplete.SetLabelVisible(false);
autoComplete.ProvideItemsDataSource = that._AutoComplete_ProvideItemsDataSource;
autoComplete.GetValueText = that._AutoComplete_GetValueText;

_AutoComplete_ProvideItemsDataSource: function (callback) {
    var autoComplete = this;
    var that = autoComplete.ParentControl.ParentControl.ParentControl;

    that._OnLoadingEntityList();

    var searchText = autoComplete.GetText();
    var lookupDataList = that._GetLookupDataList();
    var sortExpression = lookupDataList.GetFieldValue("DefaultSortExpression");
    var filterExpression = that._GetAutoCompleteTotalFilterExpression();
            
    afw.DataListHelper.AsyncFetchEntityListOfDataList(that.GetDataListFullName(), null, null, filterExpression, sortExpression, 1, 20,
        function (result) {
            if (result.HasError)
                afw.ErrorDialog.Show(result.ErrorMessage);
            else {
                var itemsEntityList = result.Value;

                if (itemsEntityList.Entities.length > 0) {
                    if (!itemsEntityList.Entities[0].FieldExists("ID")) {
                        afw.ErrorDialog.Show(String.Format("DataList '{0}' does not have field with name 'ID'", that.GetDataListFullName()));
                        return;
                    }
                }

                callback(autoComplete, searchText, new kendo.data.DataSource({ data: itemsEntityList.ToDataSourceData() }));
            }
        });
}

_AutoComplete_GetValueText: function (callback) {
    var autoComplete = this;
    var that = autoComplete.ParentControl.ParentControl.ParentControl;

    var searchText = autoComplete.GetText();
    var entityID = autoComplete.GetValue();

    var lookupDataList = that._GetLookupDataList();
    var filterExpression = String.Format("ID = '{0}'", entityID);

    afw.DataListHelper.AsyncFetchEntityListOfDataList(that.GetDataListFullName(), null, null, filterExpression, null, 1, 1,
        function (result) {
            if (result.HasError) {
                callback(autoComplete, "");
                afw.ErrorDialog.Show(result.ErrorMessage);
            }
            else {
                var itemsEntityList = result.Value;

                if (itemsEntityList.Entities.length > 0) {
                    if (!itemsEntityList.Entities[0].FieldExists("ID")) {
                        afw.ErrorDialog.Show(String.Format("DataList '{0}' does not have field with name 'ID'", that.GetDataListFullName()));
                        callback(autoComplete, "");
                        return;
                    }

                    callback(autoComplete, itemsEntityList.Entities[0].GetFieldValue(autoComplete.GetDataTextField()));
                }
                else {
                    callback(autoComplete, "");
                    afw.ErrorDialog.Show(String.Format("Error getting AutoComplete ValueText: Entity with ID '{0}' not found in DataList '{1}'.", entityID, that.GetDataListFullName()));
                }
            }
        });
}

_GetAutoCompleteTotalFilterExpression: function () {
    var that = this;

    var autoComplete = that.FindControl("AutoComplete");
    var lookupDataList = that._GetLookupDataList();

    var filterExpression = null;
    filterExpression = afw.DataListHelper.GetAfwEntitiesSkipFilter(lookupDataList);

    var baseFilterExpression = that.GetBaseFilterExpression();
    if (!ValueIsEmpty(baseFilterExpression)) {
        if (!ValueIsEmpty(filterExpression))
            filterExpression += " and ";

        filterExpression += "(" + baseFilterExpression + ")";
    }

    var autoCompleteText = autoComplete.GetText();
    if (!ValueIsEmpty(autoCompleteText)) {
        if (!ValueIsEmpty(filterExpression))
            filterExpression += " and ";

        filterExpression += String.Format("(afw.FullStringSearch({0}, N'{1}') = 1)", autoComplete.GetDataTextField(), autoCompleteText);
    }

    return filterExpression;
}


//GridView:
that._EntitiesGridView = new afw.GridView({
    ParentControl: that._VDockPanel.Panes[3],
    Name: that.GetName() + "_EntitiesGridView",
    FillParent: true,
    Columns: [ 
        {
            title: "column1Title",
            field: "field1Name",//DataSource field column is bound
            rightToLeft: column1RightToLeft,
            width: 100,
            valuesDisplayMethod: "Text" //("Text"/ "Number" / "Image", Default: "Text")
        },
        {
            title: column2Title,
            field: field2Name,
            rightToLeft: column2RightToLeft
        }
    ],
    SelectionMode: "SingleRow"
});
that._EntitiesGridView.bind("RowDoubleClick", function (e) { that._EntitiesGridView_RowDoubleClick(e); });
that._EntitiesGridView.GetDataSource().data(dataListEntitiesEntityList.ToDataSourceData());

//Get Grid selected row:
var selectedEntities = that._EntitiesGridView.GetSelectedRows();
if (selectedEntities.length == 0) {
    afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
}
else {
    var entityId = selectedEntities[0].DataItem["ID"];
}


//grep:
var filteredDataLists = $.grep(dataLists, function (o) { return o.GetFieldValue("FullName") === dataListFullName; });
var foundDataList = filteredDataLists[0];


//Toolbar:
var toolbar = that.FindControl("Toolbar");
toolbar.bind("ButtonClick", function (e) { that._Toolbar_ButtonClick(e); });

//Toolbar button options:
//    TextColor, FontBold, BackgroundColor,Image

//DataListControl Toolbar buttons:
if (that._BaseEntityDefID != null) {
    toolbar.AddButton("New", "جدید", { TextColor: "white", BackgroundColor: "#43c35e" });
    //toolBar.AddButton("View", "مشاهده");
    toolbar.AddButton("Edit", "ویرایش", { Image: "resource(afw.ToolbarEditIcon)" });
    toolbar.AddButton("Delete", "حذف", { Image: "resource(afw.ToolbarRedCross16)" });

    var permEntity = afw.PermissionHelper.GetEntityDefPermissionsForUser(that._BaseEntityDefID);
    var hasInsertPermission = permEntity.GetFieldValue("CanInsert");
    toolbar.SetButtonEnabled("New", hasInsertPermission);
}

toolbar.AddButton("Reload", "", { Image: "resource(afw.RefreshIcon20)" });


//setTimeout:
setTimeout(function () {
    //Codes here
    }, 100);

afw.uiApi.CallServerMethodSync("afw.TestMethod1", [10, "a", 20, "b"]);


//DockPanel:
var dockPanel1 =
    new afw.DockPanel({
        ParentControl: AppContainer.ContentPanel,
        Name: "dockPanel1",
        Orientation: afw.Constants.Horizontal,
        PanesCount: 3
    });
dockPanel1.SetPanesSizeSetting(["20%", "fill", "50%"]);


//TabControl:
var tabControl =
    new afw.TabControl({
        ParentControl: AppContainer.ContentPanel,
        Name: "TabControl",
        TabPosition: "Left"
    });
tabControl.AppendTab("صفحه 1");
tabControl.AppendTab("صفحه 2");
tabControl.AppendTab("صفحه 3");
tabControl.AppendTab("صفحه 4");


//Display Entity in entity window:
var entity = afw.uiApi.FetchEntityByID("afw.EntityDef", "65d4bc78-78b2-458c-8c30-2065adfe9690");
var entityDefWindow = new afw.EntityDefWindow({ Name: "EntityDefWindow", Modal: true, FormMode: "Edit", Entity: entity });
entityDefWindow.SetSize(800, 400);
entityDefWindow.Open();
entityDefWindow.Center();


//Create new entity and display in entity window:
var entity = afw.uiApi.CreateNewEntity("afw.EntityFieldDef",
                {
                    ID: GenerateGuid(),
                    EntityDefID: '3c22c671-e602-440c-b5d8-14d35ae57bdd',
                    Name: null,
                    FieldTypeID: null,
                    IsPrimaryKey: null,
                    IsRequired: null
                });
var entityFieldDefWindow = new afw.EntityFieldDefWindow({ Name: "EntityFieldDefWindow", Modal: true, FormMode: "New", Entity: entity });
entityFieldDefWindow.SetSize(600, 500);
entityFieldDefWindow.Open();
entityFieldDefWindow.Center();


//EntitySelectWindow:
var entitySelectWindow = new afw.EntitySelectWindow({
    Name: "EntitySelectWindow",
    Modal: true,
    DataListFullName: ".....",
    BaseFilterExpression: ".....",
    QuickSearchText: "....."
});

entitySelectWindow.bind("Close", function () {
    if (e.Sender.GetDialogResult() == "Ok") {
        var selectedEntity = e.Sender.SelectedEntities[0];
    }
});

entitySelectWindow.Open();


//Creating DataList control programmaticaly:
var dataList = afw.uiApi.FetchEntity("afw.DataList", "Name = 'v1'");
var dataListID = dataList.GetFieldValue("ID");
var dataListControl = new afw.DataListControl({ Name: "DataListControl1", ParentControl: afw.App.AppContainer.ContentPanel, DataListID: dataListID });
//Or:
var dataListControl = new afw.DataListControl({ Name: "DataListControl1", ParentControl: afw.App.AppContainer.ContentPanel, DataListFullName: "afw.OptionSetsDataList" });


//Creating SingleEntityLookupControl programmaticaly:
var lookup1 = new afw.SingleEntityLookupControl({ Name: "Lookup1", ParentControl: AppContainer.ContentPanel, LabelVisible: true, ControlType: "AdvancedLookup", DataViewFullName: "afw.EntityDefsView", EntityCaptionFieldName: "FullName" });
lookup1.bind("LoadingEntityList", function (e) { e.Sender.SetBaseFilterExpression("Name like '%En%'") })


//Creating OptionSetControl programmaticaly:
var optionSet = new afw.OptionSetControl({ Name: "optionSet1", ParentControl: AppContainer.ContentPanel, LabelVisible: true, OptionSetFullName: "afw.TestOptionSet" });


//Async Call, displaying Progress and Error:
_OpenSelectedRowEditWindow: function () {
    var that = this;

    var selectedEntities = that._EntitiesGridView.GetSelectedRows();

    afw.uiApi.ShowProgress(that);
    afw.uiApi.AsyncFetchEntityByID(that._BaseEntityDefID, selectedEntities[0].DataItem["ID"], null,
        function (result) {
            afw.uiApi.HideProgress(that);
            if (result.HasError)
                afw.Application.HandleError(result.ErrorMessage);
            else
                that._ShowEntityWindow(result.Value, "Edit");
        });
}


//Form Data Binding to Entity:
var dataSource = entity.ToBindableEntity();
myWindow.InitDataBinding(dataSource);


//Running Report programmaticaly:
afw.uiApi.ShowProgress(that);
//
afw.ReportHelper.RunReport(reportFullName, parameterNames, parameterValues, null/*{ ShowResultInWindow: true }*/,
    function (result) {
        afw.uiApi.HideProgress(that);
        if (result.HasError)
            afw.ErrorDialog.Show(result.ErrorMessage);
        else {
            var returnValue = result.Value;
        }
    });

//Pdf viewer:
var pdfViewer = new afw.PdfViewer({
    Name: tabPage.GetName() + "_PdfViewer",
    ParentControl: tabPage,
    PdfFilePath: "ReportResultFiles/" + reportResultFileName
});

//Images:
//Use defined image queries:
//    "Resource(resource name)"
//    "ServerStoredFile(file id)"

panel.SetBackgroundImage("Resource(cmn.Icon1)");


//Validate entity:
var entityValidationResult = entity.Validate();
if (entityValidationResult.HasError) {
    afw.ErrorDialog.Show(entityValidationResult.ErrorMessage);
}

