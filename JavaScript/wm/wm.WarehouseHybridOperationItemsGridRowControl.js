(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return wm.WarehouseHybridOperationItemsGridRowControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (!ValueIsEmpty(designObjectData))
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._BindableEntity = options.RowEntity.ToBindableEntity();
            that._GridControl = options.GridControl;

            that._ItemDockPanel = that.FindControl("ItemDockPanel");
            that._RemoveButton = that.FindControl("RemoveButton");

            that._StuffLookupControl = that.FindControl("StuffLookupControl");
            that._SaderehTextBox = that.FindControl("SaderehTextBox");
            that._VaredehTextBox = that.FindControl("VaredehTextBox");
            that._BatchNumberComboBox = that.FindControl("BatchNumberComboBox");
            that._StuffStatusDropDownList = that.FindControl("StuffStatusDropDownList");
            that._StuffLocationDropDownList = that.FindControl("StuffLocationDropDownList");
            that._GhabzOrHavaleTypeLookupControl = that.FindControl("GhabzOrHavaleTypeLookupControl");
            that._StockLabel = that.FindControl("StockLabel");

            that._StuffStatusDropDownList.SetItemsDataSource(that._GridControl.WarehouseHybridOperationEditForm.StuffStatusEntityList.ToDataSourceData());

            that.FindControl("RowNumberLabel").InitDataBinding(that._BindableEntity);
            that._SaderehTextBox.InitDataBinding(that._BindableEntity);
            that._VaredehTextBox.InitDataBinding(that._BindableEntity);
            that._StuffLookupControl.InitDataBinding(that._BindableEntity);
            that._BatchNumberComboBox.InitDataBinding(that._BindableEntity);
            that._StuffStatusDropDownList.InitDataBinding(that._BindableEntity);
            that._StuffLocationDropDownList.InitDataBinding(that._BindableEntity);
            that._GhabzOrHavaleTypeLookupControl.InitDataBinding(that._BindableEntity);

            that._StuffStatusDropDownList.SetShowRequiredStar(false);
            that._StuffLocationDropDownList.SetShowRequiredStar(false);

            that._BatchNumberComboBox.SetVisible(false);

            that._RemoveButton.bind("Click", function (e) { that._RemoveButton_Click(e); });

            that._StuffLookupControl.bind("ValueChanged", function (e) { that._StuffLookupControl_ValueChanged(e); });
            that._StuffLookupControl.bind("OpeningLookup", function (e) { that._StuffLookupControl_OpeningLookup(e); });
            that._BatchNumberComboBox.bind("ValueChanged", function (e) { that._BatchNumberComboBox_ValueChanged(e); });
            that._StuffStatusDropDownList.bind("ValueChanged", function (e) { that._StuffStatusDropDownList_ValueChanged(e); });
            that._StuffLocationDropDownList.bind("ValueChanged", function (e) { that._StuffLocationDropDownList_ValueChanged(e); });
            that._SaderehTextBox.bind("ValueChanged", function (e) { that._SaderehVaredehTextBox_ValueChanged(e); });
            that._VaredehTextBox.bind("ValueChanged", function (e) { that._SaderehVaredehTextBox_ValueChanged(e); });

            if (that._BindableEntity.get("Stuff") != null) {
                that._StockLabel.SetText(that.GetStuffRealStock());

                var stuffBatchList = $.grep(that._GridControl.WarehouseHybridOperationEditForm.BatchList, function (o) {
                    return o.Stuff.toLowerCase() == that._BindableEntity.get("Stuff").toLowerCase();
                });

                if (stuffBatchList.length > 0) {
                    that._BatchNumberComboBox.SetItemsDataSource(stuffBatchList);
                    that._BatchNumberComboBox.SetText(that._BindableEntity.get("BatchNumber"));
                }

                that._SetStuffLocationByStuffID();
            }

            if (that._BindableEntity.get("TedadeSadereh") != null) {
                that._SetGhabzOrHavaleTypeFilter("Havale");
            }

            if (that._BindableEntity.get("TedadeVaredeh") != null) {
                that._SetGhabzOrHavaleTypeFilter("Ghabz");
            }

            that.AdjustRow();

            that.AdjustColor();
            that._IsInitForm = false;

            that._BindableEntity.bind("changed", function () { that._BindableEntity_Change(); });
        },

        _SaderehVaredehTextBox_ValueChanged: function (e) {
            var that = this;

            that._GhabzOrHavaleTypeLookupControl.SetValue(null);
            that._GhabzOrHavaleTypeLookupControl.SetBaseFilterExpression(null);

            if (!ValueIsEmpty(that._SaderehTextBox.GetText())) {
                that._VaredehTextBox.SetText(null);

                that._SetGhabzOrHavaleTypeFilter("Havale");
            }

            if (!ValueIsEmpty(that._VaredehTextBox.GetText())) {
                that._SaderehTextBox.SetText(null);

                that._SetGhabzOrHavaleTypeFilter("Ghabz");
            }
        },

        _SetStuffLocationByStuffID: function () {
            var that = this;

            var stuffLocationIDs = [];

            if (that._BindableEntity.get("Stuff") != null)
                stuffLocationIDs = afw.uiApi.CallServerMethodSync("cmn.GetStuffLocationIDsByStuffID", [that._BindableEntity.get("Stuff")]).ToDataSourceData();


            that._StuffLocationDropDownList.SetItemsDataSource(stuffLocationIDs);
        },

        _SetGhabzOrHavaleTypeFilter: function (ghabzOrHavaleTypeName) {
            var that = this;

            var warehouseDocType = afw.OptionSetHelper.GetOptionSetItemID("cmn.WarehouseDocType." + ghabzOrHavaleTypeName);
            that._GhabzOrHavaleTypeLookupControl.SetBaseFilterExpression(String.Format("WarehouseDocType = '{0}'", warehouseDocType));
        },

        _BatchNumberComboBox_ValueChanged: function (e) {
            var that = this;

            that._StockLabel.SetText(that.GetStuffRealStock());
        },

        _StuffLocationDropDownList_ValueChanged: function (e) {
            var that = this;

            that._StockLabel.SetText(that.GetStuffRealStock());
        },

        _StuffStatusDropDownList_ValueChanged: function (e) {
            var that = this;

            that._StockLabel.SetText(that.GetStuffRealStock());
        },

        GetStuffRealStock: function () {
            var that = this;

            var stuffLocationID = that._BindableEntity.get("StuffLocation");
            var stuffStatusID = that._BindableEntity.get("StuffStatus");
            var stuffID = that._BindableEntity.get("Stuff");

            if (stuffLocationID != null && stuffID != null) {
                var stock = afw.uiApi.CallServerMethodSync("wm.GetStuffRealStock", [stuffID, stuffLocationID,
                    stuffStatusID,
                    that._BindableEntity.get("BatchNumber"),
                    null, null]);
                return stock;
            }

            return 0;
        },

        _BindableEntity_Change: function () {
            var that = this;

            that._BindableEntity.GetEntity().ChangeStatus = "Modify";
        },

        _SetBindableEntityFieldsToNull: function () {
            var that = this;

            that._BindableEntity.set("BatchNumber", null);
        },

        AdjustRow: function () {
            var that = this;

            that._AdjustBatchNumberComboBox();
            //that._AdjustStuffSerialNumberButton();
        },

        _AdjustBatchNumberComboBox: function () {
            var that = this;

            var stuffDefEntity = that._GetStuffDef();
            if (stuffDefEntity != null && stuffDefEntity.GetFieldValue("BatchNumberIsRequiered")) {
                that._BatchNumberComboBox.SetVisible(true);
                that._BatchNumberComboBox.SetReadOnly(false);
            }
            else
                that._BatchNumberComboBox.SetVisible(false);
        },

        _AdjustStuffSerialNumberButton: function (serialNumberEntityList) {
            var that = this;

            var stuffDefEntity = that._GetStuffDef();
            if (stuffDefEntity != null && stuffDefEntity.GetFieldValue("NeedsSerialNumber"))
                that._StuffSerialNumberButton.SetVisible(true);
            else
                that._StuffSerialNumberButton.SetVisible(false);

            if (serialNumberEntityList == null) {

                if (that.StuffSerialNumberCount == that._BindableEntity.get("Quantity")) {
                    that._StuffSerialNumberButton.SetBackColor("#43c35e");
                    that._StuffSerialNumberButton.SetTextColor("#ffffff");
                }
                else {
                    that._StuffSerialNumberButton.SetBackColor("#ffffff");
                    that._StuffSerialNumberButton.SetTextColor("Black");
                }
            }
            else {
                if (serialNumberEntityList.Entities.length == that._BindableEntity.get("Quantity")) {
                    that._StuffSerialNumberButton.SetBackColor("#43c35e");
                    that._StuffSerialNumberButton.SetTextColor("#ffffff");
                }
                else {
                    that._StuffSerialNumberButton.SetBackColor("#ffffff");
                    that._StuffSerialNumberButton.SetTextColor("Black");
                }
            }

        },

        _StuffLookupControl_ValueChanged: function () {
            var that = this;

            that._SetBindableEntityFieldsToNull();

            that._SetStuffLocationByStuffID();

            var stuffID = null;

            stuffID = that._BindableEntity.get("Stuff");

            if (stuffID == null) {
                that._StockLabel.SetText(0);
                that.AdjustRow();
                return;
            }

            var stuffBatchList = $.grep(that._GridControl.WarehouseHybridOperationEditForm.BatchList, function (o) {
                return o.Stuff.toLowerCase() == stuffID.toLowerCase();
            });

            if (stuffBatchList.length > 0) {
                that._BatchNumberComboBox.SetItemsDataSource(stuffBatchList);
                that._BatchNumberComboBox.SetText(that._BindableEntity.get("BatchNumber"));
            }

            that._StockLabel.SetText(that.GetStuffRealStock());

            that.AdjustRow();
        },

        _StuffLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({ Mode: 'Lookup' });
        },

        _GetStuffDef: function () {
            var that = this;

            var rowEntity = that._BindableEntity.GetEntity();
            var stuffID = rowEntity.GetFieldValue("Stuff");

            if (ValueIsEmpty(stuffID)) {
                return null;
            }
            else {
                if (rowEntity.FieldExists("Stuff_Entity") &&
                    !ValueIsEmpty(rowEntity.GetFieldValue("Stuff_Entity")) && stuffID == rowEntity.GetFieldValue("Stuff_Entity"))
                    return rowEntity.GetFieldValue("Stuff_Entity").GetFieldValue("StuffDef_Entity");
                else {
                    var foundStuff = $.grep(that._GridControl.WarehouseHybridOperationEditForm.FetchedStuffs,
                        function (o) { return o.GetFieldValue("ID") == stuffID; });

                    if (foundStuff.length != 0)
                        return foundStuff[0].GetFieldValue("StuffDef_Entity");
                    else {
                        var fetchedStuff = afw.uiApi.FetchEntityByID("cmn.Stuff", stuffID, ["StuffDef"]);
                        that._GridControl.WarehouseHybridOperationEditForm.FetchedStuffs.push(fetchedStuff);
                        return fetchedStuff.GetFieldValue("StuffDef_Entity");
                    }
                }
            }
        },

        _FocusNextRow: function () {
            var that = this;

            if (!that.ValidateRow())
                return;
            var rowIndex = that._BindableEntity.get("RowNumber") - 1;
            var isLastRow = (rowIndex == that._GridControl.GetRowsCount() - 1);
            if (isLastRow)
                that._GridControl.AddEmptyItems(1);

            that._GridControl.GetRowByIndex(rowIndex + 1).SetFocus();
        },

        SetFocus: function () {
            var that = this;

            that._StuffLookupControl.Focus();
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
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

        ValidateRow: function () {
            var that = this;

            var rowNumber = that._BindableEntity.get("RowNumber");
            var shouldValidateRow = true;

            if (ValueIsEmpty(that._StuffLookupControl.GetValue())) {
                afw.ErrorDialog.Show(String.Format("کالا در سطر {0} را وارد نشده است.", rowNumber));
                return false;
            }

            if (ValueIsEmpty(that._StuffLocationDropDownList.GetValue())) {
                afw.ErrorDialog.Show(String.Format("انبار در سطر {0} انتخاب نشده است.", rowNumber));
                return false;
            }

            if (that._BatchNumberComboBox.GetVisible() == true && ValueIsEmpty(that._BatchNumberComboBox.GetValue())) {
                afw.ErrorDialog.Show(String.Format("فیلد شماره بچ در سطر {0} اجباری می باشد.", rowNumber));
                return false;
            }

            if (ValueIsEmpty(that._StuffStatusDropDownList.GetValue())) {
                afw.ErrorDialog.Show(String.Format("وضعیت کالا در سطر {0} انتخاب نشده است.", rowNumber));
                return false;
            }

            if (ValueIsEmpty(that._SaderehTextBox.GetValue()) && ValueIsEmpty(that._VaredehTextBox.GetValue())) {
                afw.ErrorDialog.Show(String.Format("تعداد وارده/صادره در سطر {0} وارد نشده است.", rowNumber));
                return false;
            }

            if (ValueIsEmpty(that._GhabzOrHavaleTypeLookupControl.GetValue())) {
                afw.ErrorDialog.Show(String.Format("نوع قبض/حواله در سطر {0} انتخاب نشده است.", rowNumber));
                return false;
            }

            return true;
        },

        _RemoveButton_Click: function (e) {
            var that = this;

            that._GridControl.RemoveRow(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.WarehouseHybridOperationItemsGridRowControl";
    FormClass.BaseType = afw.BasePanel;


    wm.WarehouseHybridOperationItemsGridRowControl = FormClass;
})();