(function () {
    var FormClass = cmn.DataEntryGridControlBase.extend({
        GetType: function () {
            return wm.MontageOrDemontageStuffComponentsGridControl;
        },

        init: function (options) {
            var that = this;

            cmn.DataEntryGridControlBase.fn.init.call(that, options);

            that._Demontage_ValuationPercentColumnIndex = 16;

            var montageOrDemontage = that.ParentEditForm.GetBindableEntity().GetEntity();

            that._Demontage_ValuationPercentColumnIsVisible =
                montageOrDemontage.GetFieldValue("OpType") == afw.OptionSetHelper.GetOptionSetItemID("wm.MontageOrDemontage.Demontage");

            if (!that._Demontage_ValuationPercentColumnIsVisible)
            {
                that._ColumnHeadersDockPanel = that.FindControl("ColumnHeadersDockPanel");
                that._ColumnHeadersDockPanel.SetPaneSizeSetting(that._Demontage_ValuationPercentColumnIndex, 1);
            }

            that.ComponentsGridRowControl = that.FindControl("rowName");
        },

        GetDemontage_ValuationPercentColumnIsVisible: function () {
            var that = this;

            return that._Demontage_ValuationPercentColumnIsVisible;
        },

        _CreateNewItemEntity: function () {
            var that = this;

            var itemEntity = afw.uiApi.CreateNewEntity("wm.MontageOrDemontageStuffComponent");
            itemEntity.SetFieldValue("MontageOrDemontage", that.ParentEditForm.GetBindableEntity().get("ID"));

            return itemEntity;
        },

        _CreateRowControl: function (rowPane, rowName, rowEntity) {
            var that = this;

            return new wm.MontageOrDemontageStuffComponentsGridRowControl({
                ParentControl: rowPane,
                Name: rowName,
                GridControl: that,
                RowEntity: rowEntity
            });
        },
        
        RemoveAllRows: function () {
            var that = this;

            var storedPanesCount = that._GridBodyDockPanel.GetPanesCount();

            for (var i = 0; i < storedPanesCount - 1; i++) {
                that.RemoveRow(that._GridBodyDockPanel.Panes[0].ChildControls[0]);
            }                
        },

        RecalculateAllTotalQuantities: function () {
            var that = this;
            
            var quantityInOneProduct;

            for (var i = 0; i < that._GridBodyDockPanel.GetPanesCount() - 1; i++) {
                var rowControl = that._GridBodyDockPanel.Panes[i].ChildControls[0];

                rowControl.RecalculateTotalQuantity();
            }
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.MontageOrDemontageStuffComponentsGridControl";
    FormClass.BaseType = cmn.DataEntryGridControlBase;


    wm.MontageOrDemontageStuffComponentsGridControl = FormClass;
})();
