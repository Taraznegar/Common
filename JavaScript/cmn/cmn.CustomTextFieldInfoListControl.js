(function () {
    var typeName = "cmn.CustomTextFieldInfoListControl";
    var baseType = afw.DataListControl;
    var objectEvents = afw.DataListControl.Events.concat([]);

    var CustomTextFieldInfoListControl = baseType.extend({
        events: objectEvents,

        GetType: function () {
            return cmn.CustomTextFieldInfoListControl;
        },

        init: function (options) {
            var that = this;

            options.DataListFullName = "cmn.CustomTextFieldInfoList";
            afw.DataListControl.fn.init.call(that, options);

            if ("EntityFullName" in options)
                that._EntityFullName = options.EntityFullName
        },

        _OnCreatingColumn: function (columnInfo) {
        },

        _CreateToolbar: function () {
            var that = this;

            afw.DataListControl.fn._CreateToolbar.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            if (buttonKey == "New") {
                var count = afw.DataListHelper.GetDataListEntityCount("cmn.CustomTextFieldInfoList", null, null, 
                    String.Format("EntityFullName = '{0}' ", that._EntityFullName));

                if (count == 10) {
                    afw.ErrorDialog.Show("حداکثر تعداد فیلدهای سفارشی ده عدد است.");
                    return;
                }
                else {
                    var customTextFieldInfoEntity = afw.uiApi.CreateNewEntity("cmn.CustomTextFieldInfo");
                    customTextFieldInfoEntity.SetFieldValue("EntityFullName", that._EntityFullName);
                    customTextFieldInfoEntity.SetFieldValue("FieldNumber", count + 1);

                    var customTextFieldInfoEditForm = afw.uiApi.OpenSavedFormWindow("cmn.CustomTextFieldInfoEditForm", {
                        Name: "CustomTextFieldInfoEditForm",
                        FormMode: "New",
                        Modal: true,
                        Title: "فیلد سفارشی پیش فاکتور و فاکتور فروش",
                        Entity: customTextFieldInfoEntity,
                    });

                    customTextFieldInfoEditForm.Center();

                    customTextFieldInfoEditForm.bind("Close",
                        function (e) {
                            that.LoadData();
                        });
                }
            }
            else if (buttonKey == "Delete") {

                if (that.GetEntitiesGridView().GetSelectedRows() != null) {
                    var selectedEntities = that.GetEntitiesGridView().GetSelectedRows();

                    if (selectedEntities.length == 0) {
                        afw.ErrorDialog.Show('ابتدا یک سطر را انتخاب نمایید.');
                        return;
                    }
                    else {
                        var confirmDialog = afw.ConfirmDialog.Show("آیا اطلاعات ثبت شده در فیلد حذف شود؟");

                        confirmDialog.bind("Opened", function (e) {
                            e.Sender.FindControl("Button2").Focus(); //focus on no
                        });

                        confirmDialog.bind("Close", function (e) {
                            if (confirmDialog.GetDialogResult() == "Yes") {
                                afw.uiApi.CallServerMethodAsync("cmn.DeleteCustomTextFieldInfo", [selectedEntities[0].DataItem["ID"], true],
                                    function (result) {
                                        if (that._IsDestroying)
                                            return;

                                        afw.uiApi.HideProgress(that);
                                        if (result.HasError)
                                            afw.ErrorDialog.Show(result.ErrorMessage);
                                        else {
                                            that.LoadData();
                                        }
                                    });
                            }
                            else {
                                afw.uiApi.CallServerMethodAsync("cmn.DeleteCustomTextFieldInfo", [selectedEntities[0].DataItem["ID"], false],
                                    function (result) {
                                        if (that._IsDestroying)
                                            return;

                                        afw.uiApi.HideProgress(that);
                                        if (result.HasError)
                                            afw.ErrorDialog.Show(result.ErrorMessage);
                                        else {
                                            that.LoadData();
                                        }
                                    });
                            }
                        });
                    }
                }
            }
            else
                afw.DataListControl.fn._OnToolbarButtonClicked.call(that, buttonKey);
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

    CustomTextFieldInfoListControl.TypeName = typeName;
    CustomTextFieldInfoListControl.BaseType = baseType;
    CustomTextFieldInfoListControl.Events = objectEvents;


    cmn.CustomTextFieldInfoListControl = CustomTextFieldInfoListControl;
})();
