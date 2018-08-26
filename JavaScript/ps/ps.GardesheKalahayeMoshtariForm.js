(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return ps.GardesheKalahayeMoshtariForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._IssueDateBeginDateTimeControl = that.FindControl("IssueDateBeginDateTimeControl");
            that._IssueDateEndDateTimeControl = that.FindControl("IssueDateEndDateTimeControl");
            that._SearchGridPanel = that.FindControl("SearchGridPanel");
            that._PersonLookupControl = that.FindControl("PersonLookupControl");
            that._StuffLabelLookupControl = that.FindControl("StuffLabelLookupControl");
            that._TypeOptionSetControl = that.FindControl("TypeOptionSetControl");
            that._SearchButton = that.FindControl("SearchButton");

            that._SearchGridView = null;

            that._CreateGridView();            

            that._FinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();
            that._IssueDateBeginDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("StartDate"));
            that._IssueDateEndDateTimeControl.SetValue(that._FinancialYearEntity.GetFieldValue("EndDate"));

            that._IssueDateBeginDateTimeControl.bind("ValueChanged", function (e) { that._IssueDateTimeControl_ValueChanged(e); });
            that._IssueDateEndDateTimeControl.bind("ValueChanged", function (e) { that._IssueDateTimeControl_ValueChanged(e); });
            that._PersonLookupControl.bind("ValueChanged", function (e) { that._ClearGrid(); });
            that._StuffLabelLookupControl.bind("ValueChanged", function (e) { that._ClearGrid(); });
            that._TypeOptionSetControl.bind("ValueChanged", function (e) { that._ClearGrid(); });
            that._SearchButton.bind("Click", function (e) { that._SearchButton_Click(e); });

            that._PersonLookupControl.SetBaseFilterExpression("ID not in (select Person from cmn_Person_PotentialCustomerInfos)");
        },

        _CreateGridView: function () {
            var that = this;

            if (that._SearchGridView != null) {
                that._SearchGridView.Destroy();
                that._SearchGridView = null;
            }

            that._SearchGridView = new afw.GridView({
                ParentControl: that._SearchGridPanel,
                Name: "SearchGridView",
                FillParent: true,
                Columns: [
                    {
                        title: "تاریخ",
                        field: "IssueDate",
                        rightToLeft: true,
                        width: 100
                    },
                    {
                        title: "نوع",
                        field: "SalesBuyType",
                        rightToLeft: true,
                        width: 50
                    },
                    {
                        title: "نام کالا",
                        field: "StuffDef_Name",
                        rightToLeft: true,
                        width: 150
                    },
                    {
                        title: "تعداد خرید",
                        field: "BuyQuantity",
                        rightToLeft: true,
                        width: 100
                    },
                    {
                        title: "مبلغ خرید",
                        field: "BuyPrice",
                        rightToLeft: true,
                        width: 100,
                        valuesDisplayMethod: "Number"
                    },
                    {
                        title: "تعداد فروش",
                        field: "SalesQuantity",
                        rightToLeft: true,
                        width: 100
                    },
                    {
                        title: "مبلغ فروش",
                        field: "SalesPrice",
                        rightToLeft: true,
                        width: 100,
                        valuesDisplayMethod: "Number"
                    }
                ],
                SelectionMode: "SingleRow"
            });


        },

        _IssueDateTimeControl_ValueChanged: function (e) {
            var that = this;

            that._ValidateDateControls();

            that._ClearGrid();

        },

        _SearchButton_Click: function (e) {
            var that = this;

            var person = that._PersonLookupControl.GetValue();

            if (person == null)
                afw.ErrorDialog.Show("مشتری را وارد کنید");
            else
                that._ApplyFilter();
        },

        _ClearGrid: function () {
            var that = this;

            if (that._SearchGridView == null)
                return;
            
            that._SearchGridView.GetDataSource().data(afw.uiApi.CreateEntityList().ToDataSourceData());

        },

        _ApplyFilter: function () {
            var that = this;

            var type = that._TypeOptionSetControl.GetValue();
            var issueDateBegin = that._IssueDateBeginDateTimeControl.GetValue();
            var issueDateEnd = that._IssueDateEndDateTimeControl.GetValue();
            var person = that._PersonLookupControl.GetValue();
            var stuffLabel = that._StuffLabelLookupControl.GetValue();

            var entityList = afw.uiApi.CallServerMethodSync("ps.GetGardesheKalahayeMoshtari",
                                                            [type, issueDateBegin, issueDateEnd, person, stuffLabel]);

            if (entityList == null)
                entityList = afw.uiApi.CreateEntityList();

            that._SearchGridView.GetDataSource().data(entityList.ToDataSourceData());

        },

        _ValidateDateControls: function () {
            var that = this;

            var startDate = afw.DateTimeHelper.ToTenCharactersDateFormat(that._FinancialYearEntity.GetFieldValue("StartDate"));
            var endDate = afw.DateTimeHelper.ToTenCharactersDateFormat(that._FinancialYearEntity.GetFieldValue("EndDate"));

            var issueDateBegin = afw.DateTimeHelper.ToTenCharactersDateFormat(that._IssueDateBeginDateTimeControl.GetValue());
            var issueDateEnd = afw.DateTimeHelper.ToTenCharactersDateFormat(that._IssueDateEndDateTimeControl.GetValue());

            var hasError = false;

            if (issueDateBegin < startDate || issueDateBegin > endDate) {
                that._IssueDateBeginDateTimeControl.SetValue(startDate);
                hasError = true;
            }
            else
                if (issueDateEnd < startDate || issueDateEnd > endDate) {
                    that._IssueDateEndDateTimeControl.SetValue(endDate);
                    hasError = true;
                }

            if (issueDateBegin > issueDateEnd) {
                that._IssueDateBeginDateTimeControl.SetValue(startDate);
                that._IssueDateEndDateTimeControl.SetValue(endDate);
                hasError = true;
            }

            if (hasError)
                afw.MessageDialog.Show("تاریخ باید در محدوده سال مالی باشد");
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "ps.GardesheKalahayeMoshtariForm";
    FormClass.BaseType = afw.BasePanel;


    ps.GardesheKalahayeMoshtariForm = FormClass;
})();