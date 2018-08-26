(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.StuffDefEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._MainCategoryLookupControl = that.FindControl("MainCategoryLookupControl");
            that._SubCategoryFieldControl = that.FindControl("SubCategoryFieldControl");
            that._MainMeasurementUnitFieldControl = that.FindControl("MainMeasurementUnitFieldControl");
            that._Custom_ParentStuffLabelFieldControl = that.FindControl("Custom_ParentStuffLabelFieldControl");
            that._StuffLabelFieldControl = that.FindControl("StuffLabelFieldControl").FindControl("InnerControl");
            that._StuffLabelFieldControl.SetHasEntityViewButton(false);

            if (that._FormMode == "New") {
                try {
                    that._CodeFieldControl = that.FindControl("CodeFieldControl");
                    that._Custom_SecondaryCodeFieldControl = that.FindControl("Custom_SecondaryCodeFieldControl");

                    var lastCodes = afw.uiApi.CallServerMethodSync("cmn.GetStuffDefFieldsMaxIntValue");

                    that._CodeFieldControl.SetValue(lastCodes.GetFieldValue("MaxCode") + 1);
                    that._Custom_SecondaryCodeFieldControl.SetValue(lastCodes.GetFieldValue("MaxCustom_SecondaryCode") + 1);

                    var stuffMainCategoryEntityList = afw.uiApi.FetchEntityList("cmn.StuffMainCategory");
                    var stuffSubCategoryEntityList = afw.uiApi.FetchEntityList("cmn.StuffSubCategory");
                    var measurementUnitEntityList = afw.uiApi.FetchEntityList("cmn.MeasurementUnit");

                    that._MainCategoryLookupControl.SetValue(stuffMainCategoryEntityList.Entities[0].GetFieldValue("ID"));

                    var stuffSubCategory = $.grep(stuffSubCategoryEntityList.Entities, function (o) {
                        return o.GetFieldValue("MainCategory") === stuffMainCategoryEntityList.Entities[0].GetFieldValue("ID");
                    });
                    that._SubCategoryFieldControl.SetValue(stuffSubCategory[0].GetFieldValue("ID"));

                    that._MainMeasurementUnitFieldControl.SetValue(measurementUnitEntityList.Entities[0].GetFieldValue("ID"));

                    that._StuffLabelFieldControl.SetReadOnly(true);
                }
                catch (ex) {
                }
            }
            else {
                var subCategory = afw.uiApi.FetchEntityByID("cmn.StuffSubCategory", that._BindableEntity.get("SubCategory"));
                that._MainCategoryLookupControl.SetValue(subCategory.GetFieldValue("MainCategory"));

                that._StuffLabelsStatuses(); 
            }

            that._MainCategoryLookupControl.SetShowRequiredStar(true);
            that._MainCategoryLookupControl.bind("ValueChanged", function (e) { that._MainCategoryLookupControl_ValueChanged(e); });
            that._Custom_ParentStuffLabelFieldControl.bind("ValueChanged", function (e) { that._Custom_ParentStuffLabelFieldControl_ValueChanged(); }); 
        },

        _MainCategoryLookupControl_ValueChanged: function (e) {
            var that = this;

            that._SubCategoryFieldControl.SetValue(null);

            var mainCategoryID = that._MainCategoryLookupControl.GetValue();

            if (!ValueIsEmpty(mainCategoryID)) {
                that._SubCategoryFieldControl.FindControl("InnerControl").SetBaseFilterExpression(
                    String.Format("MainCategory = '{0}'", mainCategoryID));
            }

            that._AdjustForm();
        },

        _Custom_ParentStuffLabelFieldControl_ValueChanged: function () {
            var that = this;

            that._StuffLabelFieldControl.SetValue(null);

            that._StuffLabelsStatuses();
        },

        _StuffLabelsStatuses: function () {
            var that = this;
             
            var parentStuffLabelID = that._Custom_ParentStuffLabelFieldControl.GetValue();

            if (!ValueIsEmpty(parentStuffLabelID)) {
                that._StuffLabelFieldControl.SetReadOnly(false);

                that._StuffLabelFieldControl.SetBaseFilterExpression(String.Format("ParentStuffLabel = '{0}'", parentStuffLabelID));
            }
            else
                that._StuffLabelFieldControl.SetReadOnly(true);
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);

            var mainCategoryID = that._MainCategoryLookupControl.GetValue();

            if (ValueIsEmpty(mainCategoryID)) {
                that._SubCategoryFieldControl.SetReadOnly(true);
            }
            else {
                that._SubCategoryFieldControl.SetReadOnly(false);
            }
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            return true;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.StuffDefEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.StuffDefEditForm = FormClass;
})();