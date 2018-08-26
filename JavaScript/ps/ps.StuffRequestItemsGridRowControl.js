(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return ps.StuffRequestItemsGridRowControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._BindableEntity = options.RowEntity.ToBindableEntity();
            that._GridControl = options.GridControl;
             
            that._StuffInfo = null;

            that._ItemDockPanel = that.FindControl("ItemDockPanel");
            that._MeasurementUnitDropDownList = that.FindControl("MeasurementUnitDropDownList");
            that._StuffLookupContainerPanel = that.FindControl("StuffLookupContainerPanel");
            that._StuffLookupControl = that.FindControl("StuffLookupControl");
            that._QuantityTextBox = that.FindControl("QuantityTextBox");
            that._RemoveButton = that.FindControl("RemoveButton");
            that.FindControl("RowNumberLabel").InitDataBinding(that._BindableEntity);

            that._AdjustStuffLookupControl();

            that._QuantityTextBox.InitDataBinding(that._BindableEntity);
            that._QuantityTextBox.bind("GotFocus", function (e) { that._InputControl_GotFocus(e); });

            that._MeasurementUnitDropDownList.SetItemsDataSource(cmn.GetMeasurementUnitsEntityList().ToDataSourceData());
            that._MeasurementUnitDropDownList.SetReadOnly(true);
            that._MeasurementUnitDropDownList.InitDataBinding(that._BindableEntity);

            that._BindableEntity.bind("change", function (e) { that._BindableEntity_change(e); });

            that._RemoveButton.bind("Click", function (e) { that._RemoveButton_Click(e); });

            that.AdjustColor();

            that._StuffLookupControl.GetAutoComplete().bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._QuantityTextBox.Focus();
                }
            });

              that._QuantityTextBox.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    var rowIndex = that._BindableEntity.get("RowNumber") - 1;
                    var isLastRow = (rowIndex == that._GridControl.GetRowsCount() - 1);
                    if (isLastRow)
                        that._GridControl.AddEmptyItems(1);

                    that._GridControl.GetRowByIndex(rowIndex + 1).Focus();
                }
            }); 
        },

        GetBindableEntity: function () {
            var that = this;

            return that._BindableEntity;
        },

        AdjustColor: function () {
            var that = this;

            var rowNumber = that._BindableEntity.get("RowNumber");

            if (afw.BaseUtils.NumberIsOdd(rowNumber))
                that.SetBackColor("#ffffff");
            else
                that.SetBackColor("#f7f7f7");
        },

        GetItemKind: function () {
            var that = this;

            return that._ItemKindDropDownList.GetValue();
        },

        _SetItemKind: function (value) {
            var that = this;

            that._ItemKindDropDownList.SetValue(value);
        },


        _StuffLookupControl_ValueChanged: function (e) {
            var that = this;

            var stuffID = that._BindableEntity.get("Stuff");
            //var serviceID = that._BindableEntity.get("Service"); 

            var measurementUnitID = null;
       
            if (stuffID != null) {
                var stuffInfo = that._GetStuffInfo();
                measurementUnitID = stuffInfo.GetFieldValue("MainMeasurementUnitID");
            }
           
           
            that._BindableEntity.set("MeasurementUnit", measurementUnitID);
        },

        _AdjustStuffLookupControl: function () {
            var that = this;

            var itemKind = "Stuff";
            var StuffLookupControl = that.FindControl("StuffLookupControl");
            var controlCreated = false;

            if (itemKind == "Stuff" || ValueIsEmpty((itemKind))) {
                if (StuffLookupControl != null && StuffLookupControl.GetDataListFullName() != "cmn.Stuffs") {
                    StuffLookupControl.Destroy();
                    StuffLookupControl = null;
                }

                if (StuffLookupControl == null) {
                    StuffLookupControl = new afw.SingleEntityLookupControl({
                        ParentControl: that._StuffLookupContainerPanel,
                        Name: "StuffLookupControl",
                        DataListFullName: "cmn.Stuffs",
                        EntityCaptionFieldName: "DisplayName",
                        LabelVisible: false,
                        FillParent: true,
                        HasEntityViewButton: false,
                        LookupWindowDefaultWidth: 1600,
                        ValueDataMember: "Stuff"
                    });                  

                    controlCreated = true;
                }
            }
           

            if (controlCreated) {
                StuffLookupControl.InitDataBinding(that._BindableEntity);
               // StuffLookupControl.bind("GotFocus", function (e) { that._InputControl_GotFocus(e); });
                StuffLookupControl.bind("ValueChanged", function (e) { that._StuffLookupControl_ValueChanged(e); });
                that._StuffLookupControl = StuffLookupControl;
            }
        },

        _InputControl_GotFocus: function (e) {
            var that = this;

            //if (that.GetItemKind() == null) {
            //    var rowDefaultItemKind = that._GetRowDefaultItemKind();
            //    that._SetItemKind(rowDefaultItemKind);
            //}
        },

        _BindableEntity_change: function (e) {
            var that = this;

            if (ValueIsIn(e.field, ["Stuff",  "Quantity"])) { 
                try {
                    var quantity = that._BindableEntity.get("Quantity");
                    if (quantity == null)
                        quantity = 0;
                } 
                catch(e){
                    afw.MessageDialog.Show(e.message);
                }
            }

            that.AdjustColor();
        },

        _RemoveButton_Click: function (e) {
            var that = this;

            that._GridControl.RemoveRow(that);
        },

        _GetRowDefaultItemKind: function () {
            var that = this;

            var rowIndex = that._BindableEntity.get("RowNumber") - 1;

            if (rowIndex == 0)
                return "Stuff";
            else {
                previousRowItemKind = that._GridControl.GetRowByIndex(rowIndex - 1).GetItemKind();

                //if (previousRowItemKind != null)
                //    return previousRowItemKind;
                //else
                    return "Stuff";
            }
        },

        _GetStuffInfo: function () {
            var that = this;

            var stuffID = that._BindableEntity.get("Stuff");
            
            if (stuffID == null)
                throw "Stuff is not set!";

            if (that._StuffInfo == null || that._StuffInfo.GetFieldValue("ID") != stuffID)
                that._StuffInfo = afw.uiApi.CallServerMethodSync("ps.GetInvoiceItemStuffInfo", [stuffID]);

            return that._StuffInfo;
        },

        ValidateRow: function () {
            var that = this;

            var validationError = null;
            var rowNumber = that._BindableEntity.get("RowNumber");

            var shouldValidateRow = that._BindableEntity.GetEntity().ChangeStatus == "Modify"
                || (that._StuffLookupControl.GetValue() != null
                    || !ValueIsEmpty(that._QuantityTextBox.GetText())
                );

            if (shouldValidateRow) {
                if (that._StuffLookupControl.GetValue() == null)
                    validationError = String.Format("کالا در سطر {0} وارد نشده است.", rowNumber);
                else if (ValueIsEmpty(that._QuantityTextBox.GetText()))
                    validationError = String.Format("تعداد/مقدار در سطر {0} وارد نشده است.", rowNumber);
            }

            if (validationError == null)
                return true;
            else {
                afw.ErrorDialog.Show(validationError);
                return false;
            }
        },

        Focus: function () {
            var that = this;

            that._StuffLookupControl.Focus();
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "ps.StuffRequestItemsGridRowControl";
    FormClass.BaseType = afw.BasePanel;


    ps.StuffRequestItemsGridRowControl = FormClass;
})();