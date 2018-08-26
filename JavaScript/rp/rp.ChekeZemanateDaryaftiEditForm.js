(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return rp.ChekeZemanateDaryaftiEditForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            if (ValueIsEmpty(options.Entity))
                throw "Entity is not set.";

            that._BindableEntity = options.Entity.ToBindableEntity();

            that._ParentEntity = that.GetContainerWindow()._BindableEntity;

            that.InitDataBinding(that._BindableEntity);

            that._BindableEntity.bind("change", function (e) { that._BindableEntity_change(e); });

            that._SetPreviewImage("DocImage");

            that._PayerFieldControl = that.FindControl("PayerFieldControl");
            that._PayerFieldControl.bind("ValueChanged", function (e) { that._PayerFieldControl_ValueChanged(e); });
            that._Payer_AutoComplete = that._PayerFieldControl.FindControl("InnerControl").GetAutoComplete();
            that._Payer_AutoComplete.bind("KeyPressed", function (e) { that._Control_KeyPressed(e); });
            //that._Payer_AutoComplete.Focus();

            that._NumberFieldControl = that.FindControl("NumberFieldControl");
            that._NumberFieldControl_InnerControl = that._NumberFieldControl.FindControl("InnerControl");
            that._NumberFieldControl_InnerControl.bind("TextChanged", function (e) { that._NumberFieldControl_InnerControl_TextChanged(e); });
            that._NumberFieldControl_InnerControl.bind("KeyPressed", function (e) { that._Control_KeyPressed(e); });

            that._RadifeDaftareChekFieldControl = that.FindControl("RadifeDaftareChekFieldControl");
            that._RadifeDaftareChekFieldControl_InnerControl = that._RadifeDaftareChekFieldControl.FindControl("InnerControl");
            that._RadifeDaftareChekFieldControl_InnerControl.bind("KeyPressed", function (e) { that._Control_KeyPressed(e); });

            that._BankFieldControl = that.FindControl("BankFieldControl");
            that._BankFieldControl.bind("ValueChanged", function (e) { that._BankFieldControl_ValueChanged(e); });

            that._DueDateFieldControl = that.FindControl("DueDateFieldControl");
            that._DueDateFieldControl.bind("ValueChanged", function (e) { that._DueDateFieldControl_ValueChanged(e); });

            that._AmountFieldControl = that.FindControl("AmountFieldControl");
            that._AmountFieldControl_InnerControl = that._AmountFieldControl.FindControl("InnerControl");
            that._AmountFieldControl_InnerControl.bind("TextChanged", function (e) { that._AmountFieldControl_InnerControl_TextChanged(e); });
            that._AmountFieldControl_InnerControl.bind("KeyPressed", function (e) { that._Control_KeyPressed(e); });

            that._DescriptionTextBox = that.FindControl("DescriptionTextBox");
        },

        _NumberFieldControl_InnerControl_TextChanged: function (e) {
            var that = this;

            that._RefreshDescription();
        },

        _PayerFieldControl_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._PayerFieldControl.GetValue()))
                that._ParentEntity.set("Creditor_Person", that._PayerFieldControl.GetValue())

            that._RefreshDescription();
        },

        _BankFieldControl_ValueChanged: function (e) {
            var that = this;

            that._RefreshDescription();
        },

        _DueDateFieldControl_ValueChanged: function (e) {
            var that = this;

            that._RefreshDescription();
        },

        _AmountFieldControl_InnerControl_TextChanged: function (e) {
            var that = this;

            that._RefreshDescription();
        },

        _Control_KeyPressed: function (e) {
            var that = this;

            if (e.Key == "Enter") {
                if (e.Sender == that._Payer_AutoComplete)
                    that._NumberFieldControl_InnerControl.Focus();
                else if (e.Sender == that._NumberFieldControl_InnerControl) {
                    //bank
                }

                // else if (e.Sender == bank)
                //radife chek

                else if (e.Sender == that._RadifeDaftareChekFieldControl_InnerControl) {
                    //date
                }

                // else if (e.Sender == date)
                //mablagh

                else if (e.Sender == that._AmountFieldControl_InnerControl) {
                    //دکمه ثبت وجدید
                }

            }
        },

        _BindableEntity_change: function (e) {
            var that = this;

            if (e.field == "DocImage")
                that._SetPreviewImage("DocImage");
        },

        GetBindableEntity: function () {
            var that = this;

            return that._BindableEntity;
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        },

        _SetPreviewImage: function (fieldName) {
            var that = this;

            var imageFileID = that._BindableEntity.get(fieldName);

            if (imageFileID == null)
                that.FindControl(fieldName + "PreviewPanel").SetBackgroundImage(null);
            else {
                try {
                    that.FindControl(fieldName + "PreviewPanel").SetBackgroundImage(
                        String.Format("ServerStoredFile({0})", imageFileID));
                }
                catch (ex) {
                    afw.ErrorDialog.Show(ex);
                }
            }
        },

        _RefreshDescription: function () {
            var that = this;

            var number = that._NumberFieldControl.FindControl("InnerControl").GetText();
            var payerName = that._PayerFieldControl.FindControl("InnerControl").GetAutoComplete().GetText();
            var dueDate = that._DueDateFieldControl.GetValue();
            if (ValueIsEmpty(dueDate)) {
                dueDate = " ";
            }
            else
                dueDate = afw.DateTimeHelper.GregorianToJalali(dueDate);

            var bankName = that._BankFieldControl.FindControl("InnerControl").GetDropDownList().GetText();
            var amount = that._AmountFieldControl.FindControl("InnerControl").GetText();

            var desc = String.Format("چک ضمانت دریافتی به شماره {0}، پرداخت کننده {1}، تاریخ چک {2}، بانک {3}، مبلغ {4}",
                                    number, payerName, dueDate, bankName, amount);

            that._DescriptionTextBox.SetValue(desc);
        },

        SetFocus: function () {
            var that = this;

            if (that._PayerFieldControl.GetValue() == null)
                that._Payer_AutoComplete.Focus();
            else
                that._NumberFieldControl_InnerControl.Focus();
        },

        SetPayer: function (payerID) {
            var that = this;

            that._PayerFieldControl.SetValue(payerID);
        },

        SetPayerReadonly: function () {
            var that = this;

            if (!that._PayerFieldControl.GetReadOnly())
                that._PayerFieldControl.SetReadOnly(true);
        },

        SetPersonFilter: function (filter) {
            var that = this;

            that._PayerFieldControl.FindControl("InnerControl").SetBaseFilterExpression(filter);
        },

        SetBindableEntityFieldsToNull: function () {
            var that = this;

            //that._BindableEntity.set("Number", null);
            //that._BindableEntity.set("Bank", null);
            //that._BindableEntity.set("RadifeDaftareChek", null);
            //that._BindableEntity.set("Amount", null); 
            //that._BindableEntity.set("NoeChekeZemanat", null);

            that._RefreshDescription();
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.ChekeZemanateDaryaftiEditForm";
    FormClass.BaseType = afw.BasePanel;


    rp.ChekeZemanateDaryaftiEditForm = FormClass;
})();