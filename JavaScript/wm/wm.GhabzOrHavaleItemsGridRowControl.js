(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return wm.GhabzOrHavaleItemsGridRowControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._BindableEntity = options.RowEntity.ToBindableEntity();
            that._GridControl = options.GridControl;

            that._ItemDockPanel = that.FindControl("ItemDockPanel");
            that._RemoveButton = that.FindControl("RemoveButton");

            that._StuffLookupControl = that.FindControl("StuffLookupControl");
            that._QuantityTextBox = that.FindControl("QuantityTextBox");
            that._StuffStatusDropDownList = that.FindControl("StuffStatusDropDownList");
            that._StuffSerialNumberButton = that.FindControl("SetStuffSerialNumberButton");
            that._BatchNumberComboBox = that.FindControl("BatchNumberComboBox");
            that._StockLabel = that.FindControl("StockLabel");
            that._RialiAmountTextBox = that.FindControl("RialiAmountTextBox");

            that.FindControl("RowNumberLabel").InitDataBinding(that._BindableEntity);
            that._QuantityTextBox.InitDataBinding(that._BindableEntity);
            that._StuffStatusDropDownList.InitDataBinding(that._BindableEntity);
            that._StuffLookupControl.InitDataBinding(that._BindableEntity);
            that._BatchNumberComboBox.InitDataBinding(that._BindableEntity);
            that._ColumnsInfo = that._GridControl.ColumnsInfo;

            that._RemoveButton.bind("Click", function (e) { that._RemoveButton_Click(e); });

            that._StuffSerialNumberButton.bind("Click", function (e) { that._StuffSerialNumberButton_Click(); });

            that._BatchNumberComboBox.bind("ValueChanged", function (e) { that._BatchNumberAndStuffStatusControl_ValueChanged(e); });
            that._StuffStatusDropDownList.bind("ValueChanged", function (e) { that._BatchNumberAndStuffStatusControl_ValueChanged(e); });

            that._StuffLookupControl.bind("ValueChanged", function (e) { that._StuffLookupControl_ValueChanged(e); });
            that._StuffLookupControl.bind("OpeningLookup", function (e) { that._StuffLookupControl_OpeningLookup(e); });
            that._StuffLookupControl.GetAutoComplete().bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._QuantityTextBox.Focus();
                }
            });

            that._QuantityTextBox.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._FocusNextRow();
                }
            });

            var rowControl = null;
            if (that._BindableEntity.get("Stuff") != null) {
                that._StockLabel.SetText(that.GetStuffRealStock());
            }

            var stuffStatusEntityList = that._GridControl.GhabzOrHavaleEditForm.StuffStatusEntityList;
            if (stuffStatusEntityList.Entities.length != 0) {
                that._StuffStatusDropDownList.SetItemsDataSource(stuffStatusEntityList.ToDataSourceData());
                if (that._BindableEntity.get("StuffStatus") == null)
                    that._StuffStatusDropDownList.SetValue(stuffStatusEntityList.Entities[0].GetFieldValue("ID"));
            }

            if (that._BindableEntity.get("Stuff") != null) {
                var stuffBatchList = $.grep(that._GridControl.GhabzOrHavaleEditForm.BatchList, function (o) {
                    return o.Stuff.toLowerCase() == that._BindableEntity.get("Stuff").toLowerCase();
                });

                if (stuffBatchList.length > 0) {
                    that._BatchNumberComboBox.SetItemsDataSource(stuffBatchList);
                    that._BatchNumberComboBox.SetText(that._BindableEntity.get("BatchNumber"));
                }
            }

            if (that._GridControl.GhabzOrHavaleEditForm.GetFormMode() == "Edit")
                that.StuffSerialNumberCount = afw.uiApi.CallServerMethodSync("wm.GetGhabzOrHavaleItemSavedSerialNumbersCount",
                    [that._BindableEntity.get("ID")]);

            if (afw.PermissionHelper.UserHasPermissionToItem("wm.TaghirMablaghRialiAsnadAnbar")) {               
                that._RialiAmountTextBox.InitDataBinding(that._BindableEntity);
                that._RialiAmountTextBox.SetReadOnly(true);

                if (that._GridControl.GhabzOrHavaleEditForm.GhabzOrHavaleTypeEntity.GetFieldValue("NahveRialiNemodan") == afw.OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan.Dasti")
                    || that._GridControl.GhabzOrHavaleEditForm.GetBindableEntity().get("ForceManualRiali"))
                    that._RialiAmountTextBox.SetReadOnly(false);
            }
            else {
                that._RialiAmountTextBox.SetVisible(false);
            }

            that._CreateStuffSerialNumbersField();

            that.SetStuffsLookupBaseFilterExpression();

            that.AdjustRow();

            that.AdjustColor();
            that._IsInitForm = false;

            that._BindableEntity.bind("changed", function () { that._BindableEntity_Change(); });

            var index = that._GridControl.RowsEntityList.Entities.FindIndex(function (o) {
                return o.GetFieldValue("Stuff") == that._BindableEntity.get("Stuff");
            });

            if (that._BindableEntity.GetEntity().ChangeStatus == "Modify") {
                rowControl = that._GridControl.GetRowByIndex(index);
                rowControl.FindControl("StockLabel").SetText(that.GetStuffRealStock());
            }
        },

        _BatchNumberAndStuffStatusControl_ValueChanged: function (e) {
            var that = this;

            if (that._GridControl.GhabzOrHavaleEditForm.GetBindableEntity().GetEntity().GetFieldValue("StuffLocation") != null) {
                that._StockLabel.SetText(that.GetStuffRealStock());
            }
        },

        _StuffLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({ Mode: 'Lookup' });
        },

        _BindableEntity_Change: function () {
            var that = this;

            //that._BindableEntity.GetEntity().ChangeStatus = "Modify";
        },

        AdjustRow: function () {
            var that = this;

            for (var colIndex = 0; colIndex < that._ColumnsInfo.length; colIndex++) {
                var columnIsVisible = that._ColumnsInfo[colIndex].IsVisible;

                that._SetCellVisible(colIndex, columnIsVisible);
            }

            that._AdjustBatchNumberComboBox();
            that._AdjustStuffSerialNumberButton();

            if (that._GridControl.GhabzOrHavaleEditForm.GetBindableEntity().GetEntity().GetFieldValue("StuffLocation") == null)
                that._StuffLookupControl.SetReadOnly(true);
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

        _SetCellVisible: function (columnNameOrIndex, value) {
            var that = this;

            var columnIndex = ValueIsNumber(columnNameOrIndex) ? columnNameOrIndex : that._GridControl.GetColumnIndex(columnNameOrIndex);
            var cellPaneIndex = ((columnIndex + 1) * 2) + 1;

            if (value == false) {
                var cellPane = that._ItemDockPanel.Panes[cellPaneIndex + 1];

                if (cellPane.HasChildControls) {
                    cellPane.ChildControls[0].SetVisible(false);
                }

                that._ItemDockPanel.SetPaneSizeSetting(cellPaneIndex, 1);
                that._ItemDockPanel.SetPaneSizeSetting(cellPaneIndex + 1, 1);
            }
            else {
                that._ItemDockPanel.SetPaneSizeSetting(cellPaneIndex, 3);
                that._ItemDockPanel.SetPaneSizeSetting(cellPaneIndex + 1, that._ColumnsInfo[columnIndex].Size);
            }
        },

        _StuffSerialNumberButton_Click: function (e) {
            var that = this;

            if (that._StuffLookupControl.GetValue() == null) {
                afw.ErrorDialog.Show("کالا برای ثبت شماره سریال انتخاب نشده است.");
                return;
            }

            if (that._QuantityTextBox.GetValue() <= 0) {
                afw.ErrorDialog.Show("تعداد کالای وارد شده مجاز نمی باشد.");
                return;
            }

            that._StuffsSerialNumberEditFormWindow = afw.uiApi.OpenSavedWindow("wm.StuffsSerialNumberEditForm", {
                Name: "StuffsSerialNumberEditForm",
                Modal: true,
                FormMode: "New",
                Title: "ثبت شماره سریال کالا ها",
                GhabzOrHavaleItemID: that._BindableEntity.GetEntity().GetFieldValue("ID"),
                StuffQuantity: that._QuantityTextBox.GetValue(),
                StuffSerialNumberEntityList: that.StuffsSerialNumberEntityList
            });

            that._StuffsSerialNumberEditFormWindow.bind("Close", function (e) { that._StuffsSerialNumberEditFormWindow_Close(e); });
        },

        _StuffsSerialNumberEditFormWindow_Close: function (e) {
            var that = this;

            that._BindableEntity.GetEntity().SetFieldValue("StuffsSerialNumbers", that._StuffsSerialNumberEditFormWindow.StuffSerialNumberEntityList);

            that._AdjustStuffSerialNumberButton(that._StuffsSerialNumberEditFormWindow.StuffSerialNumberEntityList);
        },

        _CreateStuffSerialNumbersField: function () {
            var that = this;

            if (!that._BindableEntity.GetEntity().FieldExists("StuffsSerialNumbers"))
                that._BindableEntity.GetEntity().AddField("StuffsSerialNumbers");
            else {
                that._BindableEntity.GetEntity().RemoveField("StuffsSerialNumbers");
                that._BindableEntity.GetEntity().AddField("StuffsSerialNumbers");
            }

            if (that._GridControl.GhabzOrHavaleEditForm.GetFormMode() == "New") {

                if (ValueIsEmpty(that._BindableEntity.get("StuffsSerialNumbers"))) {
                    that.StuffsSerialNumberEntityList = afw.uiApi.CreateEntityList("wm.StuffSerialNumber");
                    that._BindableEntity.GetEntity().SetFieldValue("StuffsSerialNumbers", that.StuffsSerialNumberEntityList);
                }
                else
                    that._BindableEntity.GetEntity().SetFieldValue("StuffsSerialNumbers", that.StuffsSerialNumberEntityList);
            }
            else {

                if (ValueIsEmpty(that._BindableEntity.get("StuffsSerialNumbers"))) {
                    that.StuffsSerialNumberEntityList = afw.uiApi.FetchEntityList("wm.StuffSerialNumber",
                        String.Format("GhabzOrHavaleItem = '{0}'", that._BindableEntity.get("ID")));
                    that._BindableEntity.GetEntity().SetFieldValue("StuffsSerialNumbers", that.StuffsSerialNumberEntityList);
                }
            }
        },

        GetStuffRealStock: function () {
            var that = this;

            var stuffLocationID = that._GridControl.GhabzOrHavaleEditForm.GetBindableEntity().GetEntity().GetFieldValue("StuffLocation");
            var stuffID = that._BindableEntity.get("Stuff");

            if (stuffLocationID != null && stuffID != null) {
                var stock = afw.uiApi.CallServerMethodSync("wm.GetStuffRealStock", [stuffID, stuffLocationID,
                    that._BindableEntity.get("StuffStatus"),
                    that._BindableEntity.get("BatchNumber"),
                    null, null]);
                return stock;
            }

            return 0;
        },

        _StuffLookupControl_ValueChanged: function () {
            var that = this;

            var stuffID = null;

            stuffID = that._BindableEntity.get("Stuff");

            if (stuffID == null) {
                that._StockLabel.SetText(0);
                that.AdjustRow();
                return;
            }

            var stuffBatchList = $.grep(that._GridControl.GhabzOrHavaleEditForm.BatchList, function (o) {
                return o.Stuff.toLowerCase() == stuffID.toLowerCase();
            });

            if (stuffBatchList.length > 0)
                that._BatchNumberComboBox.SetItemsDataSource(stuffBatchList);

            if (that._IsInitForm == false)
                that._QuantityTextBox.SetText("1");

            that._StockLabel.SetText(that.GetStuffRealStock());

            that.AdjustRow();
        },

        _GetStuffDef: function () {
            var that = this;

            var rowEntity = that._BindableEntity.GetEntity();
            var stuffID = rowEntity.GetFieldValue("Stuff");

            if (ValueIsEmpty(stuffID))
                return null;

            if (rowEntity.FieldExists("Stuff_Entity")
                && !ValueIsEmpty(rowEntity.GetFieldValue("Stuff_Entity"))
                && stuffID == rowEntity.GetFieldValue("Stuff_Entity"))
                return rowEntity.GetFieldValue("Stuff_Entity").GetFieldValue("StuffDef_Entity");

            var foundStuff = $.grep(that._GridControl.GhabzOrHavaleEditForm.FetchedStuffs,
                function (o) { return o.GetFieldValue("ID") == stuffID; });

            if (foundStuff.length != 0)
                return foundStuff[0].GetFieldValue("StuffDef_Entity");

            var fetchedStuff = afw.uiApi.FetchEntityByID("cmn.Stuff", stuffID, ["StuffDef"]);
            that._GridControl.GhabzOrHavaleEditForm.FetchedStuffs.push(fetchedStuff);
            return fetchedStuff.GetFieldValue("StuffDef_Entity");
        },

        _FocusNextRow: function () {
            var that = this;

            if (!that.ValidateRow())
                return;

            var rowIndex = that._BindableEntity.get("RowNumber") - 1;
            var isLastRow = (rowIndex == that._GridControl.GetRowsCount() - 1);
            if (isLastRow && that._GridControl.GhabzOrHavaleTypeEntity.GetFieldValue("CanAddItems")) {
                that._GridControl.AddEmptyItems(1);
                that._GridControl.GetRowByIndex(rowIndex + 1).SetFocus();
            }
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

        SetControlVisible: function (controlName, value) {
            var that = this;

            that.FindControl(controlName).SetVisible(value);
        },

        SetControlValue: function (controlName, value) {
            var that = this;

            that.FindControl(controlName).SetValue(value);
        },

        SetControlText: function (controlName, text) {
            var that = this;

            that.FindControl(controlName).SetText(text);
        },

        SetControlReadOnly: function (controlName, value) {
            var that = this;

            that.FindControl(controlName).SetReadOnly(value);
        },

        SetStuffsLookupBaseFilterExpression: function () {
            var that = this;

            if (that._GridControl.GhabzOrHavaleEditForm.GetBindableEntity().GetEntity().GetFieldValue("StuffLocation") != null) {
                that._StuffLookupControl.SetBaseFilterExpression(String.Format("InnerQuery.StuffDef in (\r\n" +
		            "select StuffPossibleLocation.StuffDef \r\n" +
		            "from cmn_StuffPossibleLocations StuffPossibleLocation \r\n" +
			        "    left join cmn_StuffLocations StuffLocation on StuffLocation.ID = StuffPossibleLocation.StuffLocation\r\n" +
		            "where StuffLocation.ID  = '{0}') and IsActive = 1",
                    that._GridControl.GhabzOrHavaleEditForm.GetBindableEntity().GetEntity().GetFieldValue("StuffLocation")));
            }
        },

        ValidateRow: function () {
            var that = this;

            var rowNumber = that._BindableEntity.get("RowNumber");

            if (that._StuffLookupControl.GetVisible() == true && ValueIsEmpty(that._StuffLookupControl.GetValue())) {
                afw.ErrorDialog.Show(String.Format("کالا در سطر {0} وارد نشده است.", rowNumber));
                return false;
            }

            if (that._QuantityTextBox.GetVisible() == true && ValueIsEmpty(that._QuantityTextBox.GetValue())) {
                afw.ErrorDialog.Show(String.Format("تعداد در سطر {0} وارد نشده است.", rowNumber));
                return false;
            }

            if (that._StuffStatusDropDownList.GetVisible() == true && ValueIsEmpty(that._StuffStatusDropDownList.GetValue())) {
                afw.ErrorDialog.Show(String.Format("وضعیت در سطر {0} انتخاب نشده است.", rowNumber));
                return false;
            }

            if (that._BatchNumberComboBox.GetVisible() == true && ValueIsEmpty(that._BatchNumberComboBox.GetValue())) {
                afw.ErrorDialog.Show(String.Format("شماره بچ در سطر {0} انتخاب نشده است.", rowNumber));
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

    FormClass.TypeName = "wm.GhabzOrHavaleItemsGridRowControl";
    FormClass.BaseType = afw.BasePanel;


    wm.GhabzOrHavaleItemsGridRowControl = FormClass;
})();