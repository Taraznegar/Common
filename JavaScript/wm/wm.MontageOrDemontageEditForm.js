(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return wm.MontageOrDemontageEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._StuffLocationFieldControl = that.FindControl("StuffLocationFieldControl");
            that._MainStuffLookupControl = that.FindControl("MainStuffFieldControl").FindControl("InnerControl");
            that._MainStuffBatchNumberFieldControl = that.FindControl("MainStuffBatchNumberFieldControl");
            that._IssueDateFieldControl = that.FindControl("IssueDateFieldControl");
            that._QuantityFieldControl = that.FindControl("QuantityFieldControl");

            that.FetchedStuffs = [];
            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();
            that.BatchList = afw.DataListHelper.FetchEntityListOfDataList("wm.BatchList").ToDataSourceData();
            that.StuffStatusEntityList = afw.uiApi.FetchEntityList("wm.StuffStatus", null, "DisplayeOrder");
            that.ComponentsEntityList = null;

            that.FindControl("OpNumberFieldControl").SetReadOnly(true);
            that.FindControl("OrganizationUnitFieldControl").SetReadOnly(true);

            var entity = that._BindableEntity.GetEntity();

            if (that.IsMontage())
                that.SetTitle("مونتاژ");
            else
                that.SetTitle("دمونتاژ");

            that._MainStuffLookupControl.SetLookupWindowDefaultWidth(1300);

            that._StuffLocationFieldControl.bind("ValueChanged", function (e) { that._StuffLocationFieldControl_ValueChanged(e); });
            that._MainStuffLookupControl.bind("ValueChanged", function (e) { that._MainStuffLookupControl_ValueChanged(e); });
            that._MainStuffLookupControl.bind("OpeningLookup", function (e) { that._MainStuffLookupControl_OpeningLookup(e); });
            that._QuantityFieldControl.bind("ValueChanged", function (e) { that._QuantityFieldControl_ValueChanged(e); });

            if (!entity.FieldExists("StuffComponents"))
                entity.AddField("StuffComponents");

            if (that._FormMode == "New") {
                if (ValueIsEmpty(entity.GetFieldValue("StuffComponents"))) {
                    that.ComponentsEntityList = afw.uiApi.CreateEntityList("wm.MontageOrDemontageStuffComponent");
                    entity.SetFieldValue("StuffComponents", that.ComponentsEntityList);
                }
                else
                    that.ComponentsEntityList = entity.GetFieldValue("StuffComponents");

                that._StuffLocationFieldControl.SetValue(wm.GetDefaultSourceStuffLocation());
                that._IssueDateFieldControl.SetValue(afw.DateTimeHelper.GetServerDateTime().split(' ')[0]);
                that._BindableEntity.set("FinancialYear", that._ActiveFinancialYearID);
                entity.SetFieldValue("OpNumber", -1);
            }
            else {
                if (ValueIsEmpty(entity.GetFieldValue("StuffComponents"))) {
                    that.ComponentsEntityList = afw.uiApi.FetchEntityList("wm.MontageOrDemontageStuffComponent",
                        String.Format("MontageOrDemontage = '{0}'",
                        that._BindableEntity.get("ID")), "RowNumber", null, null, ["Stuff.StuffDef"]);
                    entity.SetFieldValue("StuffComponents", that.ComponentsEntityList);
                }
                else
                    that.ComponentsEntityList = entity.GetFieldValue("StuffComponents");
            }

            that._CreateComponentsGridControl();
        },

        IsMontage: function () {
            var that = this;

            var entity = that._BindableEntity.GetEntity();
            return entity.GetFieldValue("OpType") == afw.OptionSetHelper.GetOptionSetItemID("wm.MontageOrDemontage.Montage")
        },

        IsDemontage: function () {
            var that = this;

            var entity = that._BindableEntity.GetEntity();
            return entity.GetFieldValue("OpType") == afw.OptionSetHelper.GetOptionSetItemID("wm.MontageOrDemontage.Demontage")
        },

        GetQuantityValue: function () {
            var that = this;

            return that._QuantityFieldControl.GetValue();
        },

        _CreateComponentsGridControl: function () {
            var that = this;

            that._ComponentsGridControl = new wm.MontageOrDemontageStuffComponentsGridControl({
                ParentControl: that._MainDockPanel.Panes[2],
                Name: "ComponentsGridControl",
                ParentEditForm: that,
                RowsEntityList: that.ComponentsEntityList
            });

            if (that.ComponentsEntityList.Entities.length == 0)
                that._ComponentsGridControl.AddEmptyItems(1);
            else {
                for (var i = 0; i < that.ComponentsEntityList.Entities.length; i++) {
                    that._ComponentsGridControl.AddRow(that.ComponentsEntityList.Entities[i]);
                }
            }
        },

        _MainStuffLookupControl_OpeningLookup: function (e) {
            var that = this;

            e.Sender.SetLookupDataListControlCustomOptions({ Mode: 'Lookup' });
        },

        _SetStuffsLookupBaseFilterExpression: function () {
            var that = this;

            if (that._BindableEntity.get("StuffLocation") != null) {
                that._MainStuffLookupControl.SetBaseFilterExpression(String.Format("InnerQuery.StuffDef in(\r\n" +
		            "select StuffPossibleLocation.StuffDef \r\n" +
		            "from cmn_StuffPossibleLocations StuffPossibleLocation \r\n" +
			        "    left join cmn_StuffLocations StuffLocation on StuffLocation.ID = StuffPossibleLocation.StuffLocation\r\n" +
		            "where StuffLocation.ID  = '{0}') and IsActive = 1",
                    that._BindableEntity.get("StuffLocation")));
            }
        },

        _MainStuffLookupControl_ValueChanged: function (e) {
            var that = this;

            that._BindableEntity.set("MainStuffBatchNumber", null);

            that._ComponentsGridControl.RemoveAllRows();

            if (that._MainStuffLookupControl.GetValue() != null) {
                var stuffBOM = afw.uiApi.FetchEntity("cmn.StuffBOM",
                    String.Format("Stuff = '{0}'", that._MainStuffLookupControl.GetValue()),
                    ["StuffBOM_StuffComponents"]);

                if (stuffBOM != null) {
                    var bomComponents = stuffBOM.GetFieldValue("StuffBOM_StuffComponents").Entities;

                    for (var i = 0; i <= bomComponents.length - 1; i++) {
                        var montageOrDemontageStuffComponent = afw.uiApi.CreateNewEntity("wm.MontageOrDemontageStuffComponent");

                        montageOrDemontageStuffComponent.SetFieldValue("MontageOrDemontage", that._BindableEntity.get("ID"));
                        montageOrDemontageStuffComponent.SetFieldValue("Stuff", bomComponents[i].GetFieldValue("Stuff"));
                        montageOrDemontageStuffComponent.SetFieldValue("QuantityInOneProduct", bomComponents[i].GetFieldValue("Quantity"));
                        montageOrDemontageStuffComponent.SetFieldValue("MeasurementUnit", bomComponents[i].GetFieldValue("MeasurementUnit"));
                        montageOrDemontageStuffComponent.SetFieldValue("RowNumber", i + 1);

                        if (that.IsDemontage())
                            montageOrDemontageStuffComponent.SetFieldValue("Demontage_ValuationPercent", bomComponents[i].GetFieldValue("ValuePercent"));

                        that.ComponentsEntityList.Entities.push(montageOrDemontageStuffComponent);
                        var newRow = that._ComponentsGridControl.AddRow(montageOrDemontageStuffComponent);
                        newRow.RecalculateTotalQuantity();
                    }
                }
                else {
                    that._ComponentsGridControl.AddEmptyItems(1);
                }
            }

            that._AdjustForm();
        },

        _GetMainStuff_StuffDef: function () {
            var that = this;

            var entity = that._BindableEntity.GetEntity();
            var mainStuffID = entity.GetFieldValue("MainStuff");

            if (ValueIsEmpty(mainStuffID)) {
                return null;
            }
            else {
                var foundStuff = $.grep(that.FetchedStuffs,
                    function (o) { return o.GetFieldValue("ID") == mainStuffID; });

                if (foundStuff.length != 0)
                    return foundStuff[0].GetFieldValue("StuffDef_Entity");
                else {
                    var fetchedStuff = afw.uiApi.FetchEntityByID("cmn.Stuff", mainStuffID, ["StuffDef"]);
                    that.FetchedStuffs.push(fetchedStuff);
                    return fetchedStuff.GetFieldValue("StuffDef_Entity");
                }
            }
        },

        _StuffLocationFieldControl_ValueChanged: function () {
            var that = this;

            that._SetStuffsLookupBaseFilterExpression();
            wm.SetDefaultSourceStuffLocation(that._StuffLocationFieldControl.GetValue());
        },

        _QuantityFieldControl_ValueChanged: function () {
            var that = this;

            var quantity = that._QuantityFieldControl.GetValue();

            if (!quantity > 0)
                afw.ErrorDialog.Show("مقدار/تعداد باید بیشتر از صفر باشد.");

            that._ComponentsGridControl.RecalculateAllTotalQuantities();
        },

        _OnOpening: function (sender, e) {
            var that = this;

            afw.EntityWindowBase.fn._OnOpening.call(that);
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.EntityWindowBase.fn._OnOpened.call(that);

            if (that._FormMode == "New") {
                if (that._ActiveFinancialYearID == null) {
                    afw.ErrorDialog.Show("سال مالی فعال تعیین نشده است.");
                    that.Close();
                    return;
                }

                var activeOrgUnitID = cmn.GetUserActiveOrganizationUnitIDs();
                if (activeOrgUnitID.length != 1) {
                    afw.ErrorDialog.Show("واحد سازمانی فعال انتخاب نشده است.");
                    that.Close();
                    return;
                }

                that._BindableEntity.set("OrganizationUnit", activeOrgUnitID[0]);
            }

            setTimeout(function () {
                that._MainStuffLookupControl.Focus();
            }, 600);
        },

        _OnClosed: function () {
            var that = this;

            afw.EntityWindowBase.fn._OnClosed.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);

            var mainStuff_StuffDef = that._GetMainStuff_StuffDef();
            if (mainStuff_StuffDef != null) {
                if (mainStuff_StuffDef.GetFieldValue("BatchNumberIsRequiered"))
                    that._MainStuffBatchNumberFieldControl.SetVisible(true);
                else
                    that._MainStuffBatchNumberFieldControl.SetVisible(false);
            }
            else {
                that._MainStuffBatchNumberFieldControl.SetVisible(false);
            }
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            if (that._MainStuffBatchNumberFieldControl.GetVisible() == true && ValueIsEmpty(that._MainStuffBatchNumberFieldControl.GetValue())) {
                afw.ErrorDialog.Show("شماره بچ وارد نشده است.");
                return false;
            }

            if (!that._ComponentsGridControl.ValidateRows())
                return false;

            return true;
        },

        GetFormMode: function () {
            var that = this;

            return that._FormMode;
        }, 

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            if (saved) {
                for (var i = 0; i < that.ComponentsEntityList.Entities.length; i++)
                    that.ComponentsEntityList.Entities[i].ChangeStatus = "None";
            }

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.MontageOrDemontageEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    wm.MontageOrDemontageEditForm = FormClass;
})();
