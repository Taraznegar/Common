(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return acc.AccDocsCheckingForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._PrintButton = that.FindControl("PrintButton");            
            that._PrintButton.bind("Click", function (e) { that._PrintButton_Click(e); });
            that._DocListPanel = that.FindControl("DocListPanel");
            that._UserActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._AccDocListControl = afw.uiApi.CreateDataListControl("acc.AccDocs",
                {
                    Mode : "DocsChecking",
                    ParentControl: that._DocListPanel,
                    FillParent: true
                });

            that._AccDocTypeComboBox = that.FindControl("AccDocTypeComboBox");
            that._FillAccDocTypeComboBox();
            that._AccDocTypeComboBox.bind("ValueChanged", function (e) { that._AccDocTypeComboBox_ValueChanged(e); });           
        },

        _SetDataListFilter: function () {
            var that = this;

            var filterExperssion = that._AccDocListControl.GetBaseFilterExpression();

            if (!ValueIsEmpty(that._GetFilterExperssion())) {
                if (!ValueIsEmpty(filterExperssion))
                    filterExperssion += " and ";

                filterExperssion += that._GetFilterExperssion();
            }
            
            that._AccDocListControl.SetBaseFilterExpression(filterExperssion);
            that._AccDocListControl.LoadData();
        },

        _GetFilterExperssion: function () {
            var that = this;

            var docType = that._AccDocTypeComboBox.GetValue();
            var filterExperssion = "";

            if (docType == "MandehDar") {
                var balanceStatus_Balance = afw.OptionSetHelper.GetOptionSetItemID("acc.BalanceStatus.Balance");
                filterExperssion = String.Format(" BalanceStatus <> '{0}'", balanceStatus_Balance);
            }
            else if (docType == "NotChecked") {
                var docStatus_NotChecked = afw.OptionSetHelper.GetOptionSetItemID("acc.DocStatus.NotChecked");
                filterExperssion = String.Format(" DocStatus = '{0}'", docStatus_NotChecked);
            }
            else if (docType == "WithInnactiveArticle")
                filterExperssion = String.Format(" exists (select 1 from acc_AccDocItems where AccDoc = InnerQuery.ID and IsActive = 0)");

            return filterExperssion;
        },

        _AccDocTypeComboBox_ValueChanged: function (e) {
            var that = this;

            accDocTypeValue = that._AccDocTypeComboBox.GetValue();
            
            if(!ValueIsIn(accDocTypeValue,["MandehDar","NotChecked","WithInnactiveArticle","All"]))
                that._AccDocTypeComboBox.SetValue("All");

            that._SetDataListFilter();
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        },

        _PrintButton_Click: function (e) {
            var that = this;

            afw.uiApi.ShowProgress(that);
            var filterExpression = that._GetFilterExperssion();
            afw.ReportHelper.RunReport("acc.AccDocsCheckingReport",
                ["FilterExpression", "AccDocTypeText"],
                [filterExpression, that._AccDocTypeComboBox.GetText()],
                null,
                function (result) {
                    afw.uiApi.HideProgress(that);
                });
        },

        _FillAccDocTypeComboBox: function () {
            var that = this;

            var filterGateComboBoxItems = [
                { Key: "All", Title: "همه اسناد" },
                { Key: "MandehDar", Title: "سند های دارای مانده" },
                { Key: "NotChecked", Title: "سند های تنظیم نشده" },
                { Key: "WithInnactiveArticle", Title: "سند های دارای آرتیکل غیر فعال" }];

            that._AccDocTypeComboBox.SetItemsDataSource(filterGateComboBoxItems);
            that._AccDocTypeComboBox.SetValue("All");
        }
    });

    
    //Static Members:

    FormClass.TypeName = "acc.AccDocsCheckingForm";
    FormClass.BaseType = afw.BasePanel;


    acc.AccDocsCheckingForm = FormClass;
})();





