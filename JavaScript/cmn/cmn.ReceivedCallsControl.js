(function () {
    var typeName = "cmn.ReceivedCallsControl";
    var baseType = afw.DataListControl;
    var events = afw.DataListControl.Events.concat([]);

    var ReceivedCallsControl = baseType.extend({
        events: events,

        GetType: function () {
            return cmn.ReceivedCallsControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "cmn.ReceivedCalls";
            afw.DataListControl.fn.init.call(that, options);

            that._VDockPanel.SetPaneSizeSetting(2, 50);
            that._QuickSearchDockPanel = that.FindControl(that.GetName() + "_QuickSearchDockPanel");
            that._QuickSearchDockPanel.AppendPane();
            that._QuickSearchDockPanel.SetPaneSizeSetting(0, 300);
            that._QuickSearchDockPanel.SetPaneSizeSetting(1, "fill");

            that._FilterControl = afw.uiApi.CreateSavedFormByName(
                that._QuickSearchDockPanel.Panes[1], "cmn.Filtering2Control",
                {
                    Name: "FilteringControl",
                    FromDate: "cast(GregorianCallDate as date)",
                    ToDate: "cast(GregorianCallDate as date)"
                });

            that._FilterControl.bind("FilterChanged", function (e) { that._FilterControl_FilterChanged(e); });

            that.LoadData();

            that._EntitiesGridView.bind("SelectedRowsChanged", function (e) { that._EntitiesGridView_SelectedRowsChanged(e) });
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);

            that.toolbar = that.FindControl(that.GetName() + "_Toolbar");
            that.toolbar.RemoveButton("New");
            that.toolbar.RemoveButton("Edit");
            that.toolbar.RemoveButton("Delete");

            //that.toolbar.AddButton("DetectSelectedCall", "شناسایی مجدد تماس انتخاب شده");
            //that.toolbar.AddButton("DetectAllUndetectedCalls", "شناسایی کلیه تماس های شناسایی نشده");
            that.toolbar.AddButton("CreatePerson", "ایجاد شخص", { Image: "resource(cmn.Add)" });
            that.toolbar.AddButton("SelectPerson", "انتخاب شخص", { Image: "resource(cmn.CustomerIcon)" });
            that.toolbar.AddButton("DetermineRelatedSalesCaseAndCreateActivity", "تعیین پرونده مرتبط و ایجاد فعالیت");
            that.toolbar.AddButton("DeleteCreatedActivity", "حذف فعالیت از پرونده", { Image: "resource(afw.ToolbarRedCross16)" });
            that.toolbar.AddButton("SetRelatedContract", "تعیین قرارداد مرتبط");
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);

            if (buttonKey == "DetectSelectedCall") {

                var selectedReceivedCallEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedReceivedCallEntities == 0) {
                    afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
                }
                else {
                    that._ReceivedCallID = selectedReceivedCallEntities[0].DataItem["ID"];
                    var callNumberField = selectedReceivedCallEntities[0].DataItem["CallNumber"];

                    afw.uiApi.CallServerMethodSync("cmn.DetectReceivedCallPerson", [that._ReceivedCallID, callNumberField]);

                    that._LoadData();
                }
            }
            else if (buttonKey == "DetectAllUndetectedCalls") {

                //afw.uiApi.ShowProgress(that);
                //afw.uiApi.CallServerMethodAsync("cmn.DetectUndetectedCalls", [null, null, null, null],
                //    function (result) {
                //        afw.uiApi.HideProgress(that);
                //        if (result.HasError) {
                //            afw.Application.HandleError(result.ErrorMessage);
                //        }
                //        else {
                //            if (!that.IsDestroying) {
                //                afw.MessageDialog.Show("شناسایی تماس ها با موفقیت انجام گردید.");
                //            }
                //        }
                //    });

                //that._LoadData(); 
            }
            else if (buttonKey == "CreatePerson") {
                var selectedReceivedCallEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedReceivedCallEntities == 0) {
                    afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
                }
                else {
                    if (selectedReceivedCallEntities[0].DataItem["CallPerson"] == null) {

                        that._ReceivedCallID = selectedReceivedCallEntities[0].DataItem["ID"];
                        var callNumberField = selectedReceivedCallEntities[0].DataItem["CallNumber"];

                        var personEntity = afw.uiApi.CreateNewEntity("cmn.Person");
                        personEntity.SetFieldValue("TelNumber1", callNumberField);

                        var personWindow = null;

                        if (cmn.OpenWindowExists())
                            personWindow = afw.EntityHelper.OpenEntityFormInWindow(personEntity, "cmn.PersonEditForm", "New", { Title: "ایجاد شخص" });
                        else
                            personWindow = afw.EntityHelper.OpenEntityFormInMdiContainer(personEntity, "cmn.PersonEditForm", "New", { Title: "ایجاد شخص" });

                        personWindow.bind("Close", function (e) { that._callRelatedWindows_Close(e); });
                    }
                    else
                        afw.MessageDialog.Show("برای این تماس نمیتوانید شخص ایجاد کنید.");
                }
            }
            else if (buttonKey == "SelectPerson") {

                var selectedReceivedCallEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedReceivedCallEntities == 0) {
                    afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
                }
                else {
                    that._ReceivedCallID = selectedReceivedCallEntities[0].DataItem["ID"];
                    var receivedCallEntity = afw.uiApi.FetchEntity("cmn.ReceivedCall", String.Format("ID = '{0}'", that._ReceivedCallID));

                    var receivedCallWindow = afw.uiApi.OpenSavedFormWindow("cmn.ReceivedCallEditForm", { Name: "ReceivedCallEditFormWindowForPerson", Modal: true, FormMode: "Edit", Entity: receivedCallEntity });
                    receivedCallWindow.SetTitle("انتخاب شخص");
                    receivedCallWindow.bind("Opened",
                           function (e) {
                               e.Sender.SetSize(500, 250);
                               e.Sender.Center();
                           });

                    receivedCallWindow.bind("Close", function (e) { that._callRelatedWindows_Close(e); });
                }
            }
            else if (buttonKey == "DetermineRelatedSalesCaseAndCreateActivity") {
                var selectedReceivedCallEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedReceivedCallEntities == 0) {
                    afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
                }
                else {
                    if (selectedReceivedCallEntities[0].DataItem["CallPerson"] != null) {
                        that._ReceivedCallID = selectedReceivedCallEntities[0].DataItem["ID"];
                        that._CallPersonID = selectedReceivedCallEntities[0].DataItem["CallPerson"];

                        that._salesCaseEntityList = afw.uiApi.CallServerMethodSync("cmn.GetPersonRelatedSalesCases", [that._CallPersonID]);

                        if (that._salesCaseEntityList.Entities.length == 1) {
                            var activityEntity = afw.uiApi.CreateNewEntity("cmn.Activity");
                            activityEntity.SetFieldValue("SalesCase", that._salesCaseEntityList.Entities[0].GetFieldValue("ID"));

                            var activityStatusID = afw.OptionSetHelper.GetOptionSetItemID("cmn.ActivityStatuses.Completed");
                            activityEntity.SetFieldValue("ActivityStatus", activityStatusID);
                            var activityTypeID = afw.OptionSetHelper.GetOptionSetItemID("cmn.ActivityTypes.IncommingCall");
                            activityEntity.SetFieldValue("ActivityType", activityTypeID);

                            var activityWindow = afw.uiApi.OpenSavedFormWindow("cmn.ActivityEditForm", { Name: "ActivityEditForm", Modal: true, FormMode: "New", Entity: activityEntity });
                            activityWindow.SetTitle("ثبت فعالیت");
                            activityWindow.bind("Opened",
                                   function (e) {
                                       e.Sender.SetSize(900, 765);
                                       e.Sender.Center();
                                   });

                            activityWindow.bind("Close", function (e) { that._activityWindow_Close(e); });
                        }
                        else if (that._salesCaseEntityList.Entities.length == 0 || that._salesCaseEntityList.Entities.length > 1) {

                            var salesCaseSelectWindow = afw.uiApi.OpenSavedFormWindow(
                                "cmn.ReceivedCallSalesCaseSelectWindow",
                                {
                                    Name: "ReceivedCallSalesCaseSelectWindow",
                                    Modal: true,
                                    CallPersonID: that._CallPersonID,
                                    ReceivedCallID: that._ReceivedCallID,
                                    Width: 10000,
                                    Height: 800
                                });
                            salesCaseSelectWindow.SetTitle("لیست پرونده های فروش");
                            salesCaseSelectWindow.bind("Opened",
                                   function (e) {
                                       e.Sender.Center();
                                   });

                            salesCaseSelectWindow.bind("Close", function (e) { that._receivedCallSalesCaseSelectWindow_Close(e); });
                        }

                    }
                    else
                        afw.MessageDialog.Show("برای این تماس ابتدا باید یک شخص انتخاب کرده و یا ایجاد کنید و سپس یک فعالیت ایجاد کنید.");
                }
            }
            else if (buttonKey == "DeleteCreatedActivity") {

                var selectedReceivedCallEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedReceivedCallEntities == 0) {
                    afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
                }
                else {
                    that._ReceivedCallID = selectedReceivedCallEntities[0].DataItem["ID"];

                    afw.uiApi.CallServerMethodSync("cmn.DeleteReceivedCallCreatedActivity", [that._ReceivedCallID]);

                    that._LoadData();
                }
            }
            else if (buttonKey == "SetRelatedContract") {
                var selectedReceivedCallEntities = that._EntitiesGridView.GetSelectedRows();
                if (selectedReceivedCallEntities == 0) {
                    afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
                    return;
                }

                if (selectedReceivedCallEntities[0].DataItem["CallPerson"] == null) {
                    afw.MessageDialog.Show("شخص تماس گیرنده مشخص نشده است.");
                    return;
                }

                that._ReceivedCallID = selectedReceivedCallEntities[0].DataItem["ID"];
                that._CallPersonID = selectedReceivedCallEntities[0].DataItem["CallPerson"];

                that._ContractsEntityList = afw.uiApi.CallServerMethodSync("cmn.GetPersonRelatedContracts", [that._CallPersonID]);

                if (that._ContractsEntityList.Entities.length == 1) {
                    try {
                        afw.uiApi.CallServerMethodSync("cmn.SetReceivedCallRelatedContract",
                            [that._ReceivedCallID, that._ContractsEntityList.Entities[0].GetFieldValue("ID")]);
                        that._LoadData();
                    }
                    catch (ex) {
                        afw.ErrorDialog.Show(ex);
                    }
                }
                else if (that._ContractsEntityList.Entities.length == 0 || that._ContractsEntityList.Entities.length > 1) {
                    var receivedCallContractSelectWindow = afw.uiApi.OpenSavedFormWindow("cmn.ReceivedCallContractSelectWindow",
                        {
                            Name: "ReceivedCallContractSelectWindow",
                            Modal: true,
                            callPerson_ID: that._CallPersonID,
                            receivedCall_ID: that._ReceivedCallID,
                            Width: 10000,
                            Height: 800
                        });

                    receivedCallContractSelectWindow.SetTitle("لیست قراردادها");
                    receivedCallContractSelectWindow.bind("Opened",
                            function (e) {
                                e.Sender.Center();
                            });

                    receivedCallContractSelectWindow.bind("Close", function (e) { that._receivedCallContractSelectWindow_Close(e); });
                }
            }
        },

        _activityWindow_Close: function (e) {
            var that = this;
            if (e.Sender._DialogResult == "Ok") {
                var activity = e.Sender._BindableEntity;
                try {
                    afw.uiApi.CallServerMethodSync("cmn.SetReceivedCallSalesCaseActivity", [that._ReceivedCallID, activity.get("ID")]);
                    that._LoadData();
                }
                catch (ex) {
                    afw.ErrorDialog.Show(ex);
                }
            }
        },

        _receivedCallSalesCaseSelectWindow_Close: function (e) {
            var that = this;
            if (e.Sender._DialogResult == "Ok")
                that._LoadData();
        },

        _receivedCallContractSelectWindow_Close: function (e) {
            var that = this;
            if (e.Sender._DialogResult == "Ok") {
                that._LoadData();
            }
        },

        _callRelatedWindows_Close: function (e) {
            var that = this;
            if (e.Sender._DialogResult == "Ok")
                that._LoadData();
        },

        _FilterControl_FilterChanged: function (e) {
            var that = this;

            that.LoadData();
        },

        _GetTotalFilterExpression: function () {
            var that = this;

            var filter = afw.DataListControl.fn._GetTotalFilterExpression.call(that);

            var filterExpression = that._FilterControl.GetFilterExpression();
            if (that._FilterControl != null && !ValueIsEmpty(filterExpression)) {
                if (!ValueIsEmpty(filter))
                    filter += " and ";
                filter += filterExpression;
            }

            return filter;
        },

        _LoadData: function () {
            var that = this;

            if (that._FilterControl == null)
                return;

            afw.DataListControl.fn._LoadData.call(that);
        },

        _OnLoadingData: function () {
            var that = this;

            var filterExpression = that._GetTotalFilterExpression();
            var sortExpression = that.GetSortExpression();
            var pager = that.FindControl(that.GetName() + "_Pager");
            var startRecordNumber = ((pager.GetCurrentPageNumber() - 1) * pager.GetPageSize()) + 1;

            afw.uiApi.ShowProgress(that);
            afw.uiApi.CallServerMethodAsync("cmn.DetectUndetectedCalls", [filterExpression, sortExpression, startRecordNumber, pager.GetPageSize()],
                function (result) {
                    afw.uiApi.HideProgress(that);
                    if (result.HasError) {
                        afw.Application.HandleError(result.ErrorMessage);
                    }
                    else {
                        if (!that.IsDestroying) {
                            afw.DataListControl.fn._OnLoadingData.call(that);
                        }
                    }
                });
        },

        _ShowEntityWindow: function (entity, formMode) {
            var that = this;

            afw.DataListControl.fn._ShowEntityWindow.call(that, entity, formMode);
        },

        _OnEntityWindowOpened: function (entityWindow) {
            var that = this;

            afw.DataListControl.fn._OnEntityWindowOpened.call(that, entityWindow);
        },

        _EntitiesGridView_RowDoubleClick: function (e) {
            var that = this;

            //afw.DataListControl.fn._EntitiesGridView_RowDoubleClick.call(that, e);
        },

        _EntitiesGridView_SelectedRowsChanged: function (e) {
            var that = this;

            that.toolbar.SetButtonEnabled("DetermineRelatedSalesCaseAndCreateActivity",
                e.SelectedRows.length != 0 && e.SelectedRows[0].DataItem["CreatedActivity"] == null);
            that.toolbar.SetButtonEnabled("DeleteCreatedActivity",
                e.SelectedRows.length != 0 && e.SelectedRows[0].DataItem["CreatedActivity"] != null);
        }

    });

    //Static Members:

    ReceivedCallsControl.TypeName = typeName;
    ReceivedCallsControl.BaseType = baseType;
    ReceivedCallsControl.Events = events;


    cmn.ReceivedCallsControl = ReceivedCallsControl;
})();