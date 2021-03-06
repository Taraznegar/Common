﻿(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return ps.StuffRequestItemsGridControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._StuffRequestEditForm = options.StuffRequestEditForm;
            that._RowsEntityList = that._StuffRequestEditForm.ItemsEntityList;
            that._GridBodyPanel = that.FindControl("GridBodyPanel");
            that._GridBodyDockPanel = that.FindControl("GridBodyDockPanel");
            that._GridFooterDockPanel = that.FindControl("GridFooterDockPanel");
            that._AddRowButton = that._GridFooterDockPanel.FindControl("AddRowButton");
              
            that._GridBodyPanel.SetHeight(10);

            that._RowHeight = 51;

            that._AddRowButton.bind("Click", function (e) { that._AddRowButton_Click(e); });
        },

        GetStuffRequestEditForm: function () {
            var that = this;

            return that._StuffRequestEditForm;
        },

        GetRowsCount: function () {
            var that = this;

            return that._GridBodyDockPanel.GetPanesCount() - 1;
        },

        AddRow: function (rowEntity) {
            var that = this;

            var rowIndex = that._GridBodyDockPanel.GetPanesCount() - 1;
            var rowPane = that._GridBodyDockPanel.InsertPane(rowIndex, { Size: that._RowHeight }, true);

            var itemKind = null;
            if (rowEntity.GetFieldValue("Stuff") != null)
                itemKind = "Stuff";


            var rowControl = new ps.StuffRequestItemsGridRowControl({
                ParentControl: rowPane,
                Name: "Row_" + GenerateGuid(),
                GridControl: that,
                RowEntity: rowEntity,
                ItemKind: itemKind
            });

            that._AdjustControl();
         },

        RemoveRow: function (rowControl) {
            var that = this;

            var rowIndex = rowControl.ParentControl.GetPaneIndex();
            that._GridBodyDockPanel.RemovePane(rowIndex);

            var rowBindableEntity = rowControl.GetBindableEntity();
            if (rowBindableEntity._Entity.ChangeStatus == "Add") {
                var rowItemIndex = that._RowsEntityList.Entities.IndexOf(rowBindableEntity._Entity);
                that._RowsEntityList.Entities.RemoveItem(rowItemIndex);
            }
            else if (ValueIsIn(rowBindableEntity._Entity.ChangeStatus, ["None", "Modify"]))
                rowBindableEntity._Entity.ChangeStatus = "Delete";

            var rowNumber = 1;
            var rowEntity = null;
            var row = null;
            for (var i = 0; i < that.GetRowsCount() ; i++) {
                row = that.GetRowByIndex(i);
                row.GetBindableEntity().set("RowNumber", rowNumber);
                rowNumber++;
            }

            that._AdjustControl(); 
        },

        GetRowByIndex: function (rowIndex) {
            var that = this;

            if (rowIndex > that._GridBodyDockPanel.GetPanesCount() - 2)
                throw String.Format("Row with index {0} not exists.", rowIndex);

            return that._GridBodyDockPanel.Panes[rowIndex].ChildControls[0];
        },

        AddEmptyItems: function (itemsCount) {
            var that = this;

            var priorRowsCount = that.GetRowsCount();
            var itemEntity = null;
            for (var i = 0; i < itemsCount; i++) {
                itemEntity = afw.uiApi.CreateNewEntity("ps.StuffRequestItem");
                itemEntity.SetFieldValue("StuffRequest", that._StuffRequestEditForm.GetBindableEntity().get("ID"));
                itemEntity.SetFieldValue("RowNumber", priorRowsCount + i + 1);

                that._RowsEntityList.Entities.push(itemEntity);
                that.AddRow(itemEntity);
            }
        },

        ValidateRows: function () {
            var that = this;

            for (var i = 0; i < that.GetRowsCount() ; i++) {
                if (!that.GetRowByIndex(i).ValidateRow())
                    return false;
            }

            return true;
        },

        _AddRowButton_Click: function (e) {
            var that = this;

            that.AddEmptyItems(1);
        },

        _OnResize: function () {
            var that = this;

            afw.BasePanel.fn._OnResize.call(that);

            if (!ValueIsEmpty(that._GridBodyDockPanel))
                that._AdjustControl();
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
            that.FindControl("GridTitleDockPanel").SetPaneSizeSetting(lastPaneIndex, scrollWidth > 0 ? scrollWidth : 1);
        },
  
        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "ps.StuffRequestItemsGridControl";
    FormClass.BaseType = afw.BasePanel;


    ps.StuffRequestItemsGridControl = FormClass;
})();