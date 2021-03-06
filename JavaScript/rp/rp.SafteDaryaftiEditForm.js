﻿(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return rp.SafteDaryaftiEditForm;
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

            that._ShomareSafteFieldControl = that.FindControl("ShomareSafteFieldControl");
            that._ShomareSafteFieldControl_InnerControl = that._ShomareSafteFieldControl.FindControl("InnerControl");
            that._ShomareSafteFieldControl_InnerControl.bind("TextChanged", function (e) { that._ShomareSafteFieldControl_InnerControl_TextChanged(e); });

            that._PayerFieldControl = that.FindControl("PayerFieldControl");
            that._PayerFieldControl.bind("ValueChanged", function (e) { that._PayerFieldControl_ValueChanged(e); });
            that._Payer_AutoComplete = that._PayerFieldControl.FindControl("InnerControl").GetAutoComplete();

            that._AmountFieldControl = that.FindControl("AmountFieldControl");
            that._AmountFieldControl_InnerControl = that._AmountFieldControl.FindControl("InnerControl");
            that._AmountFieldControl_InnerControl.bind("TextChanged", function (e) { that._AmountFieldControl_InnerControl_TextChanged(e); });

            that._DescriptionTextBox = that.FindControl("DescriptionTextBox");
        },

        _ShomareSafteFieldControl_InnerControl_TextChanged: function (e) {
            var that = this;

            that._RefreshDescription();
        },

        _PayerFieldControl_ValueChanged: function (e) {
            var that = this;

            if (!ValueIsEmpty(that._PayerFieldControl.GetValue()))
                that._ParentEntity.set("Creditor_Person", that._PayerFieldControl.GetValue());

            that._RefreshDescription();
        },

        _AmountFieldControl_InnerControl_TextChanged: function (e) {
            var that = this;

            that._RefreshDescription();
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

            var shomareSafte = that._ShomareSafteFieldControl.FindControl("InnerControl").GetText();
            var payerName = that._PayerFieldControl.FindControl("InnerControl").GetAutoComplete().GetText();
            var amount = that._AmountFieldControl.FindControl("InnerControl").GetText();

            var desc = String.Format("سفته دریافتی به شماره {0}، پرداخت کننده {1}، مبلغ {2}",
                                    shomareSafte, payerName, amount);

            that._DescriptionTextBox.SetValue(desc);
        },

        SetFocus: function () {
            var that = this;

            if (that._PayerFieldControl.GetValue() == null)
                that._Payer_AutoComplete.Focus();
            else
                that._ShomareSafteFieldControl_InnerControl.Focus();
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

            //that._BindableEntity.set("ShomareSafte", null);
            //that._BindableEntity.set("Amount", null);
            //that._BindableEntity.set("DocImage", null);

            that._RefreshDescription();
        }
    });

    //Static Members:

    FormClass.TypeName = "rp.SafteDaryaftiEditForm";
    FormClass.BaseType = afw.BasePanel;


    rp.SafteDaryaftiEditForm = FormClass;
})();