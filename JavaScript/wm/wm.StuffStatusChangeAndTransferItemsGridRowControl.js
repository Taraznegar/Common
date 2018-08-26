(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return wm.StuffStatusChangeAndTransferItemsGridRowControl;
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

            that._StuffLookupContainerPanel = that.FindControl("StuffLookupContainerPanel");
            that._StuffLookupControl = that.FindControl("StuffLookupControl");
            that._QuantityTextBox = that.FindControl("QuantityTextBox");
            that._BatchNumberComboBox = that.FindControl("BatchNumberComboBox");
            that._StockLabel = that.FindControl("StockLabel");

            that.FindControl("RowNumberLabel").InitDataBinding(that._BindableEntity);
            that._QuantityTextBox.InitDataBinding(that._BindableEntity);
            that._StuffLookupControl.InitDataBinding(that._BindableEntity);
            that._BatchNumberComboBox.InitDataBinding(that._BindableEntity);
            that._BatchNumberComboBox.SetVisible(false);

            that._RemoveButton.bind("Click", function (e) { that._RemoveButton_Click(e); });

            that._StuffLookupControl.bind("ValueChanged", function (e) { that._StuffLookupControl_ValueChanged(e); });
            that._StuffLookupControl.bind("OpeningLookup", function (e) { that._StuffLookupControl_OpeningLookup(e); });
            that._QuantityTextBox.bind("ValueChanged", function (e) { that._QuantityTextBox_ValueChanged(e); });
            that._BatchNumberComboBox.bind("ValueChanged", function (e) { that._BatchNumberComboBox_ValueChanged(e); });

            that._StuffLookupControl.GetAutoComplete().bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._QuantityTextBox.Focus();
                }
            });
            that._QuantityTextBox.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._BatchNumberComboBox.Focus();
                }
            });
            that._BatchNumberComboBox.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._FocusNextRow();
                }
            });

            if (that._BindableEntity.get("Stuff") != null)
                that._StockLabel.SetText(that.GetStuffRealStock());

            if (that._BindableEntity.get("Stuff") != null) {
                var stuffBatchList = $.grep(that._GridControl.StuffStatusChangeAndTransferEditForm.BatchList, function (o) {
                    return o.Stuff.toLowerCase() == that._BindableEntity.get("Stuff").toLowerCase();
                });

                if (stuffBatchList.length > 0) {
                    that._BatchNumberComboBox.SetItemsDataSource(stuffBatchList);
                    that._BatchNumberComboBox.SetText(that._BindableEntity.get("BatchNumber"));
                }
            }

            that.SetStuffsLookupBaseFilterExpression();

            that.AdjustRow();

            that.AdjustColor();
            that._IsInitForm = false;

            that._BindableEntity.bind("changed", function () { that._BindableEntity_Change(); });

        },

        _BatchNumberComboBox_ValueChanged: function (e) {
            var that = this;

            that._StockLabel.SetText(that.GetStuffRealStock());
        },

        GetStuffRealStock: function () {
            var that = this;

            var stuffLocationID = that._GridControl.StuffStatusChangeAndTransferEditForm.GetBindableEntity().get("SourceStuffLocation");
            var primaryStatusID = that._GridControl.StuffStatusChangeAndTransferEditForm.GetBindableEntity().get("PrimaryStatus");
            var stuffID = that._BindableEntity.get("Stuff");

            if (stuffLocationID != null && stuffID != null) {
                var stock = afw.uiApi.CallServerMethodSync("wm.GetStuffRealStock", [stuffID, stuffLocationID,
                    primaryStatusID,
                    that._BindableEntity.get("BatchNumber"),
                    null, null]);
                return stock;
            }

            return 0;
        },

        SetStuffsLookupBaseFilterExpression: function () {
            var that = this;

            if (that._GridControl.StuffStatusChangeAndTransferEditForm.GetBindableEntity().get("SourceStuffLocation") != null) {
                that._StuffLookupControl.SetBaseFilterExpression(String.Format("InnerQuery.StuffDef in(\r\n" +
		            "select StuffPossibleLocation.StuffDef \r\n" +
		            "from cmn_StuffPossibleLocations StuffPossibleLocation \r\n" +
			        "    left join cmn_StuffLocations StuffLocation on StuffLocation.ID = StuffPossibleLocation.StuffLocation\r\n" +
		            "where StuffLocation.ID  = '{0}') and IsActive = 1",
                    that._GridControl.StuffStatusChangeAndTransferEditForm.GetBindableEntity().get("SourceStuffLocation")));
            }
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

            var stuffDefEntity = that._GetStuffDef();
            if (!ValueIsEmpty(stuffDefEntity)) {

                if (stuffDefEntity.GetFieldValue("BatchNumberIsRequiered")) {
                    that._BatchNumberIsRequired = true;
                    that._BatchNumberComboBox.SetReadOnly(false);
                    that._BatchNumberComboBox.SetVisible(true);

                }
                else {
                    that._BatchNumberIsRequired = false;
                    that._BatchNumberComboBox.SetReadOnly(true);
                    that._BatchNumberComboBox.SetVisible(false);
                }
            }
        },

        _QuantityTextBox_ValueChanged: function () {
            var that = this;

            return true;
        },

        _StuffLookupControl_ValueChanged: function () {
            var that = this;

            that._SetBindableEntityFieldsToNull();

            var stuffID = null;

            stuffID = that._BindableEntity.get("Stuff");

            if (stuffID == null) {
                that._StockLabel.SetText(0);
                that.AdjustRow();
                return;
            }

            var stuffBatchList = $.grep(that._GridControl.StuffStatusChangeAndTransferEditForm.BatchList, function (o) {
                return o.Stuff.toLowerCase() == stuffID.toLowerCase();
            });

            if (stuffBatchList.length > 0) {
                that._BatchNumberComboBox.SetItemsDataSource(stuffBatchList);
                that._BatchNumberComboBox.SetText(that._BindableEntity.get("BatchNumber"));
            }

            that._StockLabel.SetText(that.GetStuffRealStock());

            that.AdjustRow();
        },

        SetControlReadOnly: function (controlName, value) {
            var that = this;

            that.FindControl(controlName).SetReadOnly(value);
        },

        _StuffLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({ Mode: 'Lookup' });
        },

        SetControlText: function (controlName, text) {
            var that = this;

            that.FindControl(controlName).SetText(text);
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
                    var foundStuff = $.grep(that._GridControl.StuffStatusChangeAndTransferEditForm.FetchedStuffs,
                        function (o) { return o.GetFieldValue("ID") == stuffID; });

                    if (foundStuff.length != 0)
                        return foundStuff[0].GetFieldValue("StuffDef_Entity");
                    else {
                        var fetchedStuff = afw.uiApi.FetchEntityByID("cmn.Stuff", stuffID, ["StuffDef"]);
                        that._GridControl.StuffStatusChangeAndTransferEditForm.FetchedStuffs.push(fetchedStuff);
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

            if (that._StuffLookupControl.GetVisible() == true) {
                shouldValidateRow = !ValueIsEmpty(that._StuffLookupControl.GetValue());
                if (!shouldValidateRow) {
                    afw.ErrorDialog.Show(String.Format("لطفا کالا در سطر {0} را وارد کنید.", rowNumber));
                    return false;
                }
            }

            if (that._QuantityTextBox.GetVisible() == true) {
                shouldValidateRow = !ValueIsEmpty(that._QuantityTextBox.GetValue());
                if (!shouldValidateRow) {
                    afw.ErrorDialog.Show(String.Format("لطفا تعداد در سطر {0} را وارد کنید.", rowNumber));
                    return false;
                }
            }

            if (that._BatchNumberComboBox.GetVisible() == true && ValueIsEmpty(that._BatchNumberComboBox.GetValue())) {
                afw.ErrorDialog.Show(String.Format("فیلد شماره بچ در سطر {0} اجباری می باشد.", rowNumber));
                return false;
            }

            if (!that._QuantityTextBox_ValueChanged(rowNumber))
                return false;

            return true;
        },

        _RemoveButton_Click: function (e) {
            var that = this;

            that._GridControl.RemoveRow(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.StuffStatusChangeAndTransferItemsGridRowControl";
    FormClass.BaseType = afw.BasePanel;


    wm.StuffStatusChangeAndTransferItemsGridRowControl = FormClass;
})();