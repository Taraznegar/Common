(function () {
    var typeName = "rp.TankhahListControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var TankhahListControl = baseType.extend({
        events: events,

        GetType: function () {
            return rp.TankhahListControl;
        },

        init: function (options) {
            var that = this;

            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();
            cmn.InitFinancialOpList(options, that._ActiveFinancialYearID);

            options.DataListFullName = "rp.TankhahList";
            afw.DataListControl.fn.init.call(that, options);

            that._tankhahGardanEntity = afw.uiApi.FetchEntityList("rp.TankhahGardan");
            //that._AccountIDs = "";

        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that._Toolbar = that.FindControl(that.GetName() + "_Toolbar");
            that._Toolbar.AddButton("Print", "چاپ", { Image: "resource(cmn.PrintToolbarIcon)" });
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (buttonKey == "New") {
                if (that._ActiveFinancialYearID == null) {
                    afw.ErrorDialog.Show("سال مالی فعال انتخاب نشده است.");
                    return;
                }

                if (that._tankhahGardanEntity.Entities.length == 0) {
                    afw.ErrorDialog.Show("کدینگ تنخواه گردان مشخص نشده است.");
                    return;
                }

                afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
            }
            else if (buttonKey == "Edit") {
                var selectedEntities = that._EntitiesGridView.GetSelectedRows();

                if (that._tankhahGardanEntity.Entities.length > 0) {
                    if (selectedEntities[0].DataItem["TankhahGardan"] != null) {
                        var TankhahGardanEntity = afw.uiApi.FetchEntity("rp.TankhahGardan",
                            String.Format("ID = '{0}'", selectedEntities[0].DataItem["TankhahGardan"]));
                        if (TankhahGardanEntity.FieldExists.length > 0) {
                            //that._AccountIDs = TankhahGardanEntity.GetFieldValue("Account");
                            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
                        }
                        else
                            afw.ErrorDialog.Show("کدینگ تنخواه گردان تغییر یافته است و شخص مورد نظر در لیست کدینگ تنخواه گردان یافت نشد.");
                    }
                    else
                        afw.ErrorDialog.Show("برای این شخص کدینگ تنخواه گردان مشخص نشده است.");
                }
                else
                    afw.ErrorDialog.Show("کدینگ تنخواه گردان مشخص نشده است.");
            }
            else if (buttonKey == "Print") {
                var selectedEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedEntities.length == 0) {
                    afw.ErrorDialog.Show("ابتدا یک ردیف را انتخاب نمایید.");
                    return;
                }
                else {
                    var selectedItemID = selectedEntities[0].DataItem["ID"];

                    var parametrNames = ["TankhahID"];
                    var parametrValues = [selectedItemID];

                    afw.uiApi.ShowProgress(that);
                    afw.ReportHelper.RunReport("rp.TankhahReport", parametrNames, parametrValues, null,
                    function (result) {
                        afw.uiApi.HideProgress(that);
                        if (result.HasError) {
                            afw.ErrorDialog.Show(result.ErrorMessage);
                        } else {
                            var returnValue = result.Value;
                        }
                    });
                }
            }
            else
                afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            if (!ValueIsEmpty(filterExpression))
                filterExpression += " and ";
            filterExpression += cmn.GetUserActiveOrganizationUnitsFilterExpression();

            return filterExpression;
        },

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _ShowEntityWindow: function (entity, formMode, options) {
            var that = this;

            //var account = that._AccountIDs;
            //var options = {
            //    Account: account
            //};

            return afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode, options);
        },

        _OnEntityWindowOpened: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowOpened.call(that, entityWindow);
        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();

            if (that._tankhahGardanEntity.Entities.length > 0) {
                if (selectedEntities[0].DataItem["TankhahGardan"] != null) {
                    var TankhahGardanEntity = afw.uiApi.FetchEntity("rp.TankhahGardan",
                        String.Format("ID = '{0}'", selectedEntities[0].DataItem["TankhahGardan"]));
                    if (TankhahGardanEntity.FieldExists.length > 0) {
                        //that._AccountIDs = TankhahGardanEntity.GetFieldValue("Account");
                        afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
                    }
                    else
                        afw.ErrorDialog.Show("کدینگ تنخواه گردان تغییر یافته است و شخص مورد نظر در لیست کدینگ تنخواه گردان یافت نشد.");
                }
                else
                    afw.ErrorDialog.Show("برای این شخص کدینگ تنخواه گردان مشخص نشده است.");
            }
            else
                afw.ErrorDialog.Show("کدینگ تنخواه گردان مشخص نشده است.");
        }
    });

    //Static Members:

    TankhahListControl.TypeName = typeName;
    TankhahListControl.BaseType = baseType;
    TankhahListControl.Events = events;


    rp.TankhahListControl = TankhahListControl;
})();
