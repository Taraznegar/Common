﻿(function () {
    var typeName = "ps.StuffsAndServicesControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var StuffsAndServicesControl = baseType.extend({
        events: events,

        GetType: function () {
            return ps.StuffsAndServicesControl;
        },

        init: function (options) {
            var that = this;

            var mode = null;
            options.LoadDataOnInit = false;

            if ("CustomOptions" in options && options.CustomOptions != null) {
                var customOptions = options.CustomOptions;

                if ("Mode" in customOptions)
                    mode = customOptions.Mode;
            }

            if (!ValueIsEmpty(mode) && mode.EndsWith("Lookup")) {
                if (!ValueIsEmpty(options.BaseFilterExpression))
                    options.BaseFilterExpression += " and ";
                options.BaseFilterExpression += "IsActive = 1";
            }

            options.DataListFullName = "ps.StuffsAndServices";
            afw.DataListControl.fn.init.call(that, options);

            that._VDockPanel.InsertPane(2, { Size: 100 }, true);

            that._FilterControl = afw.uiApi.CreateSavedFormByName(
                that._VDockPanel.Panes[2],
                "cmn.DataListAdvancedFilterControl", {
                    ColumnsFilterInfo: [
                        {
                            FieldName: "DisplayName",
                            Title: "نام",
                            ControlType: "TextBox",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "Code",
                            Title: "کد",
                            ControlType: "TextBox"
                        },
                        {
                            FieldName: "BarCode",
                            Title: "بارکد",
                            ControlType: "TextBox"
                        },
                        {
                            FieldName: "MainCategory",
                            Title: "گروه اصلی",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.StuffMainCategories",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "SubCategory",
                            Title: "گروه فرعی",
                            ControlType: "Lookup",
                            LookupDataListFullName: "cmn.StuffSubCategories",
                            LookupEntityCaptionFieldName: "Title",
                            LookupControlType: "Simple"
                        },
                        {
                            FieldName: "Custom_TavanKva",
                            Title: "توان(KVA)",
                            ControlType: "Numeric",
                            CompareOperator: "like"
                        },
                        {
                            FieldName: "Custom_CodeAnbar",
                            Title: "ردیف انبار",
                            ControlType: "TextBox"
                        },
                        {
                            FieldName: "Custom_CodeHesabdari",
                            Title: "کد حسابداری",
                            ControlType: "TextBox"
                        }]
                });
            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });

            that.LoadData();
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _LoadData: function () {
            var that = this;

            if (that._FilterControl == null)
                return;

            afw.DataListControl.fn._LoadData.call(that);
        },

        _OnLoadingData: function () {
            var that = this;

            afw.DataListControl.fn._OnLoadingData.call(that);
        },

        _ShowEntityWindow: function (entity, formMode, options) {
            var that = this;

            return afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode, options);
        },

        _OnEntityWindowOpened: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowOpened.call(that, entityWindow);
        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

            that.LoadData();
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filterExpression = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            if (!ValueIsEmpty(that._FilterControl.GetFilterExpression())) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";

                filterExpression += that._FilterControl.GetFilterExpression();
            }

            if (!ValueIsEmpty(filterExpression))
                filterExpression += " and ";

            filterExpression += String.Format(
                "(" +
                "   exists ( \r\n" +
                "       select 1 \r\n" +
                "       from cmn_StuffDefOrganizationUnits \r\n" +
                "       where StuffDef = InnerQuery.ID and {0}) \r\n" +
                "   or " +
                "   exists ( \r\n" +
                "       select 1 \r\n" +
                "       from cmn_ServiceOrganizationUnits \r\n" +
                "       where Service = InnerQuery.ID and {0}) \r\n" +
                "   or ( \r\n" +
                "       not exists (select 1 from cmn_StuffDefOrganizationUnits where StuffDef = InnerQuery.ID) \r\n" +
                "       and not exists (select 1 from cmn_ServiceOrganizationUnits where Service = InnerQuery.ID)) \r\n" +
                ")",
                cmn.GetUserActiveOrganizationUnitsFilterExpression());

            return filterExpression;
        }
    });

    //Static Members:

    StuffsAndServicesControl.TypeName = typeName;
    StuffsAndServicesControl.BaseType = baseType;
    StuffsAndServicesControl.Events = events;


    ps.StuffsAndServicesControl = StuffsAndServicesControl;
})();