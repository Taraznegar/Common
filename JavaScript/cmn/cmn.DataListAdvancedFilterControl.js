(function () {
    var objectEvents = afw.BasePanel.Events.concat(["FilterChanged", "GetColumnFilterExpression"]);

    var FormClass = afw.BasePanel.extend({
        events: objectEvents,

        GetType: function () {
            return cmn.DataListAdvancedFilterControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);
            
            that._FieldsDocPanel = that.FindControl("FieldsDocPanel");
            that._ValuesDocPanel = that.FindControl("ValuesDocPanel");

            if ("InitialFilterColumnsSizeSetting" in options)
                that._InitialFilterColumnsSizeSetting = options.InitialFilterColumnsSizeSetting;
            else
                that._InitialFilterColumnsSizeSetting = "16%";

            if ("InitialFilterColumnsCount" in options && !ValueIsEmpty("InitialFilterColumnsCount"))
                that._FilterColumnsCount = options.InitialFilterColumnsCount;
            else
                that._FilterColumnsCount = 6;

            that._FilterChangedEventIsEnabled = true;
            that._ShowAddOrRemoveFilterButtons = true;

            if ("ColumnsFilterInfo" in options)
                that._ColumnsFilterInfo = options.ColumnsFilterInfo;
            else
                throw String.Format("{0}.ColumnsFilterInfo is not set.", that.GetName());

            if ("ShowAddOrRemoveFilterButtons" in options)
                that._ShowAddOrRemoveFilterButtons = options.ShowAddOrRemoveFilterButtons;

            if (that._ShowAddOrRemoveFilterButtons == false) {
                that.FindControl("MainDockPanel").SetPaneSizeSetting(1, 1);
                that.FindControl("MainDockPanel").SetPaneSizeSetting(2, 1);
            }
            else {
                that._AddFilterComboBoxButton = that.FindControl("AddFilterComboBoxButton");
                that._RemoveFilterComboBoxButton = that.FindControl("RemoveFilterComboBoxButton");
                that._ResetFiltersButton = that.FindControl("ResetFiltersButton");

                that._AddFilterComboBoxButton.bind("Click", function (e) { that._AddFilterComboBoxButton_Clicked(e); });
                that._RemoveFilterComboBoxButton.bind("Click", function (e) { that._RemoveFilterComboBoxButton_Clicked(e); });
                that._ResetFiltersButton.bind("Click", function (e) { that.ResetFilters(); });
            }

            if (that._ColumnsFilterInfo.length < that._FilterColumnsCount)
                that._FilterColumnsCount = that._ColumnsFilterInfo.length;

            for (var i = 0; i < that._ColumnsFilterInfo.length; i++) {
                var columnsFilterInfo = that._ColumnsFilterInfo[i];

                columnsFilterInfo.ID = columnsFilterInfo.FieldName
                    + "_" + that._GetCompareOperatorName(columnsFilterInfo.CompareOperator);
            }

            that._ColumnsFilterInfo.splice(0, 0, { ID: "__Nothing", Title: " " });

            for (var i = 0; i < that._FilterColumnsCount; i++) {
                that._FieldsDocPanel.AppendPane();
                that._ValuesDocPanel.AppendPane();

                var fieldSelectionComboBoxList = new afw.ComboBox({
                    ParentControl: that._FieldsDocPanel.Panes[i],
                    Name: "FieldSelectionComboBoxList" + i,
                    Visible: true,
                    LabelVisible: false,
                    DataTextField: "Title",
                    DataValueField: "ID"
                });

                fieldSelectionComboBoxList.SetItemsDataSource(that._ColumnsFilterInfo);
                fieldSelectionComboBoxList.bind("ValueChanged", function (e) { that._FieldSelectionComboBoxList_ValueChanged(e); });
                fieldSelectionComboBoxList.SetValue(that._ColumnsFilterInfo[i + 1].ID);

                if (that._ColumnsFilterInfo[i + 1].IsFixed)
                    fieldSelectionComboBoxList.SetReadOnly(true);

            }

            that._AdjustFilterColumnsSize();
        },

        _GetColumnFilterInfoByID: function (columnFilterInfoID) {
            var that = this;

            var index = that._ColumnsFilterInfo.map(function (columnFilterInfo) { return columnFilterInfo.ID; }).indexOf(columnFilterInfoID);
            return that._ColumnsFilterInfo[index];
        },

        _GetColumnFilterInfoByName: function (columnFilterInfoName) {
            var that = this;

            var index = that._ColumnsFilterInfo.map(function (columnFilterInfo) { return columnFilterInfo.FieldName; }).indexOf(columnFilterInfoName);
            return that._ColumnsFilterInfo[index];
        },

        _OnGetColumnFilterExpression: function (eventArgs) {
            var that = this;

            if (that._events != null)
                that.trigger("GetColumnFilterExpression", eventArgs);
        },

        _GetColumnFilterExpression: function (columnFilterInfo, filterValueControl) {
            var that = this;

            var filterExpression = null;

            //developer can set filterExpression of column by 'GetColumnFilterExpression' event handler
            //else, system will get it

            var eventArgs = {
                Sender: that,
                ColumnFilterInfo: columnFilterInfo,
                FilterValueControl: filterValueControl,
                FilterExpression: null
            };

            that._OnGetColumnFilterExpression(eventArgs);
            filterExpression = eventArgs.FilterExpression;

            if (filterExpression != null)
                return filterExpression;

            var filterValue = filterValueControl.GetValue();

            if (ValueIsEmpty(filterValue))
                return null;
                    
            if (!ValueIsEmpty(columnFilterInfo.ComboBoxItems)) {
                if (!that._ValueExistsInDataSource(filterValue, columnFilterInfo.ComboBoxItems)) {
                    afw.ErrorDialog.Show(String.Format("مقدار {0} در فیلتر {1} نامعتبر است.", filterValue, columnFilterInfo.Title));
                    return null;
                }
            }

            if (ValueIsEmpty(columnFilterInfo.CompareOperator))
                filterExpression = String.Format(" {0} = N'{1}' ", columnFilterInfo.FieldName, filterValue);
            else if (columnFilterInfo.CompareOperator.toLowerCase() == "like")
                filterExpression = String.Format("{0} like N'%{1}%'", columnFilterInfo.FieldName, filterValue);
            else
                filterExpression = String.Format("{0} {1} '{2}'",
                    columnFilterInfo.FieldName, columnFilterInfo.CompareOperator, filterValue);

            return filterExpression;
        },

        GetFilterExpression: function () {
            var that = this;

            var filterExpression = "";

            for (var i = 0; i < that._FilterColumnsCount; i++) {
                var fieldSelectionComboBoxList = that.FindControl("FieldSelectionComboBoxList" + i);
                var fieldID = fieldSelectionComboBoxList.GetValue();

                if (!ValueIsEmpty(fieldID) && fieldID != "__Nothing") {
                    var columnFilterInfo = that._GetColumnFilterInfoByID(fieldID);

                    if (columnFilterInfo.FilterType != "Parameter") {
                        var valueControl = that.FindControl(columnFilterInfo.ID);

                        var columnFilterExpression = that._GetColumnFilterExpression(columnFilterInfo, valueControl);

                        if (!ValueIsEmpty(columnFilterExpression)) {
                            if (!ValueIsEmpty(filterExpression))
                                filterExpression += " and ";

                            filterExpression += columnFilterExpression;
                        }
                    }
                }
            }

            return filterExpression;
        },

        GetParameters: function (addAtsignToParameterNames, convertNullValuesToNullString) {
            var that = this;

            if (ValueIsEmpty(addAtsignToParameterNames))
                addAtsignToParameterNames = true;

            if (ValueIsEmpty(convertNullValuesToNullString))
                convertNullValuesToNullString = true;

            var parameterNames = [];
            var parameterValues = [];

            for (var i = 0; i < that._ColumnsFilterInfo.length ; i++) {
                var columnFilterInfo = that._ColumnsFilterInfo[i];

                if (columnFilterInfo.FilterType == "Parameter") {
                    var valueControl = that.FindControl(columnFilterInfo.ID);

                    var parameterName = columnFilterInfo.FieldName;
                    if (addAtsignToParameterNames)
                        parameterName = "@" + parameterName;

                    parameterNames.push(parameterName);


                    var parameterValue = null;

                    if (!ValueIsEmpty(valueControl)) {
                        if (!ValueIsEmpty(valueControl.GetValue()))
                            parameterValue = valueControl.GetValue();
                    }

                    if (parameterValue == null && convertNullValuesToNullString)
                        parameterValue = "null";

                    parameterValues.push(parameterValue);
                }
            }
            
            return {
                ParameterNames: parameterNames,
                ParameterValues: parameterValues
            };
        },

        ResetFilters: function () {
            var that = this;

            that._FilterChangedEventIsEnabled = false;
            try {
                for (var i = 0; i < that._FilterColumnsCount; i++)
                    that._DestroyFilterValueControlIfExists(i);
                for (var i = 0; i < that._FilterColumnsCount; i++) {
                    var fieldSelectionComboBoxList = that.FindControl("FieldSelectionComboBoxList" + i);

                    fieldSelectionComboBoxList.SetValue(that._ColumnsFilterInfo[0].ID);
                    fieldSelectionComboBoxList.SetValue(that._ColumnsFilterInfo[i + 1].ID);

                    if (!ValueIsEmpty(that._ColumnsFilterInfo[i + 1].DefaultValue)) {
                        var filterValueControl = that.FindControl(that._ColumnsFilterInfo[i + 1].ID);

                        if (!ValueIsEmpty(filterValueControl))
                            filterValueControl.SetValue(that._ColumnsFilterInfo[i + 1].DefaultValue);
                    }
                }
            }
            finally {
                that._FilterChangedEventIsEnabled = true;
            }

            that._OnFilterChanged();
        },

        SetColumnFilterValue: function (fieldName, fieldValue) {
            var that = this;

            var columnFilterInfo = that._GetColumnFilterInfoByName(fieldName);
            var filterControl = that.FindControl(columnFilterInfo.ID);
            filterControl.SetValue(fieldValue);

        },

        _OnFilterChanged: function () {
            var that = this;

            if (!that._FilterChangedEventIsEnabled)
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

        _FieldSelectionComboBoxList_ValueChanged: function (e) {
            var that = this;

            var fieldSelectionComboBoxList = e.Sender;
            var parentPaneIndex = fieldSelectionComboBoxList.GetName().Replace("FieldSelectionComboBoxList", "");

            that._DestroyFilterValueControlIfExists(parentPaneIndex);
            var columnFilterInfoID = fieldSelectionComboBoxList.GetValue();

            if (!ValueIsEmpty(columnFilterInfoID) && columnFilterInfoID != "__Nothing") {
                var columnFilterInfo = that._GetColumnFilterInfoByID(columnFilterInfoID);

                if (ValueIsEmpty(columnFilterInfo)) {
                    afw.ErrorDialog.Show(String.Format("فیلد نامعتبر است."));
                    //FieldSelectionComboBoxList.SetValue("__Nothing");
                    fieldSelectionComboBoxList.SetValue(null);
                }

                else if (that.FindControl(columnFilterInfo.ID) != null) {
                    afw.ErrorDialog.Show(String.Format("فیلد '{0}' قبلا انتخاب شده است.", columnFilterInfo.Title));
                    //FieldSelectionComboBoxList.SetValue("__Nothing");
                    fieldSelectionComboBoxList.SetValue(null);
                    return;
                }

                that._CreateFilterValueControl(columnFilterInfoID, parentPaneIndex);
            }
        },

        _AddFilterComboBoxButton_Clicked: function (e) {
            var that = this;

            var panelIndex = that._FieldsDocPanel.GetPanesCount();

            if (panelIndex >= that._ColumnsFilterInfo.length - 1)
                return;

            that._FieldsDocPanel.AppendPane();
            that._ValuesDocPanel.AppendPane();

            var fieldSelectionComboBoxList = new afw.ComboBox({
                ParentControl: that._FieldsDocPanel.Panes[panelIndex],
                Name: "FieldSelectionComboBoxList" + panelIndex,
                Visible: true,
                LabelVisible: false,
                DataTextField: "Title",
                DataValueField: "ID"
            });

            fieldSelectionComboBoxList.SetItemsDataSource(that._ColumnsFilterInfo);
            fieldSelectionComboBoxList.bind("ValueChanged", function (e) { that._FieldSelectionComboBoxList_ValueChanged(e); });
            fieldSelectionComboBoxList.SetValue(that._ColumnsFilterInfo[panelIndex + 1].ID);
            that._FilterColumnsCount++;
            that._AdjustFilterColumnsSize();
       },

        _RemoveFilterComboBoxButton_Clicked: function (e) {
            var that = this;

            var panIndex = that._ValuesDocPanel.GetPanesCount() - 1;

            if (panIndex < 0)
                return;

            while (ValueIsEmpty(that._ValuesDocPanel.Panes[panIndex]))
                panIndex--;

            var fieldSelectionComboBoxList = that.FindControl("FieldSelectionComboBoxList" + panIndex);

            if (!ValueIsEmpty(fieldSelectionComboBoxList)) {
                var fieldID = fieldSelectionComboBoxList.GetValue();
                var columnFilterInfo = that._GetColumnFilterInfoByID(fieldID);

                if (columnFilterInfo.IsFixed)
                    return;

                that._ValuesDocPanel.RemovePane(panIndex);
                that._FieldsDocPanel.RemovePane(panIndex);
                that._FilterColumnsCount--;
                that._AdjustFilterColumnsSize();
                that._OnFilterChanged();
            }
        },

        _AdjustFilterColumnsSize: function () {
            var that = this;

            if (that._FilterColumnsCount < 7 ) {
                for (var i = 0; i < that._FilterColumnsCount; i++) {
                    that._FieldsDocPanel.Panes[i].SetSizeSetting(that._InitialFilterColumnsSizeSetting);
                    that._ValuesDocPanel.Panes[i].SetSizeSetting(that._InitialFilterColumnsSizeSetting);
                }
            }
            else if (that._FilterColumnsCount == 7) {
                for (var i = 0; i < that._FilterColumnsCount; i++) {
                    that._FieldsDocPanel.Panes[i].SetSizeSetting("fill");
                    that._ValuesDocPanel.Panes[i].SetSizeSetting("fill");
                }
            }
        },

        _DestroyFilterValueControlIfExists: function (parentPaneIndex) {
            var that = this;

            if (that._ValuesDocPanel.Panes[parentPaneIndex].HasChildControls)
                that._ValuesDocPanel.Panes[parentPaneIndex].ChildControls[0].Destroy();
        },

        _GetCompareOperatorName: function (compareOperator) {
            if (ValueIsEmpty(compareOperator))
                return "IsEqual";
            else if (compareOperator == ">")
                return "IsMore";
            else if (compareOperator == ">=")
                return "IsMoreOrEqual";
            else if (compareOperator == "<")
                return "IsLess";
            else if (compareOperator == "<=")
                return "IsLessOrEqual";
            else if (compareOperator == "<>")
                return "NotEqual";
            else if (compareOperator.toLowerCase() == "like")
                return "IsLike";
            else if (compareOperator.toLowerCase() == "null")
                return "";
            else
                throw String.Format("compare operator {0} is not valid.", compareOperator);
        },

        _ValueExistsInDataSource: function (value, dataSource) {
            var that = this;

            for (var i = 0; i < dataSource.length; i++) {
                if (value == dataSource[i].ID)
                    return true;
            }
            return false;
        },
        //#region Creation of filter value controls:
        _CreateFilterValueControl: function (columnFilterInfoID, parentPaneIndex) {
            var that = this;

            if (that._ValuesDocPanel.Panes[parentPaneIndex].HasChildControls)
                throw String.Format("a control already exists at pane {0}", parentPaneIndex);

            that._IsMakingFilterValueControl = true;
            try {
                var columnFilterInfo = that._GetColumnFilterInfoByID(columnFilterInfoID);

                var filterValueControl = null;

                if (columnFilterInfo.ControlType == "TextBox")
                    filterValueControl = that._CreateTextBoxControl(columnFilterInfo, parentPaneIndex);
                else if (columnFilterInfo.ControlType == "Numeric")
                    filterValueControl = that._CreateNumericControl(columnFilterInfo, parentPaneIndex);
                else if (columnFilterInfo.ControlType == "Date")
                    filterValueControl = that._CreateDateControl(columnFilterInfo, parentPaneIndex);
                else if (columnFilterInfo.ControlType == "Time")
                    filterValueControl = that._CreateTimeControl(columnFilterInfo, parentPaneIndex);
                else if (columnFilterInfo.ControlType == "ComboBox")
                    filterValueControl = that._CreateComboBoxControl(columnFilterInfo, parentPaneIndex);
                else if (columnFilterInfo.ControlType == "DropDownList")
                    filterValueControl = that._CreateDropDownListControl(columnFilterInfo, parentPaneIndex);
                else if (columnFilterInfo.ControlType == "Lookup")
                    filterValueControl = that._CreateLookupControl(columnFilterInfo, parentPaneIndex);
                else if (columnFilterInfo.ControlType == "OptionSet")
                    filterValueControl = that._CreateOptionSetControl(columnFilterInfo, parentPaneIndex);
                else {
                    afw.ErrorDialog.Show(String.Format("Control type {0} is invalid.", columnFilterInfo.ControlType));
                    return;
                }

                if (!ValueIsEmpty(columnFilterInfo.DefaultValue))
                    filterValueControl.SetValue(columnFilterInfo.DefaultValue);

                filterValueControl.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            }
            finally {
                that._IsMakingFilterValueControl = false;
            }
        },

        _CreateDateControl: function (columnFilterInfo, parentPaneIndex) {
            var that = this;

            var dateControl = new afw.DateTimeControl({
                ParentControl: that._ValuesDocPanel.Panes[parentPaneIndex],
                Name: columnFilterInfo.ID,
                Visible: true,
                LabelVisible: false,
                Mode: "Date"
            });

            return dateControl;
        },

        _CreateTimeControl: function (columnFilterInfo, parentPaneIndex) {
            var that = this;

            var timeControl = new afw.DateTimeControl({
                ParentControl: that._ValuesDocPanel.Panes[parentPaneIndex],
                Name: columnFilterInfo.ID,
                Visible: true,
                LabelVisible: false,
                Mode: "Time"
            });

            return timeControl;
        },

        _CreateTextBoxControl: function (columnFilterInfo, parentPaneIndex) {
            var that = this;

            var textBox = new afw.TextBox({
                ParentControl: that._ValuesDocPanel.Panes[parentPaneIndex],
                Name: columnFilterInfo.ID,
                Visible: true,
                LabelVisible: false,
                Multiline: false
            });

            return textBox;
        },

        _CreateNumericControl: function (columnFilterInfo, parentPaneIndex) {
            var that = this;

            var numericTextBox = new afw.NumericTextBox({
                ParentControl: that._ValuesDocPanel.Panes[parentPaneIndex],
                Name: columnFilterInfo.ID,
                Visible: true,
                LabelVisible: false,
                Multiline: false
            });

            return numericTextBox;
        },

        _CreateComboBoxControl: function (columnFilterInfo, parentPaneIndex) {
            var that = this;

            var comboBox = new afw.ComboBox({
                ParentControl: that._ValuesDocPanel.Panes[parentPaneIndex],
                Name: columnFilterInfo.ID,
                Visible: true,
                LabelVisible: false,
                DataTextField: columnFilterInfo.ComboBoxDataTextField,
                DataValueField: columnFilterInfo.ComboBoxDataValueField
            });

            comboBox.SetItemsDataSource(columnFilterInfo.ComboBoxItems);

            return comboBox;
        },

        _CreateDropDownListControl: function (columnFilterInfo, parentPaneIndex) {
            var that = this;

            var dropDownList = new afw.DropDownList({
                ParentControl: that._ValuesDocPanel.Panes[parentPaneIndex],
                Name: columnFilterInfo.ID,
                Visible: true,
                LabelVisible: false,
                DataTextField: columnFilterInfo.DropDownListDataTextField,
                DataValueField: columnFilterInfo.DropDownListDataValueField
            });

            dropDownList.SetItemsDataSource(columnFilterInfo.DropDownListItems);
            return dropDownList;
        },

        _CreateLookupControl: function (columnFilterInfo, parentPaneIndex) {
            var that = this;

            var hasBrowseButtom = true;

            if (columnFilterInfo.LookupType == "Simple")
                hasBrowseButtom = false;

            var lookupControl = new afw.SingleEntityLookupControl({
                ParentControl: that._ValuesDocPanel.Panes[parentPaneIndex],
                Name: columnFilterInfo.ID,
                Visible: true,
                LabelVisible: false,
                ControlType: columnFilterInfo.LookupControlType,
                DataListFullName: columnFilterInfo.LookupDataListFullName,
                EntityCaptionFieldName: columnFilterInfo.LookupEntityCaptionFieldName,
                BaseFilterExpression: ValueIsEmpty(columnFilterInfo.BaseFilterExpression) ? "" : columnFilterInfo.BaseFilterExpression,
                HasEntityViewButton: false,
                HasEntityBrowseButton: hasBrowseButtom
            });

            return lookupControl;
        },

        _CreateCheckBoxControl: function (columnFilterInfo, parentPaneIndex) {
            var that = this;

            var checkBox = new afw.CheckBox({
                ParentControl: that._ValuesDocPanel.Panes[parentPaneIndex],
                Name: columnFilterInfo.ID,
                Visible: true,
                LabelVisible: false,
                Checked: true
            });

            return checkBox;
        },

        _CreateOptionSetControl: function (columnFilterInfo, parentPaneIndex) {
            var that = this;

            var optionSet = new afw.OptionSetControl({
                ParentControl: that._ValuesDocPanel.Panes[parentPaneIndex],
                Name: columnFilterInfo.ID,
                Visible: true,
                LabelVisible: false,
                Multiline: false,
                OptionSetFullName: columnFilterInfo.OptionSetFullName,
                ValueDataMember: columnFilterInfo.OptionSetValueDataMember
            });

            return optionSet;
        },
        //#endregion

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.DataListAdvancedFilterControl";
    FormClass.BaseType = afw.BasePanel;
    FormClass.Events = objectEvents;

    cmn.DataListAdvancedFilterControl = FormClass;
})();