﻿(function () {
    var objectEvents = afw.Window.Events.concat([]);

    var FormClass = afw.Window.extend({
        events: objectEvents,

        GetType: function () {
            return acc.DocCopyAdditionalInfoForm;
        },

        init: function (options) {
            var that = this;

            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (formObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            that._DocStatus_CheckedID = afw.OptionSetHelper.GetOptionSetItemID("acc.DocStatus.Checked");

            that._SourceAccDocDataItem = options.RefAccDocDataItem;

            that._DestinationAccDocEntity = afw.uiApi.CreateNewEntity("acc.AccDoc");

            that._FinancialYearLookupControl = that.FindControl("FinancialYearLookupControl");
            that._IssueDateControl = that.FindControl("IssueDateControl");
            var docKindLookupControl = that.FindControl("DocKindLookupControl");
            var docStatusOptionSetControl = that.FindControl("DocStatusOptionSetControl");
            that._OrganizationUnitComboBox = that.FindControl("OrganizationUnitComboBox");
            that._FinancialDocTypeOptionSetControl = that.FindControl("FinancialDocTypeOptionSetControl");
            that._CreateCopyButton = that.FindControl("CreateCopyButton");

            var organizationUnitDataSource = cmn.GetUserOrganizationUnitsDataSourceData();
            that._OrganizationUnitComboBox.SetItemsDataSource(organizationUnitDataSource);

            that._FinancialYearLookupControl.SetValue(that._SourceAccDocDataItem["FinancialYear"]);
            that._IssueDateControl.SetValue(afw.DateTimeHelper.GetServerDateTime());
            docKindLookupControl.SetValue(that._SourceAccDocDataItem["DocKind"]);
            docStatusOptionSetControl.SetValue(that._DocStatus_CheckedID);
            that._OrganizationUnitComboBox.SetValue(that._SourceAccDocDataItem["OrganizationUnit"]);
            that._FinancialDocTypeOptionSetControl.SetValue(that._SourceAccDocDataItem["FinancialDocType"]);

            that._CreateCopyButton.BindEvent("Click", function (e) { that._CreateCopyButton_Click(e); });
        },

        _CreateCopyButton_Click: function (e) {
            var that = this;

            that._DestinationAccDocEntity.SetFieldValue("DocStatus", that._DocStatus_CheckedID);
            that._DestinationAccDocEntity.SetFieldValue("IsTransferred", false);
            that._DestinationAccDocEntity.SetFieldValue("TransferDatabase", null);
            that._DestinationAccDocEntity.SetFieldValue("IsAutoGenerated", false);
            that._DestinationAccDocEntity.SetFieldValue("IsActive", true);

            if (ValueIsEmpty(that._IssueDateControl.GetValue())) {
                that._IssueDateControl.Focus();
                return;
            }
            else {
                that._DestinationAccDocEntity.SetFieldValue("IssueDate", that._IssueDateControl.GetValue());

                var financialYearEntity = afw.uiApi.FetchEntity("cmn.FinancialYear", String.Format("ID = '{0}'", that._FinancialYearLookupControl.GetValue()));

                var startDate = afw.DateTimeHelper.ToTenCharactersDateFormat(financialYearEntity.GetFieldValue("StartDate"));
                var endDate = afw.DateTimeHelper.ToTenCharactersDateFormat(financialYearEntity.GetFieldValue("EndDate"));
                var issueDate = afw.DateTimeHelper.ToTenCharactersDateFormat(that._IssueDateControl.GetValue());

                if (issueDate < startDate || issueDate > endDate) {
                    afw.MessageDialog.Show("تاریخ صدور سند خارج از محدوده سال مالی است.");
                    return;
                }
            }

            if (ValueIsEmpty(that._FinancialDocTypeOptionSetControl.GetValue())) {
                that._FinancialDocTypeOptionSetControl.Focus();
                return;
            }
            else
                that._DestinationAccDocEntity.SetFieldValue("FinancialDocType", that._FinancialDocTypeOptionSetControl.GetValue());

            if (ValueIsEmpty(that._OrganizationUnitComboBox.GetValue())) {
                that._OrganizationUnitComboBox.Focus();
                return;
            }
            else
                that._DestinationAccDocEntity.SetFieldValue("OrganizationUnit", that._OrganizationUnitComboBox.GetValue());

            try {
                var financialGroupEntity = cmn.GetFinancialGroupEntity(
                    that._OrganizationUnitComboBox.GetValue(),
                    that._FinancialYearLookupControl.GetValue(),
                    that._FinancialDocTypeOptionSetControl.GetValue());

                if (financialGroupEntity != null)
                    that._DestinationAccDocEntity.SetFieldValue("FinancialGroup", financialGroupEntity.GetFieldValue("ID"));
                else
                    that._DestinationAccDocEntity.SetFieldValue("FinancialGroup", null);
            }
            catch (ex) {
                afw.ErrorDialog.Show(ex);
            }

            var ignoredFieldNames = ["FinancialGroup", "OrganizationUnit", "FinancialDocType", "IssueDate"
                , "DocStatus", "IsAutoGenerated", "IsActive", "IsTransferred", "TransferDatabase"];

            afw.uiApi.ShowProgress(that);
            afw.uiApi.CallServerMethodAsync("acc.CopyAccDoc", [that._SourceAccDocDataItem["ID"], that._DestinationAccDocEntity, ignoredFieldNames],
            function (result) {
                if (that._IsDestroying)
                    return;

                afw.uiApi.HideProgress(that);
                if (result.HasError)
                    afw.ErrorDialog.Show(result.ErrorMessage);
                else {
                    if (cmn.OpenWindowExists())
                        afw.EntityHelper.OpenEntityFormInWindow(result.Value, "acc.AccDocEditForm", "Edit", {
                            Title: "سند حسابداری"
                        });
                    else
                        afw.EntityHelper.OpenEntityFormInMdiContainer(result.Value, "acc.AccDocEditForm", "Edit", {                            
                            Title: "سند حسابداری"
                        });

                    that.Close();
                }
            });

        },

        _OnOpening: function () {
            var that = this;

            afw.Window.fn._OnOpening.call(that);
        },

        _OnOpened: function () {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                e.Handled = true;
                that._CreateCopyButton_Click(e);
            }
            else
                afw.Window.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.Window.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.DocCopyAdditionalInfoForm";
    FormClass.BaseType = afw.Window;
    FormClass.Events = objectEvents;

    acc.DocCopyAdditionalInfoForm = FormClass;
})();