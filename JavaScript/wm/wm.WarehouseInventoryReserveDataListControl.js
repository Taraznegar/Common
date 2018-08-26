(function () {
    var typeName = "wm.WarehouseInventoryReserveDataListControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var WarehouseInventoryReserveDataListControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return wm.WarehouseInventoryReserveDataListControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "wm.WarehouseInventoryReserveDataList";
            afw.DataListControl.fn.init.call(that, options);

            that._EntitiesGridView = that.GetEntitiesGridView();
            that._EntitiesGridView.bind("SelectedRowsChanged", function (e) { that._EntitiesGridView_SelectedRowsChanged(e); });

            that._VDockPanel.InsertPane(2, { Size: 90 }, true);

            var activeFinancialYearStartDate = null;
            var activeFinancialYearEndDate = null;
            var activeFinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();

            if (activeFinancialYearEntity != null) {
                activeFinancialYearStartDate = activeFinancialYearEntity.GetFieldValue("StartDate");
                activeFinancialYearEndDate = activeFinancialYearEntity.GetFieldValue("EndDate");
            }

            that._FilterControl = afw.uiApi.CreateSavedFormByName(
                that._VDockPanel.Panes[2],
                "cmn.DataListAdvancedFilterControl",
                {
                    ColumnsFilterInfo: [
                        {
                            FieldName: "ReserveOrUnreserve",
                            Title: "رزرو/برگشت از رزرو",
                            ControlType: "OptionSet",
                            OptionSetFullName: "wm.WarehouseInventoryReserveListItemType",
                            OptionSetValueDataMember: "Name",
                            IsFixed: true
                        },
                        {
                            FieldName: "InsertOrganizationUnit",
                            Title: "واحد سازمانی ثبت",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.OrganizationInformationList",
                            LookupEntityCaptionFieldName: "Name",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "CreatorUser",
                            Title: "کاربر ثبت کننده",
                            ControlType: "Lookup",
                            LookupDataListFullName: "afw.SystemUsers",
                            LookupEntityCaptionFieldName: "DisplayName",
                            LookupControlType: "Advanced"
                        },
                        {
                            FieldName: "Stuff",
                            Title: "کالا",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.Stuffs",
                            LookupEntityCaptionFieldName: "DisplayName",
                            LookupControlType: "Advanced"
                        },
                        {
                            FieldName: "StuffStatus",
                            Title: "وضعیت کالا",
                            ControlType: "Lookup",
                            LookupDataListFullName: "wm.StuffStatusList",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "CreationTime",
                            Title: "از تاریخ ثبت",
                            ControlType: "Date",
                            CompareOperator: ">=",
                            DefaultValue: activeFinancialYearStartDate
                        },
                        {
                            FieldName: "CreationTime",
                            Title: "تا تاریخ ثبت",
                            ControlType: "Date",
                            CompareOperator: "<=",
                            DefaultValue: activeFinancialYearEndDate
                        }]
                });

            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });
        },

        _OnCreatingColumn: function (columnInfo) {
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that.Toolbar.AddButton("NewUnreserve", "برگشت از رزرو جدید");
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);

            if (buttonKey == "NewUnreserve") {
                var selectedEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedEntities.length == 0)
                    afw.MessageDialog.Show("ابتدا یک رزرو را انتخاب نمایید.");
                else {
                    var selectedReserveID = selectedEntities[0].DataItem["ID"];
                    var unreserveEntity = afw.uiApi.CreateNewEntity("wm.WarehouseInventoryReserveListItem");
                    unreserveEntity.SetFieldValue("Unreserve_RelatedReserveItem", selectedReserveID);
                    unreserveEntity.SetFieldValue("ReserveOrUnreserve", afw.OptionSetHelper.GetOptionSetItemID("wm.WarehouseInventoryReserveListItemType.Unreserve"));
                    unreserveEntity.SetFieldValue("Stuff", selectedEntities[0].DataItem["Stuff"]);
                    unreserveEntity.SetFieldValue("StuffStatus", selectedEntities[0].DataItem["StuffStatus"]);
                    unreserveEntity.SetFieldValue("InsertOrganizationUnit", selectedEntities[0].DataItem["InsertOrganizationUnit"]);

                    var entityWindow = that._ShowEntityWindow(unreserveEntity, "New");
                }
            }
        },

        _FilterControl_FilterChanged: function () {
            var that = this;

            that.LoadData();
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);
            var filterControl_FilterExpression = "";

            if (!ValueIsEmpty(that._FilterControl))
                filterControl_FilterExpression = that._FilterControl.GetFilterExpression();

            if (!ValueIsEmpty(filterControl_FilterExpression)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += filterControl_FilterExpression;
            }

            return filterExpression;
        },

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _OnDataLoaded: function () {
            var that = this;

            afw.DataListControl.fn._OnDataLoaded.call(that);
        },

        _ShowEntityWindow: function (entity, formMode, options) {
            var that = this;

            return afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode, options);
        },

        _OnEntityWindowOpened: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowOpened.call(that, entityWindow);
        },

        _OnEntityWindowClosed: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowClosed.call(that, entityWindow);
        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        },

        _EntitiesGridView_SelectedRowsChanged: function (e) {
            var that = this;
             
            var selectedRowIsReserve = null;

            var selectedEntities = that._EntitiesGridView.GetSelectedRows();
            if (selectedEntities.length > 0)
                selectedRowIsReserve = selectedEntities[0].DataItem["ReserveOrUnreserve"] == afw.OptionSetHelper.GetOptionSetItemID("wm.WarehouseInventoryReserveListItemType.Reserve");
            else
                selectedRowIsReserve = false;

            that.Toolbar.SetButtonEnabled("NewUnreserve", selectedRowIsReserve);
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            afw.DataListControl.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.DataListControl.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    WarehouseInventoryReserveDataListControl.TypeName = typeName;
    WarehouseInventoryReserveDataListControl.BaseType = baseType;
    WarehouseInventoryReserveDataListControl.Events = objectEvents;


    wm.WarehouseInventoryReserveDataListControl = WarehouseInventoryReserveDataListControl;
})();
