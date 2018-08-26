(function () { 
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return ps.StuffRequestEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._FormHasUnsavedChanges = true;

            that._MainDockPanel = that.FindControl("MainDockPanel");

            that.ItemsEntityList = null;

            that._RequestTypeFieldControl = that.FindControl("RequestTypeFieldControl");
            that._CustomerLookupControl = that.FindControl("CustomerLookupControl");
            that._CustomerAutoComplete = that._CustomerLookupControl.GetAutoComplete();
            that._IssueDateControl = that.FindControl("IssueDateControl");
            that._FinancialGroupFieldControl = that.FindControl("FinancialGroupFieldControl").FindControl("InnerControl");
            
            that._FinancialGroupFieldControl.SetBaseFilterExpression("StuffRequestStartNumber = 1");

            that._CustomerLookupControl.bind("ValueChanged", function (e) { that._CustomerLookupControl_ValueChanged(e) });
            that._CustomerLookupControl.bind("ValueChanged", function (e) { that._CustomerLookupControl_ValueChanged(e) });
            that._FinancialGroupFieldControl.bind("ValueChanged", function (e) { that._FinancialGroupFieldControl_ValueChanged(e) });
            if (!that._BindableEntity._Entity.FieldExists("StuffItems"))
                that._BindableEntity._Entity.AddField("StuffItems");
            if (that._FormMode == "New") {

                that._BindableEntity.set("IssueDate", afw.DateTimeHelper.GetServerDateTime());

                if (that._BindableEntity._Entity.GetFieldValue("StuffItems") == null) {
                    var itemsEntityList = afw.uiApi.CreateEntityList("ps.StuffRequestItem");
                    that._BindableEntity._Entity.SetFieldValue("StuffItems", itemsEntityList);
                }
                var financialYearsEntity = cmn.GetUserActiveFinancialYearEntity();
                that._BindableEntity._Entity.SetFieldValue("FinancialYear", financialYearsEntity.GetFieldValue("ID"));

            }
            else {
                if (that._BindableEntity._Entity.GetFieldValue("StuffItems") == null) {
                    itemsEntityList = afw.uiApi.FetchEntityList("ps.StuffRequestItem",
                        String.Format("StuffRequest = '{0}'", that._BindableEntity.get("ID")), "RowNumber");
                    that._BindableEntity._Entity.SetFieldValue("StuffItems", itemsEntityList);
                }
                that._RequestTypeFieldControl.SetReadOnly(true);
            }
            that.ItemsEntityList = that._BindableEntity._Entity.GetFieldValue("StuffItems");
            
            that._ItemsGridControl = new ps.StuffRequestItemsGridControl({
                ParentControl: that._MainDockPanel.Panes[2],
                Name: "ItemsGridControl",
                StuffRequestEditForm: that,
                RowsEntityList: that.ItemsEntityList,
                FillParent: false
            });
            if (that.ItemsEntityList.Entities.length == 0)
                that._ItemsGridControl.AddEmptyItems(1);
            else {
                for (var i = 0; i < that.ItemsEntityList.Entities.length; i++) {
                    that._ItemsGridControl.AddRow(that.ItemsEntityList.Entities[i]);
                }
            }

            that._IssueDateControl.bind("ValueChanged", function (e) { that._IssueDateControl_ValueChanged(e); });
        },

        GetBindableEntity: function () {
            var that = this;

            return that._BindableEntity;
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);

            if (ps.GetCurrentTaxAndTollPercentEntity() == null) {
                afw.MessageDialog.Show("درصد مالیات و عوارض تعیین نشده است.");
                that.Close();
            }

            setTimeout(
                function () {
                    that._CustomerAutoComplete.Focus();
                }, 500);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _CustomerLookupControl_ValueChanged: function (e) {
            var that = this;

            that._AdjustForm();
        },

        _IssueDateControl_ValueChanged: function (e) {
            var that = this;

            that._AdjustForm();
        },

        _FinancialGroupFieldControl_ValueChanged: function (e) {
            var that = this;
            //if (!ValueIsEmpty(that._FinancialGroupFieldControl.GetValue())) {
            //    var financialGroupEntity = afw.uiApi.FetchEntity("cmn.FinancialGroup",
            //            String.Format("ID = '{0}'", that._FinancialGroupFieldControl.GetValue()));
            //    var isTaxCalculation = financialGroupEntity.GetFieldValue("CalculationTax");
            //    that._IsOfficialFieldControl.SetValue(isTaxCalculation);
            //    if (isTaxCalculation == true)
            //        for (var i = 0; i < that._ItemsGridControl.GetRowsCount() ; i++) {
            //            var rowControl = that._ItemsGridControl.GetRowByIndex(i);
            //            rowControl.UpdateTaxAndToll();
            //        }
            //}
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);

           // var enableSalesCase = that._BindableEntity.get("Customer") != null;
            //that._SaleCaseLookupControl.SetReadOnly(!enableSalesCase);

       },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            if (!that._ItemsGridControl.ValidateRows())
                return false;

            return true;
        },

        _Save: function () {
            var that = this;
            if (that._FinancialGroupFieldControl.GetValue() == null) {
                afw.MessageDialog.Show("گروه مالی را انتخاب کنید.");
                return;
            }
            if (that._RequestTypeFieldControl.GetValue() == null) {
                afw.MessageDialog.Show("نوع درخواست را انتخاب کنید.");
                return;
            }
            var saved = afw.EntityWindowBase.fn._Save.call(that);

            if (saved == true)
                afw.MessageDialog.Show("اطلاعات با موفقیت ثبت شد.");

            return saved;
        } 
    });

    //Static Members:

    FormClass.TypeName = "ps.StuffRequestEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    ps.StuffRequestEditForm = FormClass;
})();