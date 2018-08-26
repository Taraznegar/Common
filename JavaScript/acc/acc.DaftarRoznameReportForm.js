(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return acc.DaftarRoznameReportForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._MainDockPanel = that.FindControl("MainDockPanel");

            that._DateCheckBox = that.FindControl("DateCheckBox");
            that._DocNoCheckBox = that.FindControl("DocNoCheckBox");
            
            that._FromDateTimeControl = that.FindControl("FromDateTimeControl");
            that._ToDateTimeControl = that.FindControl("ToDateTimeControl");
            that._GridPanel = that.FindControl("GridPanel");
            
            that._FromDocNoTextBox = that.FindControl("FromDocNoTextBox");
            that._ToDocNoTextBox = that.FindControl("ToDocNoTextBox");

            that._PrintButton = that.FindControl("PrintButton");
            that._ApplyFilterButton = that.FindControl("ApplyFilterButton");
            that._DocEnterButton = that.FindControl("DocEnterButton");

            that._DateCheckBox.bind("CheckedChanged", function (e) { that._DateCheckBox_CheckedChanged(e); });
            that._DocNoCheckBox.bind("CheckedChanged", function (e) { that._DocNoCheckBox_CheckedChanged(e); });
            that._DateCheckBox.SetValue(true);

            that._PrintButton.bind("Click", function (e) { that._PrintButton_Click(e); });
            that._ApplyFilterButton.bind("Click", function (e) { that._ApplyFilterButton_Click(e); });
            that._DocEnterButton.bind("Click", function (e) { that._DocEnterButton_Click(e); });

            var financialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            if (financialYearEntity != null) {
                that._FinancialYearID = financialYearEntity.GetFieldValue("ID");
                that._StartDate = financialYearEntity.GetFieldValue("StartDate");
                that._EndDate = financialYearEntity.GetFieldValue("EndDate");

                that._FromDateTimeControl.SetValue(that._StartDate);
                that._ToDateTimeControl.SetValue(that._EndDate);
            }
            else {
                afw.MessageDialog.Show("در سیستم سال مالی فعالی وجود ندارد."); 
            }
        },
        
        _CreateDaftarRooznamehDataList: function () {
            var that = this;

            var accountReview = that._GridPanel.FindControl("DafatarRooznamehDataList");
            if (accountReview != null)
                accountReview.Destroy();

            that._DafatrRooznameDataListControl = afw.uiApi.CreateDataListControl("acc.DafatarRooznamehDataList", {
                Name: 'DafatarRooznamehDataList',
                ParentControl: that._GridPanel,
                FillParent: true,
                BaseFilterExpression: that._GetFilterExpression()
            });

            that._DaftarRoznameGridView = that._DafatrRooznameDataListControl.GetEntitiesGridView();
            that._DaftarRoznameGridView.bind("SelectedRowsChanged", function (e) { that._DaftarRoznameGridView_SelectedRowsChanged(e); });
            that._DaftarRoznameGridView.bind("RowDoubleClick", function (e) { that._DaftarRoznameGridView_RowDoubleClick(e); });
        },

        _GetFilterExpression: function(){
            var that = this;

            var filterExpression = String.Format("FinancialYear ='{0}' ", that._FinancialYearID);

            if (that._DateCheckBox.GetValue() == true) {
                filterExpression += String.Format("and IssueDate between isnull({0}, IssueDate) and isnull({1}, IssueDate) ",
                    ValueIsEmpty(that._FromDateTimeControl.GetValue()) ? "null" : "'" + that._FromDateTimeControl.GetValue() + "'",
                    ValueIsEmpty(that._ToDateTimeControl.GetValue()) ? "null" : "'" + that._ToDateTimeControl.GetValue() + "'")
            }
            if (that._DocNoCheckBox.GetValue() == true) {
                filterExpression += String.Format("and DocReferenceNo between isnull({0}, DocReferenceNo) and isnull({1}, DocReferenceNo) ",
                    ValueIsEmpty(that._FromDocNoTextBox.GetValue()) ? "null" : "'" + that._FromDocNoTextBox.GetValue() + "'",
                    ValueIsEmpty(that._ToDocNoTextBox.GetValue()) ? "null" : "'" + that._ToDocNoTextBox.GetValue() + "'")
            }

            return filterExpression;
        },

        _DaftarRoznameGridView_SelectedRowsChanged: function (e) {
            var that = this;
        },

        _DaftarRoznameGridView_RowDoubleClick: function (e) {
            var that = this;

        },

        _DateCheckBox_CheckedChanged: function (sender, e) {
            var that = this;

            if (that._DateCheckBox.GetValue() == true) {
                that._DocNoCheckBox.SetValue(!that._DateCheckBox.GetValue());

                that._FromDateTimeControl.SetReadOnly(false);
                that._ToDateTimeControl.SetReadOnly(false);
                that._FromDateTimeControl.SetValue(that._StartDate);
                that._ToDateTimeControl.SetValue(that._EndDate);

                that._FromDocNoTextBox.SetReadOnly(true);
                that._ToDocNoTextBox.SetReadOnly(true);
                that._FromDocNoTextBox.SetValue(null);
                that._ToDocNoTextBox.SetValue(null);
            }
        },

        _DocNoCheckBox_CheckedChanged: function (sender, e) {
            var that = this;

            if (that._DocNoCheckBox.GetValue() == true) {
                that._DateCheckBox.SetValue(!that._DocNoCheckBox.GetValue());

                that._FromDocNoTextBox.SetReadOnly(false);
                that._ToDocNoTextBox.SetReadOnly(false);

                that._FromDateTimeControl.SetReadOnly(true);
                that._ToDateTimeControl.SetReadOnly(true);
                that._FromDateTimeControl.SetValue(null);
                that._ToDateTimeControl.SetValue(null);
            }
        },

        _PrintButton_Click: function (e) {
            var that = this;

            var fromDate_Persian = afw.DateTimeHelper.GregorianToJalali(that._FromDateTimeControl.GetValue());
            var toDate_Persian = afw.DateTimeHelper.GregorianToJalali(that._ToDateTimeControl.GetValue());
            var today = afw.DateTimeHelper.GregorianToJalali(afw.DateTimeHelper.GetServerDateTime());
            var timeAndDateArray = today.split(" ", 3);

            if (that._DateCheckBox.GetValue() == true) {
                if (that._FromDateTimeControl.GetValue() != null && that._ToDateTimeControl.GetValue() != null) { 
                    afw.uiApi.ShowProgress(that);
                    afw.ReportHelper.RunReport("acc.DateBaseDaftarRoznameReport",
                        ["FinancialYear", "FromDate", "ToDate", "FromDateHeader", "ToDateHeader", "RportDate", "RepotTime"],
                        [that._FinancialYearID, that._FromDateTimeControl.GetValue(), that._ToDateTimeControl.GetValue(), fromDate_Persian, toDate_Persian, timeAndDateArray[0], timeAndDateArray[1]],
                        null,
                        function (result) {
                            afw.uiApi.HideProgress(that);
                        });
                }
                else
                    afw.MessageDialog.Show("مقادیر تاریخ را وارد نکرده اید.");
            }
            else {
                that._DocNoCheckBox.SetValue(true);

                if (that._FromDocNoTextBox.GetValue() != null && that._ToDocNoTextBox.GetValue() != null) { 
                    afw.uiApi.ShowProgress(that);
                    afw.ReportHelper.RunReport("acc.DocNoBaseDaftarRoznameReport",
                        ["FinancialYear", "FromDocNo", "ToDocNo"],
                        [that._FinancialYearID, that._FromDocNoTextBox.GetValue() + "", that._ToDocNoTextBox.GetValue() + ""],
                        null,
                        function (result) {
                            afw.uiApi.HideProgress(that);
                        });
                }
                else
                    afw.MessageDialog.Show("مقادیر شماره سند را وارد نکرده اید.");
            }
        },

        _ApplyFilterButton_Click: function (e) {
            var that = this;

            that._CreateDaftarRooznamehDataList();
        },
         
        _DocEnterButton_Click: function(e){
            var that = this;

            that.DocEnter();
        },

        DocEnter: function () {
            var that = this;
            var selectedEntities = that._DaftarRoznameGridView.GetSelectedRows();
            if (selectedEntities == 0) {
                afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
            }
            else {
                var accDocID = selectedEntities[0].DataItem["AccDoc"];
                var accDocEntity = afw.uiApi.FetchEntity("acc.AccDoc", String.Format("ID = '{0}'", accDocID));

                if (cmn.OpenWindowExists())
                    afw.EntityHelper.OpenEntityFormInWindow(accDocEntity, "acc.AccDocEditForm", "Edit", {                       
                        Title: "سند حسابداری"
                    });
                else
                    afw.EntityHelper.OpenEntityFormInMdiContainer(accDocEntity, "acc.AccDocEditForm", "Edit", {
                        Title: "سند حسابداری"
                    }); 
            }
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.DaftarRoznameReportForm";
    FormClass.BaseType = afw.BasePanel;


    acc.DaftarRoznameReportForm = FormClass;
})();