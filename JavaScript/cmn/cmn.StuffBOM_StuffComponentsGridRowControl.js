(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return cmn.StuffBOM_StuffComponentsGridRowControl;
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
            that._QuantityTextBox = that.FindControl("QuantityTextBox");
            that._MeasurementUnitLookupControl = that.FindControl("MeasurementUnitLookupControl");
            that._ValuePercentTextBox = that.FindControl("ValuePercentTextBox");

            that.FindControl("RowNumberLabel").InitDataBinding(that._BindableEntity);
            that._StuffLookupControl.InitDataBinding(that._BindableEntity);
            that._QuantityTextBox.InitDataBinding(that._BindableEntity);
            that._MeasurementUnitLookupControl.InitDataBinding(that._BindableEntity);
            that._ValuePercentTextBox.InitDataBinding(that._BindableEntity);

            that._RemoveButton.bind("Click", function (e) { that._RemoveButton_Click(e); });

            that._StuffLookupControl.bind("ValueChanged", function (e) { that._StuffLookupControl_ValueChanged(e); });
            that._StuffLookupControl.bind("OpeningLookup", function (e) { that._StuffLookupControl_OpeningLookup(e); });

            that._StuffLookupControl.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._QuantityTextBox.Focus();
                }
            });

            that._QuantityTextBox.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._MeasurementUnitLookupControl.Focus();
                }
            });

            that._MeasurementUnitLookupControl.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    if (that._ValuePercentTextBox.GetVisible() == true)
                        that._ValuePercentTextBox.Focus();
                    else
                        that._FocusNextRow();
                }
            });

            that._ValuePercentTextBox.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._FocusNextRow();
                }
            });

            that.AdjustRow();

            that.AdjustColor();
            that._IsInitForm = false;

            that._BindableEntity.bind("changed", function () { that._BindableEntity_Change(); });
        },

        _BindableEntity_Change: function () {
            var that = this;

            that._BindableEntity.GetEntity().ChangeStatus = "Modify";
        },

        AdjustRow: function () {
            var that = this;

        },

        _StuffLookupControl_ValueChanged: function () {
            var that = this;

            var stuffID = that._BindableEntity.get("Stuff");

            if (stuffID == null) {
                that.AdjustRow();
                return;
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
                    var foundStuff = $.grep(that._GridControl.ParentEditForm.FetchedStuffs,
                        function (o) { return o.GetFieldValue("ID") == stuffID; });

                    if (foundStuff.length != 0)
                        return foundStuff[0].GetFieldValue("StuffDef_Entity");
                    else {
                        var fetchedStuff = afw.uiApi.FetchEntityByID("cmn.Stuff", stuffID, ["StuffDef"]);
                        that._GridControl.ParentEditForm.FetchedStuffs.push(fetchedStuff);
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

            if (ValueIsEmpty(that._QuantityTextBox.GetValue())) {
                afw.ErrorDialog.Show(String.Format("تعداد در سطر {0} انتخاب نشده است.", rowNumber));
                return false;
            }

            if (ValueIsEmpty(that._MeasurementUnitLookupControl.GetValue())) {
                afw.ErrorDialog.Show(String.Format("واحد در سطر {0} انتخاب نشده است.", rowNumber));
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

    FormClass.TypeName = "cmn.StuffBOM_StuffComponentsGridRowControl";
    FormClass.BaseType = afw.BasePanel;


    cmn.StuffBOM_StuffComponentsGridRowControl = FormClass;
})();