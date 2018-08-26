(function () {
    var FormClass = afw.Window.extend({
        GetType: function () {
            return cmn.BarCodePrintForm;
        },

        init: function (options) {
            var that = this;

            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (formObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            that._FromCodeSearchTextBox = that.FindControl("FromCodeSearchTextBox");
            that._FromBarCodeSearchTextBox = that.FindControl("FromBarCodeSearchTextBox");
            that._FromNameSearchTextBox = that.FindControl("FromNameSearchTextBox"); 
            that._ToCodeSearchTextBox = that.FindControl("ToCodeSearchTextBox");
            that._ToBarCodeSearchTextBox = that.FindControl("ToBarCodeSearchTextBox");
            that._ToNameSearchTextBox = that.FindControl("ToNameSearchTextBox");

            that._FromStuffLookupControl = that.FindControl("FromStuffLookupControl");
            that._ToStuffLookupControl = that.FindControl("ToStuffLookupControl");
            that._CountTextBox = that.FindControl("CountTextBox");
            that._PrintButton = that.FindControl("PrintButton");

            that._FromCodeSearchTextBox.bind("TextChanged", function (e) { that._FromCodeSearchTextBox_TextChanged(e); });
            that._FromBarCodeSearchTextBox.bind("TextChanged", function (e) { that._FromBarCodeSearchTextBox_TextChanged(e); });
            that._FromNameSearchTextBox.bind("TextChanged", function (e) { that._FromNameSearchTextBox_TextChanged(e); });
            that._ToCodeSearchTextBox.bind("TextChanged", function (e) { that._ToCodeSearchTextBox_TextChanged(e); });
            that._ToBarCodeSearchTextBox.bind("TextChanged", function (e) { that._ToBarCodeSearchTextBox_TextChanged(e); });
            that._ToNameSearchTextBox.bind("TextChanged", function (e) { that._ToNameSearchTextBox_TextChanged(e); });

            that._FromStuffLookupControl.bind("ValueChanged", function (e) { that._FromStuffLookupControl_ValueChanged(e); });
            that._PrintButton.bind("Click", function (e) { that._PrintButton_Click(e); });

            that._FromStuffLookupControl.SetDataListFullName("cmn.StuffDefs");
            that._ToStuffLookupControl.SetDataListFullName("cmn.StuffDefs"); 
            that._FromStuffLookupControl.SetEntityCaptionFieldName("DisplayName");
            that._ToStuffLookupControl.SetEntityCaptionFieldName("DisplayName");
            that._FromStuffLookupControl.SetHasEntityViewButton(false);
            that._ToStuffLookupControl.SetHasEntityViewButton(false);

            that._CountTextBox.SetText(1);
        },

        _FromCodeSearchTextBox_TextChanged: function (e) {
            var that = this;

            that._FromCodeAndBarCodeAndNameSearch();
        },

        _FromBarCodeSearchTextBox_TextChanged: function (e) {
            var that = this;

            that._FromCodeAndBarCodeAndNameSearch();
        },

        _FromNameSearchTextBox_TextChanged: function (e) {
            var that = this;

            that._FromCodeAndBarCodeAndNameSearch();
        },

        _ToCodeSearchTextBox_TextChanged: function (e) {
            var that = this;

            that._ToCodeAndBarCodeAndNameSearch();
        },

        _ToBarCodeSearchTextBox_TextChanged: function (e) {
            var that = this;

            that._ToCodeAndBarCodeAndNameSearch();
        },

        _ToNameSearchTextBox_TextChanged: function (e) {
            var that = this;

            that._ToCodeAndBarCodeAndNameSearch();
        },

        _FromCodeAndBarCodeAndNameSearch: function () {
            var that = this;

            var code = that._FromCodeSearchTextBox.GetText();
            var barCode = that._FromBarCodeSearchTextBox.GetText();
            var name = that._FromNameSearchTextBox.GetText();
            var baseFilterExpression = "";

            if (!ValueIsEmpty(code) || !ValueIsEmpty(barCode) || !ValueIsEmpty(name)) {
                code = code.Replace(",", "");
                barCode = barCode.Replace(",", "");

                if (!ValueIsEmpty(code)) {
                    if (!ValueIsEmpty(baseFilterExpression))
                        baseFilterExpression += " and ";
                    baseFilterExpression += String.Format("Code Like N'%{0}%'", code);
                }

                if (!ValueIsEmpty(barCode)) {
                    if (!ValueIsEmpty(baseFilterExpression))
                        baseFilterExpression += " and ";
                    baseFilterExpression += String.Format("BarCode Like N'%{0}%'", barCode);
                }

                if (!ValueIsEmpty(name)) {
                    if (!ValueIsEmpty(baseFilterExpression))
                        baseFilterExpression += " and ";
                    baseFilterExpression += String.Format("Name Like N'%{0}%'", name);
                }

                that._FromStuffLookupControl.SetBaseFilterExpression(baseFilterExpression); 
            }
        },

        _ToCodeAndBarCodeAndNameSearch: function () {
            var that = this;

            var code = that._ToCodeSearchTextBox.GetText();
            var barCode = that._ToBarCodeSearchTextBox.GetText();
            var name = that._ToNameSearchTextBox.GetText();
            var baseFilterExpression = "";

            if (!ValueIsEmpty(code) || !ValueIsEmpty(barCode) || !ValueIsEmpty(name)) {
                code = code.Replace(",", "");
                barCode = barCode.Replace(",", "");
                 
                if (!ValueIsEmpty(code)) {
                    if (!ValueIsEmpty(baseFilterExpression))
                        baseFilterExpression += " and ";
                    baseFilterExpression += String.Format("Code Like N'%{0}%'", code); 
                }

                if (!ValueIsEmpty(barCode)) {
                    if (!ValueIsEmpty(baseFilterExpression))
                        baseFilterExpression += " and ";
                    baseFilterExpression += String.Format("BarCode Like N'%{0}%'", barCode);
                }

                if (!ValueIsEmpty(name)) {
                    if (!ValueIsEmpty(baseFilterExpression))
                        baseFilterExpression += " and ";
                    baseFilterExpression += String.Format("Name Like N'%{0}%'", name);
                }
                  
                that._ToStuffLookupControl.SetBaseFilterExpression(baseFilterExpression); 
            }
        },

        _FromStuffLookupControl_ValueChanged: function(e){
            var that = this;

            if (!ValueIsEmpty(that._FromStuffLookupControl.GetValue())) {
                var fromStuffID = that._FromStuffLookupControl.GetValue();
                that._ToStuffLookupControl.SetValue(fromStuffID);
            }
        },

        _PrintButton_Click: function (e) {
            var that = this;
 
            var fromStuffID = that._FromStuffLookupControl.GetValue();
            var toStuffID = that._FromStuffLookupControl.GetValue();
            var printCount = that._CountTextBox.GetText();
             
            if (!ValueIsEmpty(fromStuffID) &&
                !ValueIsEmpty(toStuffID) &&
                !ValueIsEmpty(printCount)) {

                var fromStuffCode = afw.uiApi.FetchEntity("cmn.StuffDef",
                String.Format("ID = '{0}'", fromStuffID)).GetFieldValue("Code");
                var toStuffCode = afw.uiApi.FetchEntity("cmn.StuffDef",
                    String.Format("ID = '{0}'", toStuffID)).GetFieldValue("Code");

                afw.uiApi.ShowProgress(that);
                afw.ReportHelper.RunReport("cmn.BarCodePrintReport",
                    ["FromStuffCode", "ToStuffCode", "PrintCount"],
                    [fromStuffCode, toStuffCode, printCount],
                    null,
                    function (result) {
                        afw.uiApi.HideProgress(that);
                    });

                that.Close();
            }
            else
                afw.ErrorDialog.Show("نام کالا را انتخاب کنید");
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

    FormClass.TypeName = "cmn.BarCodePrintForm";
    FormClass.BaseType = afw.Window;


    cmn.BarCodePrintForm = FormClass;
})();