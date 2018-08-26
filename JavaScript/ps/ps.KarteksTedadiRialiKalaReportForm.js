(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return ps.KarteksTedadiRialiKalaReportForm;
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
            that._ShowButton = that.FindControl("ShowButton");
            that._PrintButton = that.FindControl("PrintButton");

            that._FromStuffLookupControl.bind("ValueChanged", function (e) { that._FromStuffLookupControl_ValueChanged(e); });

            that._GridView = null;

            that._ShowButton.bind("Click", function (e) { that._ShowButton_Click(e); });
            that._PrintButton.bind("Click", function (e) { that._PrintButton_Click(e); });
            
            that._GridPanel = that.FindControl("GridPanel");
          
            that._FinancialYearEntity = afw.uiApi.FetchEntity("cmn.FinancialYear",  String.Format("ID = '{0}'", cmn.GetUserActiveFinancialYearID()));
            if (that._FinancialYearEntity != null) {
                that._FromDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("StartDate"));
                that._ToDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("EndDate"));
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

            var fromDate = afw.DateTimeHelper.GregorianToJalali(that._FromDateTimeControl.GetValue()).toString();
            var toDate = afw.DateTimeHelper.GregorianToJalali(that._ToDateTimeControl.GetValue()).toString();
            var today = afw.DateTimeHelper.GregorianToJalali(afw.DateTimeHelper.GetServerDateTime());
            var timeAndDateArray = today.split(" ", 3);
            //var itemKindName = that._ItemsKindsDropDownList.GetText().toString();
            //var itemName = that._ItemAutoComplete.GetText();
            var person = null;
            var personLookupValue = that._PersonLookupControl.GetValue();
            if (personLookupValue != null)
                person = personLookupValue;
            else
                person = "00000000-0000-0000-0000-000000000000";

            if (that._FromStuffLookupControl.GetValue() != null)
                if (that._FromDateTimeControl.GetValue() != null)
                    if (that._ToDateTimeControl.GetValue() != null) {
                        afw.uiApi.ShowProgress(that);
                        afw.ReportHelper.RunReport("ps.KarteksTedadiRialiKala",
                            ["FromDate", "ToDate", "StuffName", "Customer", "FromDateHeader", "ToDateHeader", "ReportDate", "ReportTime"],
                            [that._FromDateTimeControl.GetValue(), that._ToDateTimeControl.GetValue(), that._FromStuffLookupControl.GetValue(), person, fromDate, toDate, timeAndDateArray[0], timeAndDateArray[1]],
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

            var invoiceDate = { title: "تاریخ ", field: "InvoiceDate", rightToLeft: true, width:40 };
            var kind = { title: "نوع", field: "Kind", rightToLeft: true, width: 30 };
            var invoiceNumber = { title: "فاکتور", field: "InvoiceNumber", rightToLeft: true, width: 30 };
            var customer = { title: "مشتری", field: "Customer", rightToLeft: true, width: 50 };
            var description = { title: "شرح", field: "Note", rightToLeft: true, width: 200 };
            var enter = { title: "وارده", field: "Enter", rightToLeft: true, valuesDisplayMethod: "Number", width: 40 };
            var buyUnitPrice = { title: "فی خرید", field: "BuyUnitPrice", rightToLeft: true, valuesDisplayMethod: "Number", width: 40 };
            var buyTotolPrice = { title: "کل خرید", field: "BuyTotalPrice", rightToLeft: true, valuesDisplayMethod: "Number", width: 40 };
            var exportStuff = { title: "صادره", field: "Export", rightToLeft: true, valuesDisplayMethod: "Number", width: 40 };
            var saleUnitPrice = { title: "فی فروش", field: "SaleUnitPrice", rightToLeft: true, valuesDisplayMethod: "Number", width: 40 };
            var saleTotolPrice = { title: "کل فروش", field: "SaleTotalPrice", rightToLeft: true, valuesDisplayMethod: "Number", width: 40 };
            var remaining = { title: "مانده", field: "Remaining", rightToLeft: true, valuesDisplayMethod: "Number", width: 40 };

            var columns = [invoiceDate, kind, invoiceNumber, customer, description, enter, buyUnitPrice,buyTotolPrice, exportStuff,saleUnitPrice,saleTotolPrice, remaining];

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

            var entityList = afw.uiApi.CallServerMethodSync("ps.GetKarteksTedadiRialiData", [that._FromDateTimeControl.GetValue(), that._ToDateTimeControl.GetValue(), that._FromStuffLookupControl.GetValue(), that._PersonLookupControl.GetValue()]);
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
                var invoice = selectedEntities[0].DataItem["Invoice"];
                var kind = selectedEntities[0].DataItem["Kind"];
                var entitiy = null;
                if (kind == "خرید")
                    entitiy = afw.uiApi.FetchEntity("ps.BuyInvoice", String.Format("ID = '{0}'", invoice));
                else if (kind == "فروش")
                    entitiy = afw.uiApi.FetchEntity("ps.SalesInvoice", String.Format("ID = '{0}'", invoice));
                that._CreateSalesInvoiceEditForm(entitiy);
            }
        },

        _CreateSalesInvoiceEditForm: function (entitiy) {
            var that = this;

            if (cmn.OpenWindowExists())
                afw.EntityHelper.OpenEntityFormInWindow(entity, "ps.SalesInvoiceEditForm", "Edit");
            else
                afw.EntityHelper.OpenEntityFormInMdiContainer(entity, "ps.SalesInvoiceEditForm", "Edit");
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "ps.KarteksTedadiRialiKalaReportForm";
    FormClass.BaseType = afw.BasePanel;


    ps.KarteksTedadiRialiKalaReportForm = FormClass;
})();