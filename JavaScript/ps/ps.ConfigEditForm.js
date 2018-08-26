(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return ps.ConfigEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that.Center();

            that._ConfigTabControl = that.FindControl("ConfigTabControl");
            that._ConfigTabControl.SelectTabByIndex(0);

            that._IsActiveBarCodeFieldControl = that.FindControl("IsActiveBarCodeFieldControl").FindControl("InnerControl");
            that._BuyStuffRepeatFieldControl = that.FindControl("BuyStuffRepeatFieldControl").FindControl("InnerControl");
            that._SaleStuffRepeatFieldControl = that.FindControl("SaleStuffRepeatFieldControl").FindControl("InnerControl");
            that._VaziateKalayeGhabeleForoshDropDownList = that.FindControl("VaziateKalayeGhabeleForoshDropDownList");

            var stuffStatusEntityList = afw.DataListHelper.FetchEntityListOfDataList("wm.StuffStatusList", null, null, null);
            that._VaziateKalayeGhabeleForoshDropDownList.SetItemsDataSource(stuffStatusEntityList.ToDataSourceData());

            that._IsActiveBarCodeFieldControl.bind("CheckedChanged", function (e) { that._IsActiveBarCodeFieldControl_CheckedChanged(e); });
            that._BuyStuffRepeatFieldControl.bind("CheckedChanged", function (e) { that._BuyStuffRepeatFieldControl_CheckedChanged(e); });
            that._SaleStuffRepeatFieldControl.bind("CheckedChanged", function (e) { that._SaleStuffRepeatFieldControl_CheckedChanged(e); });

            var customFieldsDataListPanel = that.FindControl("CustomFieldsDataListPanel");

            that._CustomTextFieldInfoList = new afw.uiApi.CreateDataListControl("cmn.CustomTextFieldInfoList", {
                ParentControl: customFieldsDataListPanel,
                BaseFilterExpression:"EntityFullName = 'ps.SalesInvoice'",
                EntityFullName: "ps.SalesInvoice",
                FillParent: true
            });

        },

        _IsActiveBarCodeFieldControl_CheckedChanged: function (e) {
            var that = this;
             
            if (that._IsActiveBarCodeFieldControl.GetValue() == true) {
                that._BuyStuffRepeatFieldControl.SetValue(!that._IsActiveBarCodeFieldControl.GetValue());
                that._SaleStuffRepeatFieldControl.SetValue(!that._IsActiveBarCodeFieldControl.GetValue());
            }
        },

        _BuyStuffRepeatFieldControl_CheckedChanged: function (e) {
            var that = this;

            if (that._BuyStuffRepeatFieldControl.GetValue() == true) {
                that._IsActiveBarCodeFieldControl.SetValue(!that._BuyStuffRepeatFieldControl.GetValue());
            }
        },

        _SaleStuffRepeatFieldControl_CheckedChanged: function (e) {
            var that = this;

            if (that._SaleStuffRepeatFieldControl.GetValue() == true) {
                that._IsActiveBarCodeFieldControl.SetValue(!that._SaleStuffRepeatFieldControl.GetValue());
            }
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

    FormClass.TypeName = "ps.ConfigEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    ps.ConfigEditForm = FormClass;
})();