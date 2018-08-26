(function () {
    var FormClass = afw.Window.extend({
        GetType: function () {
            return wm.StuffsSerialNumberEditForm;
        },

        init: function (options) {
            var that = this;

            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (formObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            that.Center();

            that._StuffSerialNumberGridView = null;
            that._GridPanel = that.FindControl("GridPanel");
            that._ToolBarPanel = that.FindControl("ToolBarPanel");
            that._FooterPanel = that.FindControl("FooterPanel");

            that._SerialNumberTextBox = that.FindControl("SerialNumberTextBox");

            that._SaveImageButton = that.FindControl("SaveImageButton");
            that._DeleteImageButton = that.FindControl("DeleteImageButton");
            that._CancelImageButton = that.FindControl("CancelImageButton");
            that._RemainingCountSerialNumberLabel = that.FindControl("RemainingCountSerialNumberLabel");
            that._RemainingCountSerialNumberLabel.SetText("تعداد شماره سریال ثبت نشده");

            that._SerialNumberTextBox.bind("KeyPressed", function (e) { that._SerialNumberTextBox_KeyPressed(e); });
            that._SaveImageButton.bind("Click", function (e) { that._ImageButton_Click("Modify"); });
            that._DeleteImageButton.bind("Click", function (e) { that._ImageButton_Click("Delete"); });
            that._CancelImageButton.bind("Click", function (e) { that._ImageButton_Click("Cancel"); });

            that._GhabzOrHavaleItemID = options.GhabzOrHavaleItemID;
            that._StuffQuantity = options.StuffQuantity;

            that.StuffSerialNumberEntityList = options.StuffSerialNumberEntityList;

            that._CreateToolbar();
            that._CreateGridView();
        },

        _CreateToolbar: function () {
            var that = this;

            var toolBar = new afw.ToolBar({
                ParentControl: that._ToolBarPanel,
                Name: "ToolBar",

            });

            toolBar.AddButton("GroupInsert", "ثبت گروهی", { TextColor: "White", BackgroundColor: "#4585f3" });
            toolBar.AddButton("Close", "بستن", { Image: "resource(afw.ToolbarRedCross16)" });
            toolBar.bind("ButtonClick", function (e) { that._OnToolbarButtonClicked(e); });
        },

        _OnToolbarButtonClicked: function (e) {
            var that = this;

            if (e.ButtonKey == "Close") {
                that.Close();
                return;
            }

            if (e.ButtonKey == "GroupInsert") {
                that._GroupInsertEditFormWindow = afw.uiApi.OpenSavedWindow("wm.GroupInsertEditForm", {
                    Name: "GroupInsertEditForm",
                    Modal: true,
                    FormMode: "New",
                    Title: "ثبت گروهی شماره سریال کالا ها",
                    GhabzOrHavaleItemID: that._GhabzOrHavaleItemID,
                    StuffQuantity: that._StuffQuantity,
                    StuffSerialNumberEntityList: that.StuffSerialNumberEntityList
                });

                that._RemainingCountSerialNumberLabel.SetText("تعداد شماره سریال ثبت نشده : " +
                (that._StuffQuantity.ToNumber() - that.StuffSerialNumberEntityList.Entities.length).toString() + " ");

                that._GroupInsertEditFormWindow.bind("Close", function (e) { that._GroupInsertEditFormWindow_Close(e); });
            }
        },


        _CreateGridView: function () {
            var that = this;

            var serialNumber = { title: "شماره سریال ", field: "SerialNumber", rightToLeft: true, width: 40 };

            var columns = [serialNumber];

            var gridView = that._GridPanel.FindControl("GridView");
            if (gridView != null)
                gridView.Destroy();

            that._StuffSerialNumberGridView = new afw.GridView({
                ParentControl: that._GridPanel,
                Name: "GridView",
                FillParent: true,
                Columns: columns,
                SelectionMode: "SingleRow"
            });

            //that.StuffSerialNumberEntityList = afw.uiApi.FetchEntityList("wm.StuffSerialNumber", String.Format("GhabzOrHavaleItem = '{0}'", that._GhabzOrHavaleItemID));
            that._StuffSerialNumberGridView.GetDataSource().data(that.StuffSerialNumberEntityList.ToDataSourceData());

            that._RemainingCountSerialNumberLabel.SetText("تعداد شماره سریال ثبت نشده : " +
                (that._StuffQuantity.ToNumber() - that.StuffSerialNumberEntityList.Entities.length).toString() + " ");

            that._StuffSerialNumberGridView.bind("SelectedRowsChanged", function (e) { that._StuffSerialNumberGridView_SelectedRowsChanged(e); });
        },

        _StuffSerialNumberGridView_SelectedRowsChanged: function (e) {
            var that = this;

            var selectedEntities = that._StuffSerialNumberGridView.GetSelectedRows();
            if (selectedEntities.length > 0) {

                for (var i = 0; i < that.StuffSerialNumberEntityList.Entities.length; i++) {
                    if (that.StuffSerialNumberEntityList.Entities[i].GetFieldValue("ID") == selectedEntities[0].DataItem["ID"]) {
                        that._SerialNumberTextBox.SetText(selectedEntities[0].DataItem["SerialNumber"]);
                        that._SerialNumberText = selectedEntities[0].DataItem["SerialNumber"];
                        that._SerialNumberTextBox.Focus();
                        setTimeout(function () {
                            that._SerialNumberTextBox.SelectText();
                        }, 600);
                    }
                }
            }
        },

        _SerialNumberTextBox_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                that._HandleEntityStatus();
            }
        },

        _HandleEntityStatus: function (imageButtonName) {
            var that = this;

            var selectedEntities = that._StuffSerialNumberGridView.GetSelectedRows();
            var serialNumberValue = that._SerialNumberTextBox.GetText();
            if (selectedEntities.length > 0) {

                if (!ValueIsEmpty(serialNumberValue) || imageButtonName == "Delete") {
                    for (var i = 0; i < that.StuffSerialNumberEntityList.Entities.length; i++) {
                        if (that.StuffSerialNumberEntityList.Entities[i].GetFieldValue("ID") == selectedEntities[0].DataItem["ID"]) {
                            that.StuffSerialNumberEntityList.Entities[i].ChangeStatus = imageButtonName == null ? "Modify" : imageButtonName;
                            that.StuffSerialNumberEntityList.Entities[i].SetFieldValue("SerialNumber", serialNumberValue);

                            if (afw.uiApi.EntityExists("wm.StuffSerialNumber", String.Format("ID = '{0}'", selectedEntities[0].DataItem["ID"])))
                                afw.uiApi.ApplyEntityChanges(that.StuffSerialNumberEntityList.Entities[i]);

                            if (imageButtonName == "Delete")
                                that.StuffSerialNumberEntityList.Entities.RemoveItem(i);

                            break;
                        }
                    }
                }
                else
                    afw.ErrorDialog.Show("لطفا شماره سریال کالا را وارد کنید");
            }
            else {
                if (!ValueIsEmpty(serialNumberValue)) {
                    if (that.StuffSerialNumberEntityList.Entities.length < that._StuffQuantity) {

                        var serialNumbers = [];
                        var dataOfRows = serialNumberValue.split(' ');
                        for (var i = 0; i < dataOfRows.length; i++) {
                            serialNumbers.push(dataOfRows[i].split(',')[0]);
                        }

                        for (var i = 0; i < serialNumbers.length; i++) {
                            for (var j = i + 1; j < serialNumbers.length; j++) {
                                if (serialNumbers[i] == serialNumbers[j]) {
                                    afw.ErrorDialog.Show(String.Format(".شماره سریال{0} تکراری می باشد", serialNumbers[j]));
                                    return;
                                }
                            }
                        }

                        for (var i = 0; i < that.StuffSerialNumberEntityList.Entities.length; i++) {
                            for (var j = 0; j < serialNumbers.length; j++) {
                                if (that.StuffSerialNumberEntityList.Entities[i].GetFieldValue("SerialNumber") == serialNumbers[j]) {
                                    afw.ErrorDialog.Show(String.Format("شماره سریال{0} قبلا ثبت شده است.", serialNumbers[j]));
                                    return;
                                }
                            }
                        }

                        for (var i = 0; i < serialNumbers.length; i++) {
                            var stuffSerialNumberEntity = afw.uiApi.CreateNewEntity("wm.StuffSerialNumber");
                            stuffSerialNumberEntity.SetFieldValue("GhabzOrHavaleItem", that._GhabzOrHavaleItemID);
                            stuffSerialNumberEntity.SetFieldValue("SerialNumber", serialNumbers[i]);

                            //afw.uiApi.ApplyEntityChanges(stuffSerialNumberEntity);

                            that.StuffSerialNumberEntityList.Entities.push(stuffSerialNumberEntity);
                        }
                    }
                    else
                        afw.ErrorDialog.Show("تعداد شماره سریال های وارد شده بیشتر از تعداد کالا ها می باشد");
                }
                else {
                    if (imageButtonName == "Delete")
                        afw.ErrorDialog.Show("سطری برای حذف انتخاب نشده است");
                    else if (imageButtonName == "Modify")
                        afw.ErrorDialog.Show("سطری برای ویرایش انتخاب نشده است");
                    else
                        afw.ErrorDialog.Show("لطفا شماره سریال کالا را وارد کنید");
                }
            }

            that._StuffSerialNumberGridView.GetDataSource().data(that.StuffSerialNumberEntityList.ToDataSourceData());
            that._SerialNumberTextBox.SetText(null);

            that._RemainingCountSerialNumberLabel.SetText("تعداد شماره سریال ثبت نشده : " +
                (that._StuffQuantity.ToNumber() - that.StuffSerialNumberEntityList.Entities.length).toString() + " ");
        },

        _ImageButton_Click: function (imageButtonName) {
            var that = this;

            if (imageButtonName == "Cancel") {
                that._StuffSerialNumberGridView.GetDataSource().data(that.StuffSerialNumberEntityList.ToDataSourceData());
                that._SerialNumberTextBox.SetText(null);
                that._SerialNumberTextBox.Focus();
            }
            else {
                that._HandleEntityStatus(imageButtonName);
            }
        },

        _GroupInsertEditFormWindow_Close: function (e) {
            var that = this;

            that.StuffSerialNumberEntityList = that._GroupInsertEditFormWindow.StuffSerialNumberEntityList;
            that._StuffSerialNumberGridView.GetDataSource().data(that.StuffSerialNumberEntityList.ToDataSourceData());
            that._RemainingCountSerialNumberLabel.SetText("تعداد شماره سریال ثبت نشده : " +
                (that._StuffQuantity.ToNumber() - (ValueIsEmpty(that.StuffSerialNumberEntityList) ? 0 :
                    that.StuffSerialNumberEntityList.Entities.length).toString() + " "));
        },

        _CancelImageButton_Click: function (e) {
            var that = this;

        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);

            setTimeout(function () {
                that._SerialNumberTextBox.Focus();
            }, 600);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.StuffsSerialNumberEditForm";
    FormClass.BaseType = afw.Window;


    wm.StuffsSerialNumberEditForm = FormClass;
})();