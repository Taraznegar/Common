(function () {
    var FormClass = afw.Window.extend({
        GetType: function () {
            return wm.GroupInsertEditForm;
        },

        init: function (options) {
            var that = this;

            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (formObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            that.Center();

            that._GhabzOrHavaleItemID = options.GhabzOrHavaleItemID;
            that._StuffQuantity = options.StuffQuantity;
            that.StuffSerialNumberEntityList = options.StuffSerialNumberEntityList;

            that._ToolBarPanel = that.FindControl("ToolBarPanel");

            that._PreSerialNumberTextBox = that.FindControl("PreSerialNumberTextBox");
            that._SerialNumberFromTextBox = that.FindControl("SerialNumberFromTextBox");
            that._SerialNumberFromTextBox.SetShowRequiredStar(true);
            that._SerialNumberToTextBox = that.FindControl("SerialNumberToTextBox");
            that._SerialNumberToTextBox.SetShowRequiredStar(true);
            that._SaveButton = that.FindControl("SaveButton");

            that._SaveButton.bind("Click", function (e) { that._SaveButton_Click(e); });

            that._CreateToolbar();
        },

        _CreateToolbar: function () {
            var that = this;

            var toolBar = new afw.ToolBar({
                ParentControl: that._ToolBarPanel,
                Name: "ToolBar",

            });

            toolBar.AddButton("Close", "بستن", { Image: "resource(afw.ToolbarRedCross16)" });

            toolBar.bind("ButtonClick", function (e) { that._OnToolbarButtonClicked(e); });
        },

        _OnToolbarButtonClicked: function (e) {
            var that = this;

            if (e.ButtonKey == "Close") {
                that.Close();
            }
        },

        _SaveButton_Click: function (e) {
            var that = this;
            if (!ValueIsEmpty(that._SerialNumberFromTextBox.GetValue()) && 
                !ValueIsEmpty(that._SerialNumberToTextBox.GetValue())) {

                var remainingCountOfSerialNumber = that._StuffQuantity.ToNumber() 
                    - (ValueIsEmpty(that.StuffSerialNumberEntityList) ? 0 : that.StuffSerialNumberEntityList.Entities.length);
                var countOfSerialNumber = that._SerialNumberToTextBox.GetValue().ToNumber() - that._SerialNumberFromTextBox.GetValue().ToNumber();
                if (countOfSerialNumber > remainingCountOfSerialNumber) {
                    afw.ErrorDialog.Show("نمی توان یشتر از تعداد کالاها شماره سریال ثبت کرد");
                    return;
                }

                for (var i = 0; i < countOfSerialNumber; i++) {

                    var stuffSerialNumberEntity = afw.uiApi.CreateNewEntity("wm.StuffSerialNumber");
                    stuffSerialNumberEntity.SetFieldValue("GhabzOrHavaleItem", that._GhabzOrHavaleItemID);
                    stuffSerialNumberEntity.SetFieldValue("SerialNumber", that._PreSerialNumberTextBox.GetValue() == null ? that._SerialNumberFromTextBox.GetValue() + 1
                        : that._PreSerialNumberTextBox.GetValue() + (that._SerialNumberFromTextBox.GetValue().ToNumber() + i));

                    //afw.uiApi.ApplyEntityChanges(stuffSerialNumberEntity);

                    that.StuffSerialNumberEntityList.Entities.push(stuffSerialNumberEntity);
                }
                afw.MessageDialog.Show("ثبت با موفقیت انجام شده است");

                that._OnClosed();
            }
            else {
                afw.MessageDialog.Show("مقادیر شماره سریال ها را صحیح وارد کنید");
            }
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);

            setTimeout(function () {
                that._PreSerialNumberTextBox.Focus();
            }, 600);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.GroupInsertEditForm";
    FormClass.BaseType = afw.Window;


    wm.GroupInsertEditForm = FormClass;
})();