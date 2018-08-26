(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return wm.GhabzOrHavaleItemsGridControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._RowHeight = 51;

            that._GridTitleDockPanel = that.FindControl("GridTitleDockPanel");
            that._HeaderDockPanel = that.FindControl("HeaderDockPanel");
            that.GhabzOrHavaleEditForm = options.GhabzOrHavaleEditForm;
            that._GhabzOrHavaleTypeEntity = that.GhabzOrHavaleEditForm.GhabzOrHavaleTypeEntity;
            that.IsGridMode = that.GhabzOrHavaleEditForm.IsGridMode;

            if (ValueIsEmpty(that._GhabzOrHavaleTypeEntity))
                that._GhabzOrHavaleTypeEntity = options.GhabzOrHavaleTypeEntity;

            if (ValueIsEmpty(options.RowsEntityList))
                throw "Error creating wm.GhabzOrHavaleItemsGridControl: RowsEntityList parameter is not set.";
            else
                that.RowsEntityList = options.RowsEntityList;

            that._GridBodyPanel = that.FindControl("GridBodyPanel");
            that._GridBodyDockPanel = that.FindControl("GridBodyDockPanel");
            that._AddRowDockPanel = that.FindControl("AddRowDockPanel");

            that._AddRowButton = that._AddRowDockPanel.FindControl("AddRowButton");
            that._ConfirmImageButton = that._AddRowDockPanel.FindControl("ConfirmImageButton");
            that._CancelImageButton = that._AddRowDockPanel.FindControl("CancelImageButton");

            var userHasPermissionToRialiAmount = afw.PermissionHelper.UserHasPermissionToItem("wm.TaghirMablaghRialiAsnadAnbar");
            if (ValueIsEmpty(userHasPermissionToRialiAmount))
                userHasPermissionToRialiAmount = false;

            that.ColumnsInfo = [
                { Name: "Stuff", Size: "fill", IsVisible: true },
                { Name: "Quantity", Size: 70, IsVisible: true },
                { Name: "StuffStatus", Size: 155, IsVisible: true },
                { Name: "BatchNumber", Size: 120, IsVisible: true },
                { Name: "Stock", Size: 70, IsVisible: that._GhabzOrHavaleTypeEntity.GetFieldValue("Stock") },
                { Name: "SetStuffsSerialNumberIsRequiered", Size: 125, IsVisible: true },
                { Name: "RialiAmount", Size: 150, IsVisible: userHasPermissionToRialiAmount }
            ];

            that._AddRowButton.bind("Click", function (e) { that._AddRowButton_Click(e); });
            that._ConfirmImageButton.bind("Click", function (e) { that._ConfirmImageButton_Click(e); });
            that._CancelImageButton.bind("Click", function (e) { that._CancelImageButton_Click(e); });

            that._AdjustGrid();
        },

        SetColumnVisible: function (columnNameOrIndex, value, adjustRows) {
            var that = this;

            var columnIndex = ValueIsNumber(columnNameOrIndex) ? columnNameOrIndex : that.GetColumnIndex(columnNameOrIndex);
            var columnPaneIndex = ((columnIndex + 1) * 2) + 1;

            if (value == false) {

                var columnPane = that._GridTitleDockPanel.Panes[columnPaneIndex];

                that._GridTitleDockPanel.SetPaneSizeSetting(columnPaneIndex, 1);
                that._GridTitleDockPanel.SetPaneSizeSetting(columnPaneIndex + 1, 1);
                that._GridTitleDockPanel.Panes[1].ChildControls[0].SetBackColor("#ffffff");
            }
            else {
                that._GridTitleDockPanel.SetPaneSizeSetting(columnPaneIndex, 3);
                that._GridTitleDockPanel.SetPaneSizeSetting(columnPaneIndex + 1, that.ColumnsInfo[columnIndex].Size);
            }

            if (adjustRows == null || adjustRows == true) {
                that._AdjustRows();
            }
        },

        _GetColumnInfo: function (columnNameOrIndex) {
            var that = this;

            if (ValueIsNumber(columnNameOrIndex)) {
                return that.ColumnsInfo[columnNameOrIndex.ToNumber()];
            }
            else {
                for (var i = 0; i < that.ColumnsInfo.length; i++) {
                    if (that.ColumnsInfo[i].Name == columnNameOrIndex)
                        return that.ColumnsInfo[i];
                }
                return null;
            }
        },

        GetColumnIndex: function (name) {
            var that = this;

            for (var i = 0; i < that.ColumnsInfo.length; i++) {

                if (that.ColumnsInfo[i].Name == name)
                    return i;
            }
            return null;
        },

        _AdjustRows: function () {
            var that = this;

            for (var i = 0; i < that.GetRowsCount() ; i++) {
                that.GetRowByIndex(i).AdjustRow();
            }
        },

        _AdjustGrid: function () {
            var that = this;

            for (var i = 0; i < that.ColumnsInfo.length; i++) {

                that.SetColumnVisible(that.ColumnsInfo[i].Name, that.ColumnsInfo[i].IsVisible, false);
            }

            if (that.IsGridMode) {
                that._ConfirmImageButton.SetVisible(false);
                that._CancelImageButton.SetVisible(false);
            }
            else {
                that._HeaderDockPanel.SetPaneSizeSetting(0, 30);
            }

            that._AdjustRows();
        },

        _CancelImageButton_Click: function () {
            var that = this;

            that.CloseForm();
        },

        _ConfirmImageButton_Click: function () {
            var that = this;

            that._Save();
        },

        _Save: function () {
            var that = this;

            if (!that.ValidateRows())
                return false;

            try {
                var ghabzOrHavaleEntity = that.GhabzOrHavaleEditForm.GetBindableEntity().GetEntity();
                var gridGhabzOrHavaleItems = that.RowsEntityList;

                if (ghabzOrHavaleEntity.ChangeStatus == "Add")
                    throw "Not implemented.";

                if (ghabzOrHavaleEntity.FieldExists("GhabzOrHavaleItems"))
                    throw "Not implemented.";

                //بدلیل این که در حالت گرید نیستیم، تمام آیتمها را در کلاینت نداریم. بنابراین تنها بعد از ثبت آیتم ها می توان در سرور مقایسه را انجام داد
                afw.uiApi.ApplyEntityListChanges(gridGhabzOrHavaleItems);

                for (var i = 0; i < gridGhabzOrHavaleItems.Entities.length; i++) {
                    gridGhabzOrHavaleItems.Entities[i].ChangeStatus = "None";
                }

                that._OnFormSaved();

                afw.uiApi.CallServerMethodSync("wm.CompareRefDocItemsWithGhabzOrHavaleItems", [ghabzOrHavaleEntity]);
            }
            catch (ex) {
                afw.ErrorDialog.Show("خطا در ثبت قبض/حواله : " + ex.ErrorDetails);
            }
        },

        _OnFormSaved: function () {
            var that = this;

            if (afw.PermissionHelper.UserHasPermissionToItem("wm.TaghirMablaghRialiAsnadAnbar"))
                that.GhabzOrHavaleEditForm.RefreshRialiAmountSum();

            setTimeout(function () {
                that.CloseForm();
                that.GhabzOrHavaleEditForm.ItemsDataListControl.GetPager().GoToLastPage();
            }, 700);
        },

        CloseForm: function () {
            var that = this;

            that.GhabzOrHavaleEditForm.DataListDockPanel.SetPaneSizeSetting(1, 1);

            if (!that.IsDestroying)
                that.Destroy();

            that.GhabzOrHavaleEditForm.GhabzOrHavaleItemEntitiesGridView.Focus();
        },

        SetAddRowButtonVisible: function (value) {
            var that = this;

            that._AddRowButton.SetVisible(value);
        },

        GetRowsCount: function () {
            var that = this;

            return that._GridBodyDockPanel.GetPanesCount() - 1;
        },

        AddEmptyItems: function (itemsCount) {
            var that = this;

            if (!that.ValidateRows())
                return;

            var lastRowNumber = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue",
                ["RowNumber", "wm_GhabzOrHavaleItems",
                    String.Format("GhabzOrHavale = '{0}'", that.GhabzOrHavaleEditForm.GetBindableEntity().get("ID"))]);

            var newRowNumber = lastRowNumber + 1;

            for (var i = 0; i < itemsCount; i++) {
                itemEntity = afw.uiApi.CreateNewEntity("wm.GhabzOrHavaleItem");
                itemEntity.SetFieldValue("GhabzOrHavale", that.GhabzOrHavaleEditForm.GetBindableEntity().get("ID"));
                itemEntity.SetFieldValue("RowNumber", newRowNumber);
                itemEntity.SetFieldValue("BatchNumber", that.GhabzOrHavaleEditForm.GetBindableEntity().get("BatchNumber"));

                that.RowsEntityList.Entities.push(itemEntity);
                that.AddRow(itemEntity);

                newRowNumber++;
            }

            that._AdjustRows();
        },

        ValidateRows: function () {
            var that = this;

            for (var i = 0; i < that.GetRowsCount() ; i++) {
                if (!that.GetRowByIndex(i).ValidateRow())
                    return false;
            }

            return true;
        },

        SetControlVisible: function (controlName, value) {
            var that = this;

            for (var i = 0; i < that.GetRowsCount() ; i++) {
                that.GetRowByIndex(i).SetControlVisible(controlName, value);
            }
        },

        SetControlValue: function (controlName, value) {
            var that = this;

            for (var i = 0; i < that.GetRowsCount() ; i++) {
                that.GetRowByIndex(i).SetControlValue(controlName, value);
            }
        },

        SetStockLabelText: function () {
            var that = this;

            for (var i = 0; i < that.GetRowsCount() ; i++) {
                that.GetRowByIndex(i).SetControlText("Stocklabel", that.GetRowByIndex(i).GetStuffRealStock());
            }
        },

        SetControlReadOnly: function (controlName, value) {
            var that = this;

            for (var i = 0; i < that.GetRowsCount() ; i++) {
                that.GetRowByIndex(i).SetControlReadOnly(controlName, value);
            }
        },

        SetStuffsLookupBaseFilterExpression: function () {
            var that = this;

            for (var i = 0; i < that.GetRowsCount() ; i++) {
                that.GetRowByIndex(i).SetStuffsLookupBaseFilterExpression();
            }
        },

        AddRow: function (rowEntity) {
            var that = this;

            var rowIndex = that._GridBodyDockPanel.GetPanesCount() - 1;
            var rowPane = that._GridBodyDockPanel.InsertPane(rowIndex, { Size: that._RowHeight }, true);

            var rowControl = new wm.GhabzOrHavaleItemsGridRowControl({
                ParentControl: rowPane,
                Name: "Row_" + GenerateGuid(),
                GridControl: that,
                RowEntity: rowEntity
            });

            that._AdjustControl();
            that._AdjustRows();
        },

        _AdjustControl: function () {
            var that = this;

            var rowsCount = that._GridBodyDockPanel.GetPanesCount() - 1;
            that._GridBodyPanel.SetMinHeight(rowsCount * that._RowHeight + 5);
            that._GridBodyPanel.SetHeight(rowsCount * that._RowHeight + 5);

            var gridBodyScrollPanel = that.FindControl("GridBodyScrollPanel");
            gridBodyScrollPanel.AdjustScrollBars();

            var scrollWidth = gridBodyScrollPanel.GetVerticalScrollBarWidth();

            var gridTitleDockPanel = that.FindControl("GridTitleDockPanel");
            var lastPaneIndex = gridTitleDockPanel.GetPanesCount() - 1;
            that.FindControl("GridTitleDockPanel").SetPaneSizeSetting(lastPaneIndex, scrollWidth > 0 ? scrollWidth : 20);
        },

        _AddRowButton_Click: function (e) {
            var that = this;

            that.AddEmptyItems(1);
        },

        RemoveRow: function (rowControl) {
            var that = this;

            var rowIndex = rowControl.ParentControl.GetPaneIndex();
            that._GridBodyDockPanel.RemovePane(rowIndex);

            var rowBindableEntity = rowControl.GetBindableEntity();
            if (rowBindableEntity._Entity.ChangeStatus == "Add") {
                var rowItemIndex = that.RowsEntityList.Entities.IndexOf(rowBindableEntity._Entity);
                that.RowsEntityList.Entities.RemoveItem(rowItemIndex);
            }
            else if (ValueIsIn(rowBindableEntity._Entity.ChangeStatus, ["None", "Modify"]))
                rowBindableEntity._Entity.ChangeStatus = "Delete";

            if (that.IsGridMode) {
                var rowNumber = 1;
                var rowEntity = null;
                var row = null;
                for (var i = 0; i < that.GetRowsCount() ; i++) {
                    row = that.GetRowByIndex(i);
                    row.GetBindableEntity().set("RowNumber", rowNumber);
                    rowNumber++;
                }
            }

            that._AdjustControl();
        },


        GetRowByIndex: function (rowIndex) {
            var that = this;

            if (rowIndex > that._GridBodyDockPanel.GetPanesCount() - 2)
                throw String.Format("Row with index {0} not exists.", rowIndex);

            return that._GridBodyDockPanel.Panes[rowIndex].ChildControls[0];
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        },

        _OnResize: function () {
            var that = this;

            afw.BasePanel.fn._OnResize.call(that);

            if (!ValueIsEmpty(that._GridBodyDockPanel))
                that._AdjustControl();
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.GhabzOrHavaleItemsGridControl";
    FormClass.BaseType = afw.BasePanel;


    wm.GhabzOrHavaleItemsGridControl = FormClass;
})();