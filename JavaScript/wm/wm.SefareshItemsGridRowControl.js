(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return wm.SefareshItemsGridRowControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._IsInitForm = true;

            that._BindableEntity = options.RowEntity.ToBindableEntity();
            that._GridControl = options.GridControl;


            that._TextBoxName = "";

            that._StuffOrServiceLookupContainerPanel = that.FindControl("StuffOrServiceLookupContainerPanel");
            that._StuffOrServiceLookupControl = that.FindControl("StuffOrServiceLookupControl");
            that._QuantityTextBox = that.FindControl("QuantityTextBox");
            that._DescriptionTextBox = that.FindControl("DescriptionTextBox");
            that._RemoveButton = that.FindControl("RemoveButton");

            that.FindControl("RowNumberLabel").InitDataBinding(that._BindableEntity);
            that._QuantityTextBox.InitDataBinding(that._BindableEntity);
            that._DescriptionTextBox.InitDataBinding(that._BindableEntity);

            if ("IsActiveBarCode" in options && options.IsActiveBarCode)
                that._IsActiveBarCode = true;
            else
                that._IsActiveBarCode = false;

            if ("BarCodeLen" in options && options.BarCodeLen)
                that._BarCodeLen = options.BarCodeLen;
            else
                that._BarCodeLen = null;

            that._AdjustStuffOrServiceLookupControl();

            that.AdjustColor();

            that._RemoveButton.bind("Click", function (e) { that._RemoveButton_Click(e); });
            that._StuffOrServiceLookupControl.GetAutoComplete().bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._QuantityTextBox.Focus();
                }
            });
            that._QuantityTextBox.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._DescriptionTextBox.Focus();
                }
            });

            that._DescriptionTextBox.bind("KeyPressed", function (e) {
                if (e.Key == "Enter") {
                    that._FocusNextRow();
                }
            });

            that._StuffOrServiceLookupControl.GetAutoComplete().bind("TextChanged", function (e) {
                if (!ValueIsEmpty(that._BarCodeLen)) {
                    var enteredText = that._StuffOrServiceLookupControl.GetAutoComplete().GetText();
                    if (enteredText.length > that._BarCodeLen) {
                        var editedText = enteredText.substring(0, that._BarCodeLen);
                        that._StuffOrServiceLookupControl.GetAutoComplete().SetText(editedText);
                    }
                }
            });

            that._StuffOrServiceLookupControl.SetValue(that._BindableEntity.get("Stuff"));

            that._IsInitForm = false;
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        },

        _StuffOrServiceLookupControl_ValueChanged: function (e) {
            var that = this;
            var stuffID = null;

            if (that._StuffOrServiceLookupControlInitialized) {
                that._QuantityTextBox.SetText(null);
            }

            var stuffOrServiceID = that._StuffOrServiceLookupControl.GetValue();

            that._BindableEntity.set("Stuff", null);

            if (stuffOrServiceID != null) {
                var isStuff = afw.uiApi.EntityExists("cmn.Stuff", String.Format("ID = '{0}'", stuffOrServiceID));
                if (isStuff) {
                    that._BindableEntity.set("Stuff", stuffOrServiceID);
                }
                else
                    throw "Selected item not found in neither stuffs.";
            }

            stuffID = that._BindableEntity.get("Stuff");

            if (stuffID != null) {

                var savedStuff = $.grep(that._GridControl._RowsEntityList.Entities, function (o) {
                    return o.GetFieldValue("Stuff") === stuffID;
                });

                if (savedStuff.length > 1) {

                    var quantity = savedStuff[0].GetFieldValue("Quantity");
                    if (!ValueIsNumber(quantity))
                        quantity = quantity.ToNumber();

                    var index = that._GridControl._RowsEntityList.Entities.FindIndex(function (o) {
                        return o.GetFieldValue("Stuff") === stuffID;
                    });

                    savedStuff[0].SetFieldValue("Quantity", quantity + 1);

                    var rowControl = that._GridControl.GetRowByIndex(index);
                    rowControl.FindControl("QuantityTextBox").SetText(quantity + 1);

                    setTimeout(function () {
                        that._StuffOrServiceLookupControl.Focus();
                        that._StuffOrServiceLookupControl.SetValue(null)
                    }, 500);
                    return;
                }

                if (savedStuff.length == 1 && that._IsInitForm == false)
                    that._QuantityTextBox.SetText("1");
            }

        },

        _AdjustStuffOrServiceLookupControl: function () {
            var that = this;

            var stuffOrServiceLookupControl = that.FindControl("StuffOrServiceLookupControl");
            var controlCreated = false;


            if (stuffOrServiceLookupControl != null) {
                stuffOrServiceLookupControl.Destroy();
                stuffOrServiceLookupControl = null;
            }

            if (stuffOrServiceLookupControl == null) {
                stuffOrServiceLookupControl = new afw.SingleEntityLookupControl({
                    ParentControl: that._StuffOrServiceLookupContainerPanel,
                    Name: "StuffOrServiceLookupControl",
                    DataListFullName: "cmn.Stuffs",
                    EntityCaptionFieldName: "DisplayName",
                    LabelVisible: false,
                    FillParent: true,
                    HasEntityViewButton: false,
                    LookupWindowDefaultWidth: 1600,
                    ValueDataMember: "Stuff"
                });

                controlCreated = true;
            }

            if (controlCreated) {
                if (that._GridControl._ItemKindVisible == true) {
                    stuffOrServiceLookupControl.InitDataBinding(that._BindableEntity);
                }

                stuffOrServiceLookupControl.bind("ValueChanged", function (e) { that._StuffOrServiceLookupControl_ValueChanged(e); });
                that._StuffOrServiceLookupControl = stuffOrServiceLookupControl;
            }
        },

        _RemoveButton_Click: function (e) {
            var that = this;

            that._GridControl.RemoveRow(that);
        },

        ValidateRow: function () {
            var that = this;

            var validationError = null;
            var rowNumber = that._BindableEntity.get("RowNo");

            if (that._StuffOrServiceLookupControl.GetValue() == null) {
                validationError = String.Format("کالا در سطر {0} وارد نشده است.", rowNumber);
                _TextBoxName = "stuff";

            }
            else if (ValueIsEmpty(that._QuantityTextBox.GetText())) {
                validationError = String.Format("تعداد در سطر {0} وارد نشده است.", rowNumber);
                _TextBoxName = "quantity";
            }

            if (validationError == null) {
                _TextBoxName = "";
                return true;
            }
            else {
                var errorDialog = afw.ErrorDialog.Show(validationError);
                errorDialog.bind("Close", function (e) { that._ErrorDialog_Close(e); });
                return false;
            }
        },

        _ErrorDialog_Close: function (e) {
            var that = this;

            if (_TextBoxName == "stuff")
                setTimeout(function () {
                    that._StuffOrServiceLookupControl.Focus();
                }, 500);
            else if (_TextBoxName == "quantity")
                setTimeout(function () {
                    that._QuantityTextBox.Focus();
                }, 500);

        },

        _FocusNextRow: function () {
            var that = this;

            if (!that.ValidateRow())
                return;
            var rowIndex = that._BindableEntity.get("RowNo") - 1;
            var isLastRow = (rowIndex == that._GridControl.GetRowsCount() - 1);
            if (isLastRow)
                that._GridControl.AddEmptyItems(1);

            that._GridControl.GetRowByIndex(rowIndex + 1).Focus();
        },

        AdjustColor: function () {
            var that = this;

            var rowNumber = that._BindableEntity.get("RowNo");

            if (afw.BaseUtils.NumberIsOdd(rowNumber))
                that.SetBackColor("#ffffff");
            else
                that.SetBackColor("#f7f7f7");
        },

        GetBindableEntity: function () {
            var that = this;

            return that._BindableEntity;
        },

        Focus: function () {
            var that = this;

            that._StuffOrServiceLookupControl.Focus();
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.SefareshItemsGridRowControl";
    FormClass.BaseType = afw.BasePanel;


    wm.SefareshItemsGridRowControl = FormClass;
})();