(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return wm.KarteksTedadiRialiKalaForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._FromDateTimeControl = that.FindControl("FromDateTimeControl");
            that._ToDateTimeControl = that.FindControl("ToDateTimeControl");
            that._PersonLookupControl = that.FindControl("PersonLookupControl");
            that._FromStuffLookupControl = that.FindControl("FromStuffLookupControl");
            that._ToStuffLookupControl = that.FindControl("ToStuffLookupControl");
            that._StuffLocationControl = that.FindControl("StuffLocationControl1");
            that._OrganizationUnitControl = that.FindControl("OrganizationUnitControl");
            that._FinancialDocTypeControl = that.FindControl("FinancialDocTypeControl");
            that._ShowButton = that.FindControl("ShowButton");
            that._PrintButton = that.FindControl("PrintButton");

            that._FromStuffLookupControl.bind("ValueChanged", function (e) { that._FromStuffLookupControl_ValueChanged(e); });

            that._GridView = null;

            that._ShowButton.bind("Click", function (e) { that._ShowButton_Click(e); });
            that._PrintButton.bind("Click", function (e) { that._PrintButton_Click(e); });

            that._GridPanel = that.FindControl("GridPanel");

            var financialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            if (financialYearEntity != null) {
                that._FromDateTimeControl.SetValue(financialYearEntity.GetFieldValue("StartDate"));
                that._ToDateTimeControl.SetValue(financialYearEntity.GetFieldValue("EndDate"));
            }
            that._SetLookupControlsProperties();
        },

        _FromStuffLookupControl_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._FromStuffLookupControl.GetValue())) {
                var fromStuff = that._FromStuffLookupControl.GetValue();
                that._ToStuffLookupControl.SetValue(fromStuff);
            }
        },

        _SetLookupControlsProperties: function () {
            var that = this;

            that._PersonLookupControl.SetDataListFullName("cmn.Persons");
            that._FromStuffLookupControl.SetDataListFullName("cmn.StuffDefs");
            that._ToStuffLookupControl.SetDataListFullName("cmn.StuffDefs");
            that._PersonLookupControl.SetEntityCaptionFieldName("FullName");
            that._FromStuffLookupControl.SetEntityCaptionFieldName("DisplayName");
            that._ToStuffLookupControl.SetEntityCaptionFieldName("DisplayName");
            that._PersonLookupControl.SetHasEntityViewButton(false);
            that._FromStuffLookupControl.SetHasEntityViewButton(false);
            that._ToStuffLookupControl.SetHasEntityViewButton(false);
        },

        _PrintButton_Click: function (e) {
            var that = this;

            var person = that._PersonLookupControl.GetValue() == null ? "null" : "'" + that._PersonLookupControl.GetValue() + "'";
            var stuffLocation = that._StuffLocationControl.GetValue() == null ? "null" : "'" + that._StuffLocationControl.GetValue() + "'";
            var organizationUnit = that._OrganizationUnitControl.GetValue() == null ? "null" : "'" + that._OrganizationUnitControl.GetValue() + "'";
            var financialDocType = that._FinancialDocTypeControl.GetValue() == null ? "null" : "'" + that._FinancialDocTypeControl.GetValue() + "'";

            if (that._FromStuffLookupControl.GetValue() != null)
                if (that._FromDateTimeControl.GetValue() != null)
                    if (that._ToDateTimeControl.GetValue() != null) {
                        var stuffName = that._FromStuffLookupControl.GetAutoComplete().GetText();
                        var stuffID = "'" + that._FromStuffLookupControl.GetValue() + "'";

                        afw.uiApi.ShowProgress(that);
                        afw.ReportHelper.RunReport("wm.KarteksTedadiRialiKala",
                            ["FromDate", "ToDate", "StuffName", "StuffID",
                             "Person", "StuffLocation", "OrganizationUnit", "FinancialDocType"],
                            [that._FromDateTimeControl.GetValue(), that._ToDateTimeControl.GetValue(), stuffName,
                             stuffID, person, stuffLocation, organizationUnit, financialDocType],
                            null,
                            function (result) {
                                afw.uiApi.HideProgress(that);
                            });
                    }
                    else
                        afw.ErrorDialog.Show("مقدار فیلد تاریخ وارد نشده است");
                else
                    afw.ErrorDialog.Show("مقدار فیلد تاریخ وارد نشده است");
            else
                afw.ErrorDialog.Show("نام کالا را انتخاب کنید");
        },

        _ShowButton_Click: function (e) {
            var that = this;

            if (that._FromStuffLookupControl.GetValue() != null)
                if (that._FromDateTimeControl.GetValue() != null)
                    if (that._ToDateTimeControl.GetValue() != null)
                        that._CreateGridView();
                    else
                        afw.ErrorDialog.Show("مقدار فیلد تاریخ وارد نشده است");
                else
                    afw.ErrorDialog.Show("مقدار فیلد تاریخ وارد نشده است");
            else
                afw.ErrorDialog.Show("نام کالا را انتخاب کنید");
        },

        _CreateGridView: function () {
            var that = this;

            var ghabzOrHavaleDate = { title: "تاریخ ", field: "GhabzOrHavaleDate", rightToLeft: true, width: 40 };
            var kind = { title: "نوع", field: "Kind", rightToLeft: true, width: 80 };
            var ghabzOrHavaleNumber = { title: "رسید/حواله", field: "GhabzOrHavaleNumber", rightToLeft: true, width: 30 };
            var customer = { title: "مشتری", field: "Customer", rightToLeft: true, width: 50 };
            var enter = { title: "وارده", field: "Enter", rightToLeft: true, valuesDisplayMethod: "Number", width: 40 };
            var ghabzUnitPrice = { title: "فی قبض", field: "GhabzUnitPrice", rightToLeft: true, valuesDisplayMethod: "Number", width: 70 };
            var ghabzTotalPrice = { title: "کل قبض", field: "GhabzTotalPrice", rightToLeft: true, valuesDisplayMethod: "Number", width: 70 };
            var exportStuff = { title: "صادره", field: "Export", rightToLeft: true, valuesDisplayMethod: "Number", width: 40 };
            var havaleUnitPrice = { title: "فی حواله", field: "HavaleUnitPrice", rightToLeft: true, valuesDisplayMethod: "Number", width: 70 };
            var havaleTotalPrice = { title: "کل حواله", field: "HavaleTotalPrice", rightToLeft: true, valuesDisplayMethod: "Number", width: 70 };
            var remaining = { title: "مانده", field: "Remaining", rightToLeft: true, valuesDisplayMethod: "Number", width: 40 };
            var rialiTotalPrice = { title: "مانده ریالی", field: "RialiTotalPrice", rightToLeft: true, valuesDisplayMethod: "Number", width: 70 };
            var rialiUnitPrice = { title: "فی ریالی", field: "RialiUnitPrice", rightToLeft: true, valuesDisplayMethod: "Number", width: 70 };

            var columns = [ghabzOrHavaleDate, kind, ghabzOrHavaleNumber, customer, enter, ghabzUnitPrice, ghabzTotalPrice,
                exportStuff, havaleUnitPrice, havaleTotalPrice, remaining, rialiTotalPrice, rialiUnitPrice];

            var gridView = that._GridPanel.FindControl("GridView");
            if (gridView != null)
                gridView.Destroy();

            that._GridView = new afw.GridView({
                ParentControl: that._GridPanel,
                Name: "GridView",
                FillParent: true,
                Columns: columns,
                SelectionMode: "SingleRow"
            });

            that._GridView.SetSortable(false);

            var entityList = afw.uiApi.CallServerMethodSync("wm.GetKarteksTedadiRialiData",
                [that._FromDateTimeControl.GetValue(), that._ToDateTimeControl.GetValue(),
                 that._FromStuffLookupControl.GetValue(), that._PersonLookupControl.GetValue(),
                 that._StuffLocationControl.GetValue(), that._OrganizationUnitControl.GetValue(),
                 that._FinancialDocTypeControl.GetValue()]);

            that._GridView.GetDataSource().data(entityList.ToDataSourceData());
            //that._GridView.bind("SelectedRowsChanged", function (e) { that._GridView_SelectedRowsChanged(e); });
            that._GridView.bind("RowDoubleClick", function (e) { that._GridView_RowDoubleClick(e); });
        },

        _GridView_RowDoubleClick: function (e) {
            var that = this;


            var selectedEntities = that._GridView.GetSelectedRows();
            if (selectedEntities == 0) {
                return;
            }
            else {
                var ghabzOrHavaleID = selectedEntities[0].DataItem["GhabzOrHavale"];
                var entitiy = afw.uiApi.FetchEntity("wm.GhabzOrHavale", String.Format("ID = '{0}'", ghabzOrHavaleID));
                that._CreateGhabzOrHavaleEditForm(entitiy, selectedEntities[0].DataItem["WarehouseDocType"]);
            }
        },

        _CreateGhabzOrHavaleEditForm: function (entitiy, warehouseDocTypeName) {
            var that = this;

            var newGhabzOrHavaleForm = afw.uiApi.OpenSavedFormWindow("wm.GhabzOrHavaleEditForm", {
                Name: "GhabzOrHavaleEditForm",
                Modal: true,
                FormMode: "Edit",
                Entity: entitiy,
                WarehouseDocTypeName: warehouseDocTypeName
            });
            newGhabzOrHavaleForm.bind("Opened",
                 function (e) {
                     e.Sender.Center();
                 });
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.KarteksTedadiRialiKalaForm";
    FormClass.BaseType = afw.BasePanel;


    wm.KarteksTedadiRialiKalaForm = FormClass;
})();