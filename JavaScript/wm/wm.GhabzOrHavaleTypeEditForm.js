(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return wm.GhabzOrHavaleTypeEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._WarehouseDocTypeFieldControl = that.FindControl("WarehouseDocTypeFieldControl");
            that._ReferenceDocTypeFieldControl = that.FindControl("ReferenceDocTypeFieldControl");
            that._ReferenceDocTypeLookupControl = that._ReferenceDocTypeFieldControl.FindControl("InnerControl");
            that._TitleFieldControl = that.FindControl("TitleFieldControl");
            that._TitleTextBox = that._TitleFieldControl.FindControl("InnerControl");
            that._NameFieldControl = that.FindControl("NameFieldControl");
            that._HasWarehouseKeeperNotesFieldControl = that.FindControl("HasWarehouseKeeperNotesFieldControl");
            that._Havale_HasSendTimeFieldControl = that.FindControl("Havale_HasSendTimeFieldControl");
            that._Havale_HasSendTypeFieldControl = that.FindControl("Havale_HasSendTypeFieldControl");
            that._Havale_HasNameTahvilgirandehAzAnbarFieldControl = that.FindControl("Havale_HasNameTahvilgirandehAzAnbarFieldControl");
            that._Havale_HasTelephoneTahvilgirandehAzAnbarFieldControl = that.FindControl("Havale_HasTelephoneTahvilgirandehAzAnbarFieldControl");
            that._Havale_HasNameTahvilgirandehTarafMoshtariFieldControl = that.FindControl("Havale_HasNameTahvilgirandehTarafMoshtariFieldControl");
            that._Havale_HasTelephoneTahvilgirandehTarafeMoshtariFieldControl = that.FindControl("Havale_HasTelephoneTahvilgirandehTarafeMoshtariFieldControl");
            that._Havale_HasShomarehBarnamehFieldControl = that.FindControl("Havale_HasShomarehBarnamehFieldControl");
            that._Havale_CheckStuffStockFieldControl = that.FindControl("Havale_CheckStuffStockFieldControl");
            that._CanIssueAccDoc = that.FindControl("CanIssueAccDocFieldControl");
            that._NahveRialiNemodanFieldControl = that.FindControl("NahveRialiNemodanFieldControl");
            that._WareHouseDocRialiReferenceTypeFieldControl = that.FindControl("WareHouseDocRialiReferenceTypeFieldControl");

            that._WarehouseDocTypeFieldControl.bind("ValueChanged", function (e) { that._WarehouseDocTypeFieldControl_ValueChanged(); });
            that._NahveRialiNemodanFieldControl.bind("ValueChanged", function (e) { that._NahveRialiNemodanFieldControl_ValueChanged(); });
            that._CanIssueAccDoc.bind("ValueChanged", function (e) { that._CanIssueAccDoc_ValueChanged(); });

            that._WarehouseDocTypeName = null;

            that._IsUserDefined = that._BindableEntity.get("IsUserDefined");
        },

        _NahveRialiNemodanFieldControl_ValueChanged:function(e){
            var that = this;

            that._AdjustForm();
        },

        _CanIssueAccDoc_ValueChanged: function (e) {
            var that = this;

            that._AdjustForm();
        },

        _SetBindableEntityFieldsToNull: function () {
            var that = this;

            that._BindableEntity.set("AuthorizedSystemUsers", null);
            that._BindableEntity.set("SetStuffsSerialNumberIsRequiered", false);
            that._BindableEntity.set("Havale_CheckStuffStock", false);
            that._BindableEntity.set("HasWarehouseKeeperNotes", false);
            that._BindableEntity.set("Havale_HasNameTahvilgirandehAzAnbar", false);
            that._BindableEntity.set("Havale_HasNameTahvilgirandehTarafMoshtari", false);
            that._BindableEntity.set("Havale_HasSendTime", false);
            that._BindableEntity.set("Havale_HasSendType", false);
            that._BindableEntity.set("Havale_HasTelephoneTahvilgirandehAzAnbar", false);
            that._BindableEntity.set("Havale_HasTelephoneTahvilgirandehTarafeMoshtari", false);
            that._BindableEntity.set("MasterBatchNumber", false);
            that._BindableEntity.set("Name", null);
            that._BindableEntity.set("WareHouseDocRialiReferenceType", null);
            that._BindableEntity.set("Quantity", false);
            that._BindableEntity.set("Stuff", false);
        },

        _WarehouseDocTypeFieldControl_ValueChanged: function () {
            var that = this;

            that._SetBindableEntityFieldsToNull();

            that._AdjustWarehouseDocTypeControl();

            if (that._WarehouseDocTypeFieldControl.GetValue() == null) {
                that._WarehouseDocTypeName = null;
                return;
            }

            that._WarehouseDocTypeName = afw.OptionSetHelper.GetOptionSetItemName(that._WarehouseDocTypeFieldControl.GetValue());

            if (that._WarehouseDocTypeName == "Ghabz")
                that._ReferenceDocTypeLookupControl.SetBaseFilterExpression("EmkaneSodoreGhabzVorod = 1");

            if (that._WarehouseDocTypeName == "Havale") {
                that._ReferenceDocTypeLookupControl.SetBaseFilterExpression("EmkaneSodoreHavaleKhoroj = 1");
                that._BindableEntity.set("Havale_CheckStuffStock", true);
            }

            that._AdjustForm();
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);

            setTimeout(function () {
                that._TitleTextBox.Focus();
            }, 600);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _AdjustWarehouseDocTypeControl: function () {
            var that = this;

            if (that._WarehouseDocTypeName == "Ghabz") {
                that._Havale_HasSendTimeFieldControl.SetVisible(false);
                that._Havale_HasSendTypeFieldControl.SetVisible(false);
                that._Havale_HasNameTahvilgirandehAzAnbarFieldControl.SetVisible(false);
                that._Havale_HasTelephoneTahvilgirandehAzAnbarFieldControl.SetVisible(false);
                that._Havale_HasNameTahvilgirandehTarafMoshtariFieldControl.SetVisible(false);
                that._Havale_HasTelephoneTahvilgirandehTarafeMoshtariFieldControl.SetVisible(false);
                that._Havale_HasShomarehBarnamehFieldControl.SetVisible(false);
                that._Havale_CheckStuffStockFieldControl.SetVisible(false);
            }

            if (that._WarehouseDocTypeName == "Havale") {
                that._Havale_HasSendTimeFieldControl.SetVisible(true);
                that._Havale_HasSendTypeFieldControl.SetVisible(true);
                that._Havale_HasNameTahvilgirandehAzAnbarFieldControl.SetVisible(true);
                that._Havale_HasTelephoneTahvilgirandehAzAnbarFieldControl.SetVisible(true);
                that._Havale_HasNameTahvilgirandehTarafMoshtariFieldControl.SetVisible(true);
                that._Havale_HasTelephoneTahvilgirandehTarafeMoshtariFieldControl.SetVisible(true);
                that._Havale_HasShomarehBarnamehFieldControl.SetVisible(true);
                that._Havale_CheckStuffStockFieldControl.SetVisible(true);
            }
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);

            that._AdjustFormValues();

            that._AdjustWarehouseDocTypeControl();

            if (that._IsUserDefined)
                that._NameFieldControl.SetVisible(false);
            else {
                that._ReferenceDocTypeFieldControl.SetReadOnly(true);
                that._TitleFieldControl.SetReadOnly(true);

            }

            if (that._FormMode == "Edit")
                that._WarehouseDocTypeFieldControl.SetReadOnly(true);

            if (that._NahveRialiNemodanFieldControl.GetValue() != null) {
                var nahveRialiNemodanName = afw.OptionSetHelper.GetOptionSetItemName(that._NahveRialiNemodanFieldControl.GetValue());
                if (ValueIsIn(nahveRialiNemodanName, ["SanadReference", "SarjameReference"]))
                    that._WareHouseDocRialiReferenceTypeFieldControl.SetReadOnly(false);
                else
                    that._WareHouseDocRialiReferenceTypeFieldControl.SetReadOnly(true);
            }
            else
                that._WareHouseDocRialiReferenceTypeFieldControl.SetReadOnly(true);
        },

        _AdjustFormValues: function () {
            var that = this;

            if (that._FormMode == "Edit")
                that._WarehouseDocTypeName = afw.OptionSetHelper.GetOptionSetItemName(that._WarehouseDocTypeFieldControl.GetValue());

            if (!that._IsUserDefined)
                that._HasWarehouseKeeperNotesFieldControl.SetValue(true);

            if (that._NahveRialiNemodanFieldControl.GetValue() != null) {
                var nahveRialiNemodanName = afw.OptionSetHelper.GetOptionSetItemName(that._NahveRialiNemodanFieldControl.GetValue());
                if (!ValueIsIn(nahveRialiNemodanName, ["SanadReference", "SarjameReference"]))
                    that._WareHouseDocRialiReferenceTypeFieldControl.SetValue(null);
            }
            else
                that._WareHouseDocRialiReferenceTypeFieldControl.SetValue(null);
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

    FormClass.TypeName = "wm.GhabzOrHavaleTypeEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    wm.GhabzOrHavaleTypeEditForm = FormClass;
})();