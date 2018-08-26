(function () {
    var typeName = "cmn.StuffsControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var StuffsControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return cmn.StuffsControl;
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

            options.DataListFullName = "cmn.Stuffs";
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

        _OnCreatingColumn: function (columnInfo) {
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
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
                "   exists( \r\n" +
                "       select 1 \r\n" +
                "       from cmn_StuffDefOrganizationUnits \r\n" +
                "       where StuffDef = InnerQuery.StuffDef and {0}) \r\n" +
                "   or not exists(select 1 from cmn_StuffDefOrganizationUnits where StuffDef = InnerQuery.StuffDef) \r\n" +
                ")",
                cmn.GetUserActiveOrganizationUnitsFilterExpression());

            return filterExpression;
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

    StuffsControl.TypeName = typeName;
    StuffsControl.BaseType = baseType;
    StuffsControl.Events = objectEvents;


    cmn.StuffsControl = StuffsControl;
})();