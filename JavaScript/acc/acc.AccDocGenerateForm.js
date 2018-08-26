(function () {
    var FormClass = afw.Window.extend({
        GetType: function () {
            return acc.AccDocGenerateForm;
        },

        init: function (options) {
            var that = this;

            that._FinancialYearID = cmn.GetUserActiveFinancialYearID();

            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (formObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            that.AccDocGeneratedEntity = 0;

            if ("OperationType" in options)
                that._OperationType = options.OperationType;
            else
                that._OperationType = null;

            if ("ItemID" in options)
                that._ItemID = options.ItemID;
            else
                that._ItemID = null;

            if ("ItemNumber" in options)
                that._ItemNumber = options.ItemNumber;
            else
                that._ItemNumber = null;

            that._IssueDateControl = that.FindControl("IssueDateControl");
            that._DescriptionTextBox = that.FindControl("DescriptionTextBox");
            that._OkButton = that.FindControl("OkButton");
            that._CancelButton = that.FindControl("CancelButton");

            that._OkButton.bind("Click", function (e) { that._OkButton_Click(e); });
            that._CancelButton.bind("Click", function (e) { that._CancelButton_Click(e); });

            that._IssueDateControl.SetValue(afw.DateTimeHelper.GetServerDateTime().split(' ')[0]);

            if (that._OperationType == "Tankhah") {   
                that._DescriptionTextBox.SetText("بابت تنخواه شماره " + that._ItemNumber);
            }

            if (that._OperationType == "FinancialDeclaration")
                that._DescriptionTextBox.SetText("بابت ثبت اعلامیه مالی مورخ " + options.IssueDate.split(' ')[0]);
        },

        _OkButton_Click: function(e){
            var that = this;

            try { 
                var issueDate = that._IssueDateControl.GetValue();
                var description = that._DescriptionTextBox.GetText();

                if (that._OperationType == "FinancialDeclaration") {
                    that.AccDocGeneratedEntity = afw.uiApi.CallServerMethodSync("cc.FinancialDeclarationAccDocGenerate",
                        [that._ItemID, issueDate, description]);
                }
                else {
                    that.AccDocGeneratedEntity = afw.uiApi.CallServerMethodSync("rp.TankhahAccDocGenerate",
                        [false, that._ItemID, that._OperationType, issueDate, description]);
                }

                that.SetDialogResult("Ok");
                that.Close();
            }
            catch (ex) {
                afw.ErrorDialog.Show("ثبت سند انجام نشد" + ex.ErrorDetails);
            }
        },

        _CancelButton_Click: function (e) {
            var that = this;

            that.Close();
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "acc.AccDocGenerateForm";
    FormClass.BaseType = afw.Window;


    acc.AccDocGenerateForm = FormClass;
})();