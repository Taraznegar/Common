(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return acc.ConnecetedAccouns;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._GridView = null;
            that._ConnectedEntityList = null;

            that._ShenavarType = options.ShenavarType;
            that._ShenavarID = options.ShenavarID;
            that._ShenavarName = options.ShenavarName;
            
            if ("FromDate" in options)
                that._FromDate = options.FromDate;
            if ("ToDate" in options)
                that._ToDate = options.ToDate;
            if ("FromDocRefNo" in options)
                that._FromDocRefNo = options.FromDocRefNo;
            if ("ToDocRefNo" in options)
                that._ToDocRefNo = options.ToDocRefNo;
            if ("OrganizationUnit" in options)
                that._OrganizationUnit = options.OrganizationUnit;
            if ("FinancialDocType" in options)
                that._FinancialDocType = options.FinancialDocType;

            that._KolLevelID = afw.OptionSetHelper.GetOptionSetItemID("acc.AccountLevel.Kol");
            that._MoinLevelID = afw.OptionSetHelper.GetOptionSetItemID("acc.AccountLevel.Moin");
            that._TafsiliLevelID = afw.OptionSetHelper.GetOptionSetItemID("acc.AccountLevel.Tafsili");

            that._AccountsPanel = that.FindControl("AccountsPanel");
            
            var printButton = that.FindControl("PrintButton");
            
            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();

            that._SetLabels();
            
            that._FetchConnectedEntityList();
            that._CreateGridView();

            printButton.bind("Click", function (e) { that._PrintButton_Click(e); });
        },

        _PrintButton_Click: function(e){
            var that = this;

            var today = afw.DateTimeHelper.GregorianToJalali(afw.DateTimeHelper.GetServerDateTime());
            var timeAndDateArray = today.split(" ", 3);

            afw.uiApi.ShowProgress(that);
            afw.ReportHelper.RunReport("acc.ConnectedAccountsReport",
                 ["ShenavarType", "ShenavarID", "ReportDate", "ReportTime", "ShenavarName", "FinancialYearID"],
                 [that._ShenavarType.split("_")[1], that._ShenavarID, timeAndDateArray[0], timeAndDateArray[1], that._ShenavarName, that._FinancialYearID],
                 null,
                 function (result) {
                     afw.uiApi.HideProgress(that);
                 });
        },

        _MainTabControl_SelectedTabChanged: function (e) {
            var that = this;

            if (that._MainTabControl.GetSelectedTabIndex() == 0)
                that._CreateGridView('Kol');

            if (that._MainTabControl.GetSelectedTabIndex() == 1)
                that._CreateGridView('Moin');

            if (that._MainTabControl.GetSelectedTabIndex() == 2)
                that._CreateGridView('Tafsili');

        },

        _FetchConnectedEntityList: function () {
            var that = this;

            that._ConnectedEntityList = afw.uiApi.CallServerMethodSync("acc.GetConnectedAccounts",
                [that._ShenavarType, that._ShenavarID, that._FinancialYearID,
                ValueIsEmpty(that._FromDate) ? null : that._FromDate,
                ValueIsEmpty(that._ToDate) ? null : that._ToDate,
                ValueIsEmpty(that._FromDocRefNo) ? null : that._FromDocRefNo,
                ValueIsEmpty(that._ToDocRefNo) ? null : that._ToDocRefNo,
                ValueIsEmpty(that._OrganizationUnit) ? null : that._OrganizationUnit,
                ValueIsEmpty(that._FinancialDocType) ? null : that._FinancialDocType, ]);
        },

        _SetLabels: function(){
            var that = this;

            var shenavarTypeLabel = '';

            if (that._ShenavarType == 'Shenavar_Person')
                shenavarTypeLabel = 'شخص';

            else if (that._ShenavarType == 'Shenavar_CostCenter')
                shenavarTypeLabel = 'مرکز هزینه';

            else if (that._ShenavarType == 'Shenavar_Project')
                shenavarTypeLabel = 'پروژه';

            else if (that._ShenavarType == 'Shenavar_OrganizationUnit')
                shenavarTypeLabel = 'واحد سازمانی';

            that.FindControl("ShenavarTypeLabel").SetText(shenavarTypeLabel);
            that.FindControl("ShenavarNameLabel").SetText(that._ShenavarName);
        },

        _GetKolAccountsArray: function () {
            var that = this;

            var kolArray = [];
            var itemCount = that._ConnectedEntityList.Entities.length;
            for (var i = 0; i < itemCount; i++) {
                if (that._ConnectedEntityList.Entities[i].GetFieldValue("AccountLevel") == that._KolLevelID)
                    kolArray.push(that._ConnectedEntityList.Entities[i].GetFieldValue("AccountID"));
            }
            return kolArray;
        },

        _GetMoinAccountsArray: function () {
            var that = this;

            var moinArray = [];
            var itemCount = that._ConnectedEntityList.Entities.length;
            for (var i = 0; i < itemCount; i++) {
                if (that._ConnectedEntityList.Entities[i].GetFieldValue("AccountLevel") == that._MoinLevelID)
                    moinArray.push(that._ConnectedEntityList.Entities[i].GetFieldValue("AccountID"));
            }
            return moinArray;
        },

        _GetTafsiliAccountsArray: function () {
            var that = this;

            var tafsiliArray = [];
            var itemCount = that._ConnectedEntityList.Entities.length;
            for (var i = 0; i < itemCount; i++) {
                if (that._ConnectedEntityList.Entities[i].GetFieldValue("AccountLevel") == that._TafsiliLevelID)
                    tafsiliArray.push(that._ConnectedEntityList.Entities[i].GetFieldValue("AccountID"));
            }
            return tafsiliArray;
        },

        _CreateGridView: function () {
            var that = this;

            var entityList = null;
            var parentControl = null;

            var accountFullName = { title: " شرح حساب ", field: "AccountFullName", rightToLeft: true, width: 150 };
            //var accountName = { title: " شرح حساب ", field: "AccountName", rightToLeft: true, width: 50 };
            var debtorAmount = { title: "بدهکار", field: "DebtorAmountSum", rightToLeft: true, valuesDisplayMethod: "Number", width: 50 };
            var creditorAmount = { title: "بستانکار", field: "CreditorAmountSum", rightToLeft: true, valuesDisplayMethod: "Number", width: 50 };
            var mande = { title: "مانده", field: "Mande", rightToLeft: true, valuesDisplayMethod: "Number", width: 50 };
            var mandeStatus = { title: "وضعیت", field: "MandeStatus", rightToLeft: true,  width: 25 };

            var columns = [accountFullName, debtorAmount, creditorAmount, mande, mandeStatus];

            var gridView = that._AccountsPanel.FindControl("GridView");
            if (gridView != null)
                gridView.Destroy();

            that._GridView = new afw.GridView({
                ParentControl: that._AccountsPanel,
                Name: "GridView",
                FillParent: true,
                Columns: columns,
                SelectionMode: "SingleRow"
            });

            that._GridView.GetDataSource().data(that._ConnectedEntityList.ToDataSourceData());

            that._GridView.bind("RowDoubleClick", function (e) { that._GridView_RowDoubleClick(e); });
        },

        _GridView_RowDoubleClick: function (e) {
            var that = this;

            var shenavarType = '';
            var selectedEntities = that._GridView.GetSelectedRows();

            var accountID = selectedEntities[0].DataItem.AccountID;
            var shenavarID = selectedEntities[0].DataItem.ShenavarID;

            acc.DestroyShenavarhaForm();

            that._ShenavarhaReportForm = afw.uiApi.OpenSavedFormInMdiContainer("acc.ShenavarhaReportForm", "گزارش شناورها", {
                Name: 'ShenavarhaReportFormInstance',
                Account: accountID,
                ShenavarsType: [that._ShenavarType],
                Shenavars: [shenavarID],
                FromDate: that._FromDate,
                ToDate: that._ToDate,
                OrganizationUnit: that._OrganizationUnit,
                FinancialDocType: that._FinancialDocType
            });
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.ConnecetedAccouns";
    FormClass.BaseType = afw.BasePanel;


    acc.ConnecetedAccouns = FormClass;
})();