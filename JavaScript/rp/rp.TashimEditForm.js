(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return rp.TashimEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);
            that._ReceiveID = options.ReceiveID;
            that._Customer = options.Customer;
            that._GridPanel = that.FindControl("GridPanel");
            that._ChequesLookupControl = that.FindControl("ChequesLookupControl");
            that._ChequesLookupControl.bind("ValueChanged", function (e) { that._ChequesLookupControl_ValueChanged(e) });
            //ReceiveReceiptID
            that._ChequesLookupControl.SetBaseFilterExpression(String.Format("ReceiveReceiptID = '{0}'", that._ReceiveID ));
        },

        _ChequesLookupControl_ValueChanged: function (e) {
            var that = this;
            if (!ValueIsEmpty(that._ChequesLookupControl.GetValue())) {
                that.CreateGridView();
                that._TashimList = afw.DataListHelper.FetchEntityListOfDataList("rp.TashimList", null, null, String.Format("Customer = '{0}'", that._ChequesLookupControl.GetValue()));
                that._FillGrid();
            }
        },

        CreateGridView: function () {
            var that = this;

            that._VosolMotalebatGridView = new afw.GridView({
                ParentControl: that._GridPanel,
                Name: that.GetName() + "_EntitiesGridView",
                FillParent: true,
                Columns: [
                        {
                            title: "فاکتور",
                            field: "InvoiceNumber",
                            rightToLeft: true,
                            width: 80
                        },
                        {
                            title: "تاریخ",
                            field: "IssueDate",
                            rightToLeft: true,
                            whidth: 100
                        },
                         {
                             title: "مشتری",
                             field: "Name",
                             rightToLeft: true,
                             whidth: 100
                         },
                        {
                            title: "مبلغ فاکتور فروش",
                            field: "FinalAmount",
                            rightToLeft: true,
                            whidth: 100
                        },
                        {
                            title: "مبلغ پرداخت شده",
                            field: "KolPardakhtSales",
                            rightToLeft: true,
                            whidth: 100
                        },
                        {
                            title: "مبلغ پرداخت از این رسید",
                            field: "MablghPardakhtAzChek",
                            rightToLeft: true,
                            whidth: 100
                        },
                        {
                            title: "مانده",
                            field: "Mandeh",
                            rightToLeft: true,
                            whidth: 100
                        }
                ],
                SelectionMode: "SingleRow"
            });
        },

        _FillGrid: function () {
            var that = this;

            that._VosolMotalebatGridView.GetDataSource().data(that._TashimList.ToDataSourceData());
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            return true;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.TashimEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    rp.TashimEditForm = FormClass;
})();