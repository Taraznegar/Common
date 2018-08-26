(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return ps.InvoiceConversionPopupForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._ProformaEntity = options.ProformaEntity;
            var isAmaniMode = options.IsAmaniMode;

            that._InvoiceNumberTextBox = that.FindControl("InvoiceNumberTextBox");

            var financialYearID = that._ProformaEntity.GetFieldValue("FinancialYear");
            var financialGroupID = that._ProformaEntity.GetFieldValue("FinancialGroup");
            var organizationUnit = that._ProformaEntity.GetFieldValue("OrganizationUnit");
            var financialDocTypeID = that._ProformaEntity.GetFieldValue("FinancialDocType");
            var isAmani = that._ProformaEntity.GetFieldValue("IsAmani");

            if (!isAmaniMode)
                that.FindControl("RequestNumberTextBox").SetReadOnly(true);

            var invoiceNumber = afw.uiApi.CallServerMethodSync("ps.GetSalesInvoiceDefaultNumber",
                [organizationUnit, financialYearID, financialGroupID, financialDocTypeID, isAmani]);
            that._InvoiceNumberTextBox.SetValue(invoiceNumber);

        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "ps.InvoiceConversionPopupForm";
    FormClass.BaseType = afw.BasePanel;


    ps.InvoiceConversionPopupForm = FormClass;
})();