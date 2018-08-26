(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return acc.CostAndBenefitReportForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._MainDockPanel = that.FindControl("MainDockPanel");

            that._DateCheckBox = that.FindControl("DateCheckBox");
            that._DocCheckBox = that.FindControl("DocCheckBox");
          
            that._FromDateTimeControl = that.FindControl("FromDateTimeControl");
            that._ToDateTimeControl = that.FindControl("ToDateTimeControl");
 
            that._PrintButton = that.FindControl("PrintButton"); 
            that._RefreshButton = that.FindControl("RefreshButton");
  
            that._PrintButton.bind("Click", function (e) { that._PrintButton_Click(e); }); 
            that._RefreshButton.bind("Click", function (e) { that._RefreshButton_Click(e); });

            var financialYearEntity = cmn.GetUserActiveFinancialYearEntity();;
            if (financialYearEntity != null) {
                that._FinancialYearID = financialYearEntity.GetFieldValue("ID");
                var startDate = financialYearEntity.GetFieldValue("StartDate");
                var endDate = financialYearEntity.GetFieldValue("EndDate");

                that._FromDateTimeControl.SetValue(startDate);
                that._ToDateTimeControl.SetValue(endDate);
            }
            else {
                afw.MessageDialog.Show("سال مالی فعال تعیین نشده است.");
                return;
            }
              
            that._CostAndBenefitGridView = new afw.GridView({
                ParentControl: that._MainDockPanel.Panes[2],
                Name: that.GetName() + "_EntitiesGridView",
                FillParent: true,
                Columns: [
                    {
                        title: "کد حساب",
                        field: "AccountCode",
                        rightToLeft: true,
                        width: 90
                    },
                    {
                        title: "حساب",
                        field: "AccountName",
                        rightToLeft: true,
                        width: 300
                    }, 
                    {
                        title: "مانده بدهکار",
                        field: "RemainingDebtorAmount",
                        rightToLeft: true,
                        width: 90,
                        valuesDisplayMethod: "number"
                    },
                    {
                        title: "مانده بستانکار",
                        field: "RemainingCreditorAmount",
                        rightToLeft: true,
                        width: 90,
                        valuesDisplayMethod: "number"
                    }
                ],

                SelectionMode: "SingleRow"
            });

            that._CostAndBenefitGridView.bind("SelectedRowsChanged", function (e) { that._CostAndBenefitGridView_SelectedRowsChanged(e); });
            that._CostAndBenefitGridView.bind("RowDoubleClick", function (e) { that._CostAndBenefitGridView_RowDoubleClick(e); });

            that._LoadData(); 
        },

        _CostAndBenefitGridView_SelectedRowsChanged: function (e) {
            var that = this;

        },
         
        _CostAndBenefitGridView_RowDoubleClick: function (e) {
            var that = this;
 
        },
         
        _PrintButton_Click: function (e) {
            var that = this;

            afw.uiApi.ShowProgress(that);
            afw.ReportHelper.RunReport("acc.CostAndBenefitReport",
                ["FromDate", "ToDate", "FinancialYear"],
                [that._FromDateTimeControl.GetValue(), that._ToDateTimeControl.GetValue(), that._FinancialYearID],
                null,
                function (result) {
                    afw.uiApi.HideProgress(that);
                    //if (!result.HasError)
                    //afw.ErrorDialog.Show("انجام شد.");
                });

        },
         
        _RefreshButton_Click: function (e) {
            var that = this;

            that._LoadData(); 
        },
  
        _LoadData: function () {
            var that = this; 
     
            var reportDataEntityList = afw.uiApi.CallServerMethodSync("acc.GetCostAndBenefitReportData",
                [that._FinancialYearID, that._FromDateTimeControl.GetValue(), that._ToDateTimeControl.GetValue()]);

            that._CostAndBenefitGridView.GetDataSource().data(reportDataEntityList.ToDataSourceData());
        },
       
        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.CostAndBenefitReportForm";
    FormClass.BaseType = afw.BasePanel;


    acc.CostAndBenefitReportForm = FormClass;
})();