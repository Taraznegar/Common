(function () {
    var FormClass = cmn.DataEntryGridControlBase.extend({
        GetType: function () {
            return cmn.StuffBOM_StuffComponentsGridControl;
        },

        init: function (options) {
            var that = this;

            cmn.DataEntryGridControlBase.fn.init.call(that, options);

            that._Montage_ValuePercentColumnIndex = 10;

            var stuffBOM = that.ParentEditForm.GetBindableEntity().GetEntity();

            if (that._Montage_ValuePercentColumnIsVisible) {
                that._ColumnHeadersDockPanel = that.FindControl("ColumnHeadersDockPanel");
                that._ColumnHeadersDockPanel.SetPaneSizeSetting(that._Montage_ValuePercentColumnIndex, 1);
            }
        },

        GetMontage_ValuePercentColumnIsVisible: function () {
            var that = this;

            return that._Montage_ValuePercentColumnIsVisible;
        },

        _CreateNewItemEntity: function () {
            var that = this;

            var itemEntity = afw.uiApi.CreateNewEntity("cmn.StuffBOM_StuffComponent");
            itemEntity.SetFieldValue("StuffBOM", that.ParentEditForm.GetBindableEntity().get("ID"));

            return itemEntity;
        },

        _CreateRowControl: function (rowPane, rowName, rowEntity) {
            var that = this;

            return new cmn.StuffBOM_StuffComponentsGridRowControl({
                ParentControl: rowPane,
                Name: rowName,
                GridControl: that,
                RowEntity: rowEntity
            });
        }

    });

    //Static Members:

    FormClass.TypeName = "cmn.StuffBOM_StuffComponentsGridControl";
    FormClass.BaseType = cmn.DataEntryGridControlBase;


    cmn.StuffBOM_StuffComponentsGridControl = FormClass;
})();