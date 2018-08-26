(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.ReceivedCallEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._receivedCallID = that._BindableEntity._Entity.FieldValues.ID;
            that._callPersonID = that._BindableEntity._Entity.FieldValues.CallPerson;
            that._callNumber = that._BindableEntity._Entity.FieldValues.CallNumber;

            that._salesCaseControl = that.FindControl("SalesCaseFieldControl").FindControl("InnerControl");
            that._callPersonControl = that.FindControl("CallPersonFieldControl").FindControl("InnerControl");

            if (that._Name == "ReceivedCallEditFormWindowForSalesCase") {
                that._callPersonControl.SetVisible(false);
            }
            else if (that._Name = "ReceivedCallEditFormWindowForPerson") {
                that._salesCaseControl.SetVisible(false);
            }
        },
         
        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            return true;
        },

        _Save: function () {
            var that = this;

            try {
                if (that._ValidateForm()) {

                    if (that._Name = "ReceivedCallEditFormWindowForPerson") {

                        var personID = that._callPersonControl.GetValue();

                        afw.uiApi.CallServerMethodSync("cmn.SavePhoneNumberForPerson", [that._receivedCallID, that._callNumber, personID]);

                        that.DialogResult = "Ok";
                        that.Close();

                    }
                     
                    return true;
                }
                else
                    return false;
            }
            catch (ex) {
                afw.App.HandleError(ex);
                return false;
            }
             
            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.ReceivedCallEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.ReceivedCallEditForm = FormClass;
})();