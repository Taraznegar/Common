(function () {
    var typeName = "cmn.Filtering2Control";
    var baseType = afw.BasePanel;
    var events = baseType.Events.concat(["FilterChanged"]);

    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return cmn.Filtering2Control;
        },

        init: function (options) {
            var that = this;

            that._FinancialYearEntity = cmn.GetUserActiveFinancialYearEntity();

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._IsInSettingFilter = false;
             
            that._IsFinancialGroup = true;
            that._IsFromDate = true;
            that._IsToDate = true;
            that._IsCreatorUser = true;
            that._IsDocNo = true;
            that._IsMembershipFile = true;
            that._IsSerialNo = true;

            if ("FinancialGroup" in options)
                that._FinancialGroup = options.FinancialGroup;
            else
                that._FinancialGroup = "";

            if ("FromDate" in options)
                that._FromDate = options.FromDate;
            else
                that._FromDate = "";

            if ("ToDate" in options)
                that._ToDate = options.ToDate;
            else
                that._ToDate = "";
                
            if ("CreatorUser" in options)
                that._CreatorUser = options.CreatorUser;
            else
                that._CreatorUser = "";

            if ("DocNo" in options)
                that._DocNo = options.DocNo;
            else
                that._DocNo = "";

            if ("MembershipFile" in options)
                that._MembershipFile = options.MembershipFile;
            else
                that._MembershipFile = "";

            if ("SerialNo" in options)
                that._SerialNo = options.SerialNo;
            else
                that._SerialNo = "";
             
            var nowDateTime = afw.DateTimeHelper.GetServerDateTime();

            that._ItemDockPanel = that.FindControl("ItemDockPanel");

            that._FinancialGroupComboBox = that.FindControl("FinancialGroupComboBox");
            that._FromDateControl = that.FindControl("FromDateControl");
            that._ToDateControl = that.FindControl("ToDateControl");
            that._CreatorUserLookupControl = that.FindControl("CreatorUserLookupControl");
            that._DocNoTextBox = that.FindControl("DocNoTextBox");
            that._SerialNoTextBox = that.FindControl("SerialNoTextBox");
            that._MembershipFileLookupControl = that.FindControl("MembershipFileLookupControl");
             
            that.SetColumnSize();
             
            var financialGroups = afw.DataListHelper.FetchEntityListOfDataList("cmn.FinancialGroupList").ToDataSourceData();
            financialGroups.splice(0, 0, { ID: "All", Title: "همه" });
            that._FinancialGroupComboBox.SetItemsDataSource(financialGroups);
            that._FinancialGroupComboBox.SetValue(financialGroups[0].ID);

            var startDate = that._FinancialYearEntity.GetFieldValue("StartDate").split(' ')[0];
            that._FromDateControl.SetValue(startDate);

            var endDate = that._FinancialYearEntity.GetFieldValue("EndDate").split(' ')[0]; 
            that._ToDateControl.SetValue(endDate);

            that._CreatorUserLookupControl.SetBaseFilterExpression("");

            that._FinancialGroupComboBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            that._FromDateControl.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            that._ToDateControl.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            that._CreatorUserLookupControl.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            that._DocNoTextBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
            that._MembershipFileLookupControl.bind("ValueChanged", function (e) { that._OnFilterChanged(); }); 
            that._SerialNoTextBox.bind("ValueChanged", function (e) { that._OnFilterChanged(); });
        },

        SetColumnSize: function(){
            var that = this;
             
            if (that._FinancialGroup == "") {
                that._IsFinancialGroup = false;

                that._ItemDockPanel.SetPaneSizeSetting(0, 1);
                that._ItemDockPanel.SetPaneSizeSetting(1, 1);
                that._ItemDockPanel.SetPaneSizeSetting(2, 1);
            }
            if (that._FromDate == "") {
                that._IsFromDate = false;

                that._ItemDockPanel.SetPaneSizeSetting(3, 1);
                that._ItemDockPanel.SetPaneSizeSetting(4, 1);
                that._ItemDockPanel.SetPaneSizeSetting(5, 1);
            }
            if (that._ToDate == "") {
                that._IsToDate = false;

                that._ItemDockPanel.SetPaneSizeSetting(6, 1);
                that._ItemDockPanel.SetPaneSizeSetting(7, 1);
                that._ItemDockPanel.SetPaneSizeSetting(8, 1);
            }
            if (that._CreatorUser == "") {
                that._Is_CreatorUser = false;

                that._ItemDockPanel.SetPaneSizeSetting(9, 1);
                that._ItemDockPanel.SetPaneSizeSetting(10, 1);
                that._ItemDockPanel.SetPaneSizeSetting(11, 1);
            }
            if (that._DocNo == "") {
                that._IsDocNo = false;

                that._ItemDockPanel.SetPaneSizeSetting(12, 1);
                that._ItemDockPanel.SetPaneSizeSetting(13, 1);
                that._ItemDockPanel.SetPaneSizeSetting(14, 1);
            }
            if (that._MembershipFile == "") {
                that._IsMembershipFile = false;

                that._ItemDockPanel.SetPaneSizeSetting(15, 1);
                that._ItemDockPanel.SetPaneSizeSetting(16, 1);
                that._ItemDockPanel.SetPaneSizeSetting(17, 1);
            }
            if (that._SerialNo == "") {
                that._IsSerialNo = false;

                that._ItemDockPanel.SetPaneSizeSetting(18, 1);
                that._ItemDockPanel.SetPaneSizeSetting(19, 1);
                that._ItemDockPanel.SetPaneSizeSetting(20, 1);
            }  
        },

        SetFilters: function (filterNameValues) {
            var that = this;

            that._IsInSettingFilter = true;
            try {
                if (that._IsFinancialGroup == true) {
                    if ("FinancialGroup" in filterNameValues) {
                        that._FinancialGroupComboBox.SetValue(filterNameValues.FinancialGroup);
                    }
                }
                if (that._IsFromDate == true) {
                    if ("FromDate" in filterNameValues) {
                        that._FromDateControl.SetValue(filterNameValues.FromDate);
                    }
                }
                if (that._IsToDate == true) {
                    if ("ToDate" in filterNameValues) {
                        that._ToDateControl.SetValue(filterNameValues.ToDate);
                    }
                }
                if (that._IsCreatorUser == true) {
                    if ("CreatorUser" in filterNameValues) {
                        that._CreatorUserLookupControl.SetValue(filterNameValues.CreatorUser);
                    }
                }
                if (that._IsDocNo == true) {
                    if ("DocNo" in filterNameValues) {
                        that._DocNoTextBox.SetValue(filterNameValues.DocNo);
                    }
                }
                if (that._IsMembershipFile == true) {
                    if ("MembershipFile" in filterNameValues) {
                        that._MembershipFileLookupControl.SetValue(filterNameValues.MembershipFile);
                    }
                }
                if (that._IsSerialNo == true) {
                    if ("SerialNo" in filterNameValues) {
                        that._SerialNoTextBox.SetValue(filterNameValues.SerialNo);
                    }
                }
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

            if (that._IsFinancialGroup == true) {
                var financialGroup = that._FinancialGroupComboBox.GetValue();
                if (financialGroup != null && financialGroup != "All") {
                    if (!ValueIsEmpty(filterExpression))
                        filterExpression += " and ";
                    filterExpression = String.Format("FinancialGroup = '{0}'", financialGroup);
                }
            }
            if (that._IsFromDate == true) {
                var fromDate = that._FromDateControl.GetValue();
                if (fromDate != null) {
                    if (!ValueIsEmpty(filterExpression))
                        filterExpression += " and ";
                    filterExpression += String.Format("{0} >= '{1}'",that._FromDate, fromDate);
                }
            }
            if (that._IsToDate == true) {
                var toDate = that._ToDateControl.GetValue();
                if (toDate != null) {
                    if (!ValueIsEmpty(filterExpression))
                        filterExpression += " and ";
                    filterExpression += String.Format("{0} <= '{1}'", that._ToDate, toDate);
                }
            }
            if (that._IsCreatorUser == true) {
                var creatorUser = that._CreatorUserLookupControl.GetValue();
                if (creatorUser != null) {
                    if (!ValueIsEmpty(filterExpression))
                        filterExpression += " and ";
                    filterExpression += String.Format("{0} = '{1}'", that._CreatorUser, creatorUser);
                }
            }
            if (that._IsDocNo == true) {
                var docNo = that._DocNoTextBox.GetValue();
                if (docNo != null) {
                    if (!ValueIsEmpty(filterExpression))
                        filterExpression += " and ";
                    filterExpression += String.Format("{0} = '{1}'", that._DocNo, docNo);
                }
            }
            if (that._IsMembershipFile == true) {
                var membershipFile = that._MembershipFileLookupControl.GetValue();
                if (membershipFile != null) {
                    if (!ValueIsEmpty(filterExpression))
                        filterExpression += " and ";
                    filterExpression += String.Format("{0} = '{1}'", that._MembershipFile, membershipFile);
                }
            }
            if (that._IsSerialNo == true) {
                var serialNo = that._SerialNoTextBox.GetValue();
                if (serialNo != null) {
                    if (!ValueIsEmpty(filterExpression))
                        filterExpression += " and ";
                    filterExpression += String.Format("{0} = {1}", that._SerialNo, serialNo);
                }
            }
            return filterExpression;
        }
    });

    //Static Members:

    FormClass.TypeName = typeName;
    FormClass.BaseType = baseType;
    FormClass.Events = events;

    cmn.Filtering2Control = FormClass;
})();