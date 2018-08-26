(function () {
    var FormClass = afw.Window.extend({
        GetType: function () {
            return ps.SaleInvoiceVosolMotalebatEditForm;
        },

        init: function (options) {
            var that = this;

            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (formObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

           
            if ("Tarikh7RozBad" in options) {
                that._Tarikh7RozBad = options.Tarikh7RozBad;
            }

            if ("ProformaID" in options) {
                that._InvoiceID = options.ProformaID;
            }

            if ("DateToday" in options) {
                that._DateToday = options.DateToday;
            }
            that._GridPanel = that.FindControl("GridPanel");
           
            
            that.CreateGridView();

            that._VosolMotalebat = afw.uiApi.CallServerMethodSync("ps.GetVosolMotalebat", [that._InvoiceID, that._DateToday, that._Tarikh7RozBad]);

            that._FillGrid();
        },

        CreateGridView: function () {
            var that = this;

            that._VosolMotalebatGridView = new afw.GridView({
                ParentControl: that._GridPanel,
                Name: that.GetName() + "_EntitiesGridView",
                FillParent: true,
                Columns: [
                        {
                            title: "شرح",
                            field: "Des",
                            rightToLeft: true,
                            width: 200
                        },
                        {
                            title: "مبلغ سررسید شده",
                            field: "PriceSarresid",
                            rightToLeft: true,
                            whidth: 100
                        },
                         {
                             title: "تعداد سررسید شده",
                             field: "UnitSar",
                             rightToLeft: true,
                             whidth: 100
                         },
                        {
                            title: "مبلغ سررسید نشده",
                            field: "UnitUnSar",
                            rightToLeft: true,
                            whidth: 100
                        },
                        {
                            title: "تعداد سررسید نشده",
                            field: "PriceUnSar",
                            rightToLeft: true,
                            whidth: 100
                        },
                        {
                            title: "مبلغ کل",
                            field: "PriceKol",
                            rightToLeft: true,
                            whidth: 100
                        }
                ],
                SelectionMode: "SingleRow"
            });
        },

        _FillGrid: function () {
            var that = this;

            that._VosolMotalebatGridView.GetDataSource().data(that._VosolMotalebat.ToDataSourceData());
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "ps.SaleInvoiceVosolMotalebatEditForm";
    FormClass.BaseType = afw.Window;


    ps.SaleInvoiceVosolMotalebatEditForm = FormClass;
})();