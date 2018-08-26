(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return wm.GhetehBardariAzKalaItemsGridRowControl;
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

            that._StuffLookupContainerPanel = that.FindControl("StuffLookupContainerPanel");
            that._StuffLookupControl = that.FindControl("StuffLookupControl");
            that._BatchNumberComboBox = that.FindControl("BatchNumberComboBox");
            that._StuffStatusDropDownList = that.FindControl("StuffStatusDropDownList");
            that._BatchNumberComboBox.SetVisible(false);
            that._StuffSerialNumbersTextBox = that.FindControl("StuffSerialNumbersTextBox");
            that._StuffSerialNumbersTextBox.SetVisible(false);

            that.FindControl("RowNumberLabel").InitDataBinding(that._BindableEntity);
            that._StuffLookupControl.InitDataBinding(that._BindableEntity);
            that._BatchNumberComboBox.InitDataBinding(that._BindableEntity);
            that._StuffStatusDropDownList.InitDataBinding(that._BindableEntity);
            that._StuffSerialNumbersTextBox.InitDataBinding(that._BindableEntity);

            that._RemoveButton.bind("Click", function (e) { that._RemoveButton_Click(e); });

            that._StuffLookupControl.bind("ValueChanged", function (e) { that._StuffLookupControl_ValueChanged(e); });
            that._StuffLookupControl.bind("OpeningLookup", function (e) { that._StuffLookupControl_OpeningLookup(e); });
            that._StuffLookupControl.GetAutoComplete().bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._BatchNumberComboBox.Focus();
                }
            });

            that._BatchNumberComboBox.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._StuffSerialNumbersTextBox.Focus();
                }
            });

            that._StuffSerialNumbersTextBox.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._StuffStatusDropDownList.Focus();
                }
            });

            that._StuffStatusDropDownList.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._FocusNextRow();
                }
            });

            var stuffStatusEntityList = that._GridControl.GhetehBardariAzKalaEditForm.StuffStatusEntityList;
            if (stuffStatusEntityList.Entities.length != 0) {
                that._StuffStatusDropDownList.SetItemsDataSource(stuffStatusEntityList.ToDataSourceData());
                that._StuffStatusDropDownList.SetValue(stuffStatusEntityList.Entities[0].GetFieldValue("ID"));
            }

            if (that._BindableEntity.get("Stuff") != null) {
                var stuffBatchList = $.grep(that._GridControl.GhetehBardariAzKalaEditForm.BatchList, function (o) {
                    return o.Stuff.toLowerCase() == that._BindableEntity.get("Stuff").toLowerCase();
                });

                if (stuffBatchList.length > 0) {
                    that._BatchNumberComboBox.SetItemsDataSource(stuffBatchList);
                    that._BatchNumberComboBox.SetText(that._BindableEntity.get("BatchNumber"));
                }
            }

            that.AdjustRow();

            that.AdjustColor();
            that._IsInitForm = false;

            that._BindableEntity.bind("changed", function () { that._BindableEntity_Change(); });
        },

        _BindableEntity_Change: function () {
            var that = this;

            that._BindableEntity.GetEntity().ChangeStatus = "Modify";
        },

        _SetBindableEntityFieldsToNull: function () {
            var that = this;

            that._BindableEntity.set("BatchNumber", null);
            that._BindableEntity.set("StuffSerialNumbers", null);
        },

        AdjustRow: function () {
            var that = this;

            var stuffDefEntity = that._GetStuffDef();
            if (!ValueIsEmpty(stuffDefEntity)) {
                if (stuffDefEntity.GetFieldValue("BatchNumberIsRequiered"))
                    that._BatchNumberComboBox.SetVisible(true);
                else
                    that._BatchNumberComboBox.SetVisible(false);

                if (stuffDefEntity.GetFieldValue("NeedsSerialNumber"))
                    that._StuffSerialNumbersTextBox.SetVisible(true);
                else
                    that._StuffSerialNumbersTextBox.SetVisible(false);
            }
            else {
                that._BatchNumberComboBox.SetVisible(false);
                that._StuffSerialNumbersTextBox.SetVisible(false);
            }
        },

        _StuffLookupControl_ValueChanged: function () {
            var that = this;

            that._SetBindableEntityFieldsToNull();

            var stuffID = null;

            stuffID = that._BindableEntity.get("Stuff");

            if (stuffID == null) {
                that.AdjustRow();
                return;
            }

            var stuffBatchList = $.grep(that._GridControl.GhetehBardariAzKalaEditForm.BatchList, function (o) {
                return o.Stuff.toLowerCase() == stuffID.toLowerCase();
            });

            if (stuffBatchList.length > 0) {
                that._BatchNumberComboBox.SetItemsDataSource(stuffBatchList);
                that._BatchNumberComboBox.SetText(that._BindableEntity.get("BatchNumber"));
            }

            that.AdjustRow();
        },

        _StuffLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({ Mode: 'Lookup' });
        },

        _GetStuffDef: function () {
            var that = this;

            var rowEntity = that._BindableEntity.GetEntity();
            var stuffID = that._BindableEntity.GetEntity().GetFieldValue("Stuff");

            if (ValueIsEmpty(stuffID)) {
                return null;
            }
            else {
                if (rowEntity.FieldExists("Stuff_Entity") &&
                    !ValueIsEmpty(rowEntity.GetFieldValue("Stuff_Entity")) && stuffID == rowEntity.GetFieldValue("Stuff_Entity"))
                    return rowEntity.GetFieldValue("Stuff_Entity").GetFieldValue("StuffDef_Entity");
                else {
                    var foundStuff = $.grep(that._GridControl.GhetehBardariAzKalaEditForm.FetchedStuffs,
                        function (o) { return o.GetFieldValue("ID") == stuffID; });

                    if (foundStuff.length != 0)
                        return foundStuff[0].GetFieldValue("StuffDef_Entity");
                    else {
                        var fetchedStuff = afw.uiApi.FetchEntityByID("cmn.Stuff", stuffID, ["StuffDef"]);
                        that._GridControl.GhetehBardariAzKalaEditForm.FetchedStuffs.push(fetchedStuff);
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

            if (that._StuffLookupControl.GetVisible() == true) {
                if (ValueIsEmpty(that._StuffLookupControl.GetValue())) {
                    afw.ErrorDialog.Show(String.Format("کالا در سطر {0} وارد نشده است .", rowNumber));
                    return false;
                }
            }

            if (that._StuffStatusDropDownList.GetVisible() == true) {
                if (ValueIsEmpty(that._StuffStatusDropDownList.GetValue())) {
                    afw.ErrorDialog.Show(String.Format("وضعیت کالا در سطر {0} انتخاب نشده است.", rowNumber));
                    return false;
                }
            }

            if (that._BatchNumberComboBox.GetVisible() && ValueIsEmpty(that._BatchNumberComboBox.GetValue())) {
                afw.ErrorDialog.Show(String.Format("شماره بچ در سطر {0} وارد نشده است.", rowNumber));
                return false;
            }

            if (that._StuffSerialNumbersTextBox.GetVisible() == true && ValueIsEmpty(that._StuffSerialNumbersTextBox.GetValue())) {
                afw.ErrorDialog.Show(String.Format("شماره سریال در سطر {0} وارد نشده.", rowNumber));
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

    FormClass.TypeName = "wm.GhetehBardariAzKalaItemsGridRowControl";
    FormClass.BaseType = afw.BasePanel;


    wm.GhetehBardariAzKalaItemsGridRowControl = FormClass;
})();