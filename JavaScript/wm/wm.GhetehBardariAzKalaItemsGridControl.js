(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return wm.GhetehBardariAzKalaItemsGridControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._RowHeight = 51;

            that._GridTitleDockPanel = that.FindControl("GridTitleDockPanel");
            that.GhetehBardariAzKalaEditForm = options.GhetehBardariAzKalaEditForm;
            that.RowsEntityList = that.GhetehBardariAzKalaEditForm.ItemsEntityList;
            that._GridBodyPanel = that.FindControl("GridBodyPanel");
            that._GridBodyDockPanel = that.FindControl("GridBodyDockPanel");
            that._AddRowDockPanel = that.FindControl("AddRowDockPanel");

            that._AddRowButton = that._AddRowDockPanel.FindControl("AddRowButton");

            that._AddRowButton.bind("Click", function (e) { that._AddRowButton_Click(e); });

        },

        _AdjustRows: function () {
            var that = this;

            for (var i = 0; i < that.GetRowsCount() ; i++) {
                that.GetRowByIndex(i).AdjustRow();
            }
        },

        GetRowsCount: function () {
            var that = this;

            return that._GridBodyDockPanel.GetPanesCount() - 1;
        },

        AddEmptyItems: function (itemsCount) {
            var that = this;

            if (!that.ValidateRows())
                return;

            var priorRowsCount = that.GetRowsCount();
            var itemEntity = null;

            for (var i = 0; i < itemsCount; i++) {
                itemEntity = afw.uiApi.CreateNewEntity("wm.GhetehBardariAzKalaItem");
                itemEntity.SetFieldValue("GhetehBardariAzKala",
                    that.GhetehBardariAzKalaEditForm.GetBindableEntity().get("ID"));
                itemEntity.SetFieldValue("RowNumber", priorRowsCount + i + 1);

                that.RowsEntityList.Entities.push(itemEntity);
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

        AddRow: function (rowEntity) {
            var that = this;

            var rowIndex = that._GridBodyDockPanel.GetPanesCount() - 1;
            var rowPane = that._GridBodyDockPanel.InsertPane(rowIndex, { Size: that._RowHeight }, true);

            var rowControl = new wm.GhetehBardariAzKalaItemsGridRowControl({
                ParentControl: rowPane,
                Name: "Row_" + GenerateGuid(),
                GridControl: that,
                RowEntity: rowEntity
            });

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

    FormClass.TypeName = "wm.GhetehBardariAzKalaItemsGridControl";
    FormClass.BaseType = afw.BasePanel;


    wm.GhetehBardariAzKalaItemsGridControl = FormClass;
})();