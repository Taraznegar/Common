(function () {
    var typeName = "acc.GhateiYaMovaghatNemodaneAsnadFormFilterControl";
    var baseType = afw.BasePanel;
    var events = baseType.Events.concat(["FilterChanged"]);

    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return acc.GhateiYaMovaghatNemodaneAsnadFormFilterControl;
        },

        init: function (options) {
            var that = this;

            that._FinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._IsInSettingFilter = false;

            if ("FromDateFieldName" in options)
                that._FromDateFieldName = options.FromDateFieldName;
            else
                that._FromDateFieldName = "";

            if ("ToDateFieldName" in options)
                that._ToDateFieldName = options.ToDateFieldName;
            else
                that._ToDateFieldName = "";

            if ("FromDocNoFieldName" in options)
                that._FromDocNoFieldName = options.FromDocNoFieldName;
            else
                that._FromDocNoFieldName = "";

            if ("ToDocNoFieldName" in options)
                that._ToDocNoFieldName = options.ToDocNoFieldName;
            else
                that._ToDocNoFieldName = "";

            if ("IsTransferredFieldName" in options)
                that._IsTransferredFieldName = options.IsTransferredFieldName;
            else
                that._IsTransferredFieldName = "";

            if ("TransferDatabaseFielName" in options)
                that._TransferDatabaseFielName = options.TransferDatabaseFielName;
            else
                that._TransferDatabaseFielName = "";

            that._MainDockPanel = that.FindControl("MainDockPanel");

            that._FromDateControl = that.FindControl("FromDateControl");
            that._ToDateControl = that.FindControl("ToDateControl");
            that._FromDocNoTextBox = that.FindControl("FromDocNoTextBox");
            that._ToDocNoTextBox = that.FindControl("ToDocNoTextBox");
            that._TransferStatusComboBox = that.FindControl("TransferStatusComboBox");
            that._TransferDatabaseComboBox = that.FindControl("TransferDatabaseComboBox");

            if (that._TransferStatusComboBox != null) {
                var transferStatusComboBoxItems = [
                    { Key: "All", Title: "همه اسناد" },
                    { Key: "TransferredDocs", Title: "اسناد منتقل شده" },
                    { Key: "NotTransferredDocs", Title: "اسناد منتقل نشده" }];
                that._TransferStatusComboBox.SetItemsDataSource(transferStatusComboBoxItems);

                if (!ValueIsEmpty(that._IsTransferredFieldName))
                    that._TransferStatusComboBox.SetValue("NotTransferredDocs");
            }

            if (!ValueIsEmpty(that._TransferDatabaseComboBox)) {
                var transferDatabaseEntityList = afw.uiApi.FetchEntityList("cmn.TransferDatabase").ToDataSourceData();
                if (transferDatabaseEntityList.length != 0) {
                    that._TransferDatabaseComboBox.SetItemsDataSource(transferDatabaseEntityList);

                    if (transferDatabaseEntityList.length == 1)
                        that._TransferDatabaseComboBox.SetValue(transferDatabaseEntityList[0].ID);
                }
            }

            that._AdjustColumns();

            that._FromDateControl.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            that._ToDateControl.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            that._FromDocNoTextBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            that._ToDocNoTextBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            that._TransferStatusComboBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            that._TransferDatabaseComboBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
        },

        _AdjustColumns: function () {
            var that = this;

            that._FromDateControl.SetVisible(true);
            that._FromDocNoTextBox.SetVisible(true);
            that._ToDateControl.SetVisible(true);
            that._ToDocNoTextBox.SetVisible(true);
            that._TransferStatusComboBox.SetVisible(true);
            that._TransferDatabaseComboBox.SetVisible(true);

            that.FindControl("FromDateLabel").SetVisible(true);
            that.FindControl("ToDateLabel").SetVisible(true);
            that.FindControl("FromDocNoLabel").SetVisible(true);
            that.FindControl("ToDocNoLabel").SetVisible(true);
            that.FindControl("TransferStatusLabel").SetVisible(true);
            that.FindControl("TransferDatabaseLabel").SetVisible(true);

            if (ValueIsEmpty(that._FromDateFieldName)) {

                that._MainDockPanel.SetPaneSizeSetting(0, 1);
                that._FromDateControl.SetVisible(false);
                that.FindControl("FromDateLabel").SetVisible(false);
            }

            if (ValueIsEmpty(that._ToDateFieldName)) {

                that._MainDockPanel.SetPaneSizeSetting(1, 1);
                that._ToDateControl.SetVisible(false);
                that.FindControl("ToDateLabel").SetVisible(false);
            }

            if (ValueIsEmpty(that._FromDocNoFieldName)) {

                that._MainDockPanel.SetPaneSizeSetting(2, 1);
                that._FromDocNoTextBox.SetVisible(false);
                that.FindControl("FromDocNoLabel").SetVisible(false);
            }

            if (ValueIsEmpty(that._ToDocNoFieldName)) {

                that._MainDockPanel.SetPaneSizeSetting(3, 1);
                that._ToDocNoTextBox.SetVisible(false);
                that.FindControl("ToDocNoLabel").SetVisible(false);
            }

            if (ValueIsEmpty(that._IsTransferredFieldName)) {

                that._MainDockPanel.SetPaneSizeSetting(4, 1);
                that._TransferStatusComboBox.SetVisible(false);
                that.FindControl("TransferStatusLabel").SetVisible(false);
            }

            if (ValueIsEmpty(that._TransferDatabaseFielName)) {

                that._MainDockPanel.SetPaneSizeSetting(5, 1);
                that._TransferDatabaseComboBox.SetVisible(false);
                that.FindControl("TransferDatabaseLabel").SetVisible(false);
            }
        },

        SetFilterValues: function (filterValues) {
            var that = this;

            that._IsInSettingFilter = true;
            try {
                if ("FromDate" in filterValues)
                    that._FromDateControl.SetValue(filterValues.FromDate);

                if ("ToDate" in filterValues)
                    that._ToDateControl.SetValue(filterValues.ToDate);

                if ("FromDocNo" in filterValues)
                    that._FromDocNoTextBox.SetValue(filterValues.FromDocNo);

                if ("ToDocNo" in filterValues)
                    that._ToDocNoTextBox.SetValue(filterValues.ToDocNo);

                if ("IsTransferred" in filterValues)
                    that._TransferStatusComboBox.SetValue(filterValues.IsTransferred);

                if ("TransferDatabaseFielName" in filterValues)
                    that._TransferDatabaseComboBox.SetValue(filterValues.IsTransferred);
            }
            finally {
                that._IsInSettingFilter = false;
            }

            that._OnFilterChanged();
        },

        _OnFilterChanged: function () {
            var that = this;

            if (that._IsInSettingFilter)
                return;

            that._IsInSettingFilter = true;

            try {
                if (that._events != null)
                    that.trigger("FilterChanged", { Sender: that });
            }
            finally {
                that._IsInSettingFilter = false;
            }
        },

        GetFilterExpression: function () {
            var that = this;

            var filterExpression = "";

            var fromDate = that._FromDateControl.GetValue();
            if (!ValueIsEmpty(fromDate)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("{0} >= '{1}'", that._FromDateFieldName, fromDate);
            }

            var toDate = that._ToDateControl.GetValue();
            if (!ValueIsEmpty(toDate)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("{0} <= '{1}'", that._ToDateFieldName, toDate);
            }

            var fromDocNo = that._FromDocNoTextBox.GetValue();
            if (!ValueIsEmpty(fromDocNo)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("{0} >= '{1}'", that._FromDocNoFieldName, fromDocNo);
            }

            var toDocNo = that._ToDocNoTextBox.GetValue();
            if (!ValueIsEmpty(toDocNo)) {
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("{0} <= '{1}'", that._ToDocNoFieldName, toDocNo);
            }

            var isTransferred = that._TransferStatusComboBox.GetValue();
            if (!ValueIsEmpty(isTransferred) && isTransferred != "All") {
                if (isTransferred == "TransferredDocs")
                    isTransferred = 1;
                else {
                    isTransferred = 0;
                    that._TransferStatusComboBox.SetValue("NotTransferredDocs");
                }
                if (!ValueIsEmpty(filterExpression))
                    filterExpression += " and ";
                filterExpression += String.Format("{0} = {1}", that._IsTransferredFieldName, isTransferred);
            }

            //var transferDatabaseID = that._TransferDatabaseComboBox.GetValue();
            //if (!ValueIsEmpty(transferDatabaseID)) {
            //    if (!ValueIsEmpty(filterExpression))
            //        filterExpression += " and ";
            //    filterExpression += String.Format("{0} = '{1}'", that._TransferDatabaseFielName, transferDatabaseID);
            //}

            return filterExpression;
        },

        ResetFilters: function () {
            var that = this;

            that._IsInSettingFilter = true;
            try {
                that._ToDateControl.SetValue(null);
                that._FromDocNoTextBox.SetValue(null);
                that._ToDocNoTextBox.SetValue(null);
                that._FromDateControl.SetValue(null);
                that._TransferStatusComboBox.SetValue(null);
                that._TransferDatabaseComboBox.SetValue(null);
            }
            finally {
                that._IsInSettingFilter = false;
            }

            that._OnFilterChanged();
        },
    });

    //Static Members:

    FormClass.TypeName = typeName;
    FormClass.BaseType = baseType;
    FormClass.Events = events;

    acc.GhateiYaMovaghatNemodaneAsnadFormFilterControl = FormClass;
})();