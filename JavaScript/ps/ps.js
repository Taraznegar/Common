(function () {
    window.ps = {
        Init: function () {
            var that = this;

            that._TaxAndTollPercents = null;
            that._CurrentTaxAndTollPercentEntity = null;
            that._InvoicePrintFormatsEntityList = null;
            that._ConfigEntity = null;
            that._SalesAndBuyInvoiceReportForm = null;
            that._SeasonalPurchaseAndSalesReportForm = null;
            that._SalesProformaInvoicesListControl = null;

        },

        GetTaxAndTollPercents: function () {
            var that = this;

            if (that._TaxAndTollPercents == null)
                that._TaxAndTollPercents = afw.uiApi.FetchEntityList("ps.TaxAndTollPercent").Entities;
            return that._TaxAndTollPercents;
        },

        GetCurrentTaxAndTollPercentEntity: function () {
            var that = this;

            if (that._CurrentTaxAndTollPercentEntity == null) {
                var nowDate = afw.DateTimeHelper.GetServerDateTime().split(" ")[0];
                var taxAndTollPercents = that.GetTaxAndTollPercents();
                var foundItems = $.grep(taxAndTollPercents, function (o) {
                    return o.GetFieldValue("FromDate").split(" ")[0] <= nowDate &&
                        o.GetFieldValue("ToDate").split(" ")[0] >= nowDate;
                });

                if (foundItems.length != 0)
                    that._CurrentTaxAndTollPercentEntity = foundItems[0];
            }

            return that._CurrentTaxAndTollPercentEntity;
        },

        ShowConfigEditForm: function () {
            var that = this;

            var newConfigEntity = null;
            var formMode = null;
            var configEntity = null;

            configEntity = afw.uiApi.FetchEntity("ps.Config");

            if (configEntity != null)
                formMode = "Edit";
            else {
                formMode = "New";
                configEntity = afw.uiApi.CreateNewEntity("ps.Config");
            }

            var configEditForm = afw.uiApi.OpenSavedFormWindow("ps.ConfigEditForm", {
                Name: "ConfigEditForm",
                FormMode: formMode,
                Modal: true,
                Title: "تنظیمات",
                Entity: configEntity,
            });
        },

        ShowKartksNumberOfStuffReportForm: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("ps.KartksNumberOfStuffReportForm", "کارتکس تعدادی کالا");
        },

        ShowKarteksTedadiRialiKalaReportForm: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("ps.KarteksTedadiRialiKalaReportForm", "کارتکس تعدادی ریالی کالا");
        },

        ShowSalesAndBuyInvoiceReportForm: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("ps.SalesAndBuyInvoiceReportForm", " گزارش فاکتور خرید و فروش");
        },


        ShowSeasonalPurchaseAndSalesReportForm: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("ps.SeasonalPurchaseAndSalesReportForm", " گزارش فصلی خرید و فروش");
        },

        GetInvoicePrintFormatsEntityList: function () {
            var that = this;

            if (that._InvoicePrintFormatsEntityList == null)
                that._InvoicePrintFormatsEntityList = afw.uiApi.FetchEntityList("ps.InvoicePrintFormat");
            return that._InvoicePrintFormatsEntityList;
        },

        GetConfigValue: function (configName) {
            var that = this;

            if (that._ConfigEntity == null) {
                that._ConfigEntity = afw.uiApi.FetchEntity("ps.Config");
                if (that._ConfigEntity == null)
                    throw "تنظیمات خرید فروش وجود ندارد";
            }

            return that._ConfigEntity.GetFieldValue(configName);
        },

        ShowGardesheKalahayeMoshtariForm: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("ps.GardesheKalahayeMoshtariForm", "گزارش گردش کالاهای مشتری");
        },

        OpenSalesProformaInvoicesForm: function (customerID) {
            var that = this;

            if (that._SalesProformaInvoicesListControl != null
                    && !that._SalesProformaInvoicesListControl.IsDestroying
                    && !ValueIsEmpty(customerID))
                that._SalesProformaInvoicesListControl.SetCustomerFilter(customerID);

            that._SalesProformaInvoicesListControl = afw.DataListHelper.DisplayDataListInAppContainer("ps.SalesProformaInvoices", "پیش فاکتورها",
                { CustomerID: customerID, Mode: "SalesProformaInvoice" });
        },

        OpenSalesInvoicesForm: function () {
            afw.DataListHelper.DisplayDataListInAppContainer("ps.SalesInvoices", "فاکتورهای فروش و خدمات", { Mode: "SalesInvoice" });
        },
        
        OpenReturnFromSalesForm: function () {
            afw.DataListHelper.DisplayDataListInAppContainer("ps.ReturnFromSaleList", "برگشت از فروش", { Mode: "ReturnFromSales" });
        },

        OpenAmaniSalesProformaInvoicesForm: function () {
            afw.DataListHelper.DisplayDataListInAppContainer("ps.SalesProformaInvoices", "پیش فاکتور امانت کالا به دیگران", { Mode: "AmaniSalesProformaInvoice" });
        },

        OpenAmaniSalesInvoicesForm: function () {
            afw.DataListHelper.DisplayDataListInAppContainer("ps.SalesInvoices", "فاکتور های امانت کالا به دیگران", { Mode: "AmaniSalesInvoice" });
        },

        OpenAmaniReturnFromSalesForm: function () {
            afw.DataListHelper.DisplayDataListInAppContainer("ps.ReturnFromSaleList", "برگشت کالای امانی ما نزد دیگران", { Mode: "AmaniReturnFromSales" });
        },

        ShowMegaModavemSalesDashBoardForm: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("ps.MegaModavemSalesDashBoardForm", "داشبرد فروش مگامداوم");
        },

        GetSaleInvoiceDynamicFieldsHeaderTextColumns: function (proformaEntity) {
            var that = this;

            var headerTextColumn1 = "";
            var headerTextColumn2 = "";

            var dynamicTextFieldEntities = afw.DataListHelper.FetchEntityListOfDataList("cmn.CustomTextFieldInfoList", null, null,
                "EntityFullName = 'ps.SalesInvoice'", "FieldNumber", null, null).Entities;

            if (dynamicTextFieldEntities.length < 1) {
                return {
                    HeaderTextColumn1: headerTextColumn1,
                    HeaderTextColumn2: headerTextColumn2
                };
            }
            else {
                for (var i = 0; i < dynamicTextFieldEntities.length; i++) {
                    //تنظیمات بر اساس هدر های گزارش PersonalizationInvoiceReport
                    if(i< 3)
                        headerTextColumn1 += String.Format("{0}: {1}\n", dynamicTextFieldEntities[i].GetFieldValue("Title"), ValueIsEmpty(proformaEntity.GetFieldValue("DynamicField" + (i + 1))) ? "" : proformaEntity.GetFieldValue("DynamicField" + (i + 1)));
                    else if (i % 2 == 1)
                        headerTextColumn1 += String.Format("{0}: {1}\n", dynamicTextFieldEntities[i].GetFieldValue("Title"), ValueIsEmpty(proformaEntity.GetFieldValue("DynamicField" + (i + 1))) ? "" : proformaEntity.GetFieldValue("DynamicField" + (i + 1)));
                    else
                        headerTextColumn2 += String.Format("{0}: {1}\n", dynamicTextFieldEntities[i].GetFieldValue("Title"), ValueIsEmpty(proformaEntity.GetFieldValue("DynamicField" + (i + 1))) ? "" : proformaEntity.GetFieldValue("DynamicField" + (i + 1)));
                }

                return {
                    HeaderTextColumn1: headerTextColumn1,
                    HeaderTextColumn2: headerTextColumn2
                };
            }

        }
    }
})();