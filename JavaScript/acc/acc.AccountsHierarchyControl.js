(function () {
    var typeName = "acc.AccountsHierarchyControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var AccountsHierarchyControl = baseType.extend({
        events: events,

        GetType: function () {
            return acc.AccountsHierarchyControl;
        },

        init: function (options) {
            var that = this;

            if (!ValueIsEmpty(options.BaseFilterExpression))
                options.BaseFilterExpression += " and "
            options.BaseFilterExpression += "AccountLevel_Name = 'Kol'";

            that._FinancialYearID = null;

            if ("CustomOptions" in options && options.CustomOptions != null) {
                var customOptions = options.CustomOptions;

                if ("AccountName" in customOptions)
                    that._AccountName = customOptions.AccountName;

                if ("FinancialYear" in customOptions && !ValueIsEmpty(customOptions.FinancialYear))
                    that._FinancialYearID = customOptions.FinancialYear;
            }

            if (that._FinancialYearID == null)
                that._FinancialYearID = cmn.GetUserActiveFinancialYearID();

            cmn.InitFinancialOpList(options, that._FinancialYearID);

            options.DataListFullName = "acc.AccountsHierarchy";
            afw.DataListControl.fn.init.call(that, options);

            that._EntitiesGridView = that.FindControl("DataListControl_EntitiesGridView");
            that._EntitiesGridView.bind("SelectedRowsChanged", function (e) { that._EntitiesGridView_SelectedRowsChanged(e); });
            that._ParentAccount = null;
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that.Toolbar.AddButton("CodingAccount", "درخت کدینگ", { Image: "resource(cmn.tree)" });

            if (that.Toolbar.ButtonExists("New"))
                that.Toolbar.RemoveButton("New");

            if (that.Toolbar.ButtonExists("Edit"))
                that.Toolbar.RemoveButton("Edit");

            if (that.Toolbar.ButtonExists("Delete"))
                that.Toolbar.RemoveButton("Delete");

            if (that.Toolbar.ButtonExists("ExportToExcel"))
                that.Toolbar.RemoveButton("ExportToExcel");
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);

            if (buttonKey == 'CodingAccount')
                that._CreateCodingAccount();
        },

        _CreateCodingAccount: function () {
            var that = this;

            var parentWindow = new afw.Window({
                Name: "ParentWindow",
                Modal: true,
                Title: ""
            });

            parentWindow.SetWidth(1200);
            parentWindow.SetHeight(900);

            var accountForm = new acc.AccountForm({
                Name: "CodingAccount",
                ParentControl: parentWindow,
                FillParent: true,
                Title: "درخت کدینگ حساب ها"
            });
            parentWindow.bind("Opening",
                function (e) {
                    e.Sender.Center();
                });

            parentWindow.Open();
        },

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _OnDataLoaded: function () {
            var that = this;

            afw.DataListControl.fn._OnDataLoaded.call(that);

            if (that._EntitiesGridView.GetDataSource().data().length > 0) {
                that._EntitiesGridView.SelectRowByIndex(0);
            }
        },

        _ShowEntityWindow: function (entity, formMode) {
            var that = this;

            return afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode);
        },

        _OnEntityWindowOpened: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowOpened.call(that, entityWindow);
        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;
            //afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);

            if (that._AccountName == 'Moin' && e.sender.GetDataSource()._data[0].AccountLevel_Name == 'Moin') {
                afw.MessageDialog.Show("فقط تا سطح معین میتوان  انتخاب کرد .");
                return;
            }

            if (that._AccountName == 'Kol' && e.sender.GetDataSource()._data[0].AccountLevel_Name == 'Kol') {
                afw.MessageDialog.Show("فقط تا سطح کل میتوان  انتخاب کرد .");
                return;
            }

            that._GoToChildAccounts(e);
        },

        _EntitiesGridView_RowKeyPressed: function (e) {
            var that = this;

            if (e.Key == "Backspace") {
                that._GoToPriorLevelAccounts();
            }
            else if (e.Key == "ArrowUp") {
                var selectedEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedEntities[0].RowIndex == 0)
                    that._QuickSearchTextBox.Focus();
            }
            else if (e.Key == "Escape") {
                that.GetContainerWindow().Close();
            }
            else if (e.Key == "Enter") {
                that._EntitiesGridView_RowDoubleClick(e);
            }
        },

        _QuickSearchTextBox_KeyPressed: function (e) {
            var that = this;

            afw.DataListControl.fn._QuickSearchTextBox_KeyPressed.call(that, e);

            if (e.Key == "Escape") {
                that.GetContainerWindow().Close();
            }
        },

        _EntitiesGridView_SelectedRowsChanged: function (e) {
            var that = this;
        },

        _GoToChildAccounts: function (e) {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            var accountID = selectedEntities[0].DataItem["ID"];
            that._ParentAccount = accountID;
            var accountLevelName = selectedEntities[0].DataItem["AccountLevel_Name"];

            that.GetQuickSearchTextBox().SetValue(null);

            var childAccountExists = afw.uiApi.GetEntityCount("acc.Account",
                String.Format("ParentAccount = '{0}' and FinancialYear = '{1}'", accountID, that._FinancialYearID)) > 0;

            if (accountLevelName == 'Kol') {
                if (childAccountExists) {
                    that.SetBaseFilterExpression(String.Format("AccountLevel_Name = 'Moin' and ParentAccount = '{0}' and FinancialYear = '{1}'",
                        accountID, that._FinancialYearID));
                    that.LoadData();
                }
                else
                    afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
            }
            else if (accountLevelName == 'Moin') {
                if (childAccountExists) {
                    that.SetBaseFilterExpression(String.Format("AccountLevel_Name = 'Tafsili' and ParentAccount = '{0}' and FinancialYear = '{1}'",
                        accountID, that._FinancialYearID));
                    that.LoadData();
                }
                else
                    afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
            }
            else
                afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        },

        _GoToPriorLevelAccounts: function () {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            var accountLevelName = selectedEntities[0].DataItem["AccountLevel_Name"];

            if (accountLevelName == 'Tafsili') {
                var parentAccount = null;
                if (that._ParentAccount != null) {
                    var parentAccountEntityList = afw.uiApi.FetchEntityList("acc.Account",
                        String.Format("ID = '{0}' and FinancialYear = '{1}'", that._ParentAccount, that._FinancialYearID));
                    if (parentAccountEntityList.Entities.length > 0) {
                        parentAccount = parentAccountEntityList.Entities[0].GetFieldValue("ParentAccount");
                        that.SetBaseFilterExpression(String.Format("AccountLevel_Name = 'Moin' and ParentAccount = '{0}' and FinancialYear = '{1}'",
                            parentAccount, that._FinancialYearID));
                        that.LoadData();
                    }
                }
            }
            else if (accountLevelName == 'Moin') {
                that.SetBaseFilterExpression(String.Format("AccountLevel_Name = 'Kol' and FinancialYear = '{0}'", that._FinancialYearID));
                that.LoadData();
            }
        }
    });

    //Static Members:

    AccountsHierarchyControl.TypeName = typeName;
    AccountsHierarchyControl.BaseType = baseType;
    AccountsHierarchyControl.Events = events;

    acc.AccountsHierarchyControl = AccountsHierarchyControl;
})();

